import base64
import json
import random
import re
import time
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import requests
from anthropic import Anthropic
from github import Github, GithubException

from src.config import settings


class GitHubAgentService:
    """
    Tool-using Claude agent that navigates a GitHub repo, implements
    A/B experiment code, and opens a PR.  Optimised for speed (tree cache,
    batch reads, batch commit) and correctness (preview-hash contract,
    framework pre-detection, forced first-turn tool use).
    """

    def __init__(self, github_token: str):
        self.github_client = Github(github_token)
        self.anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-sonnet-4-6"
        self.max_agent_turns = 25
        self.max_agent_retries = 5
        self.agent_max_tokens = 4096
        self.max_tool_result_chars = 8000
        self.max_history_messages = 20

        # Populated per-run so every tool call reuses the same data.
        self._cached_tree: Optional[List[str]] = None
        self._cached_tree_sha: Optional[str] = None
        # Staged writes collected here; flushed as a single commit.
        self._staged_writes: Dict[str, str] = {}

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _extract_json_from_response(self, text: str) -> Optional[Dict]:
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return None
        return None

    def _is_safe_repo_path(self, path: str) -> bool:
        if not path or path.startswith("/") or path.startswith("\\"):
            return False
        return ".." not in path.replace("\\", "/").split("/")

    def _get_tree(self, repo, branch_name: str) -> List[str]:
        """Return cached file-path list for the branch."""
        sha = repo.get_branch(branch_name).commit.sha
        if self._cached_tree is not None and self._cached_tree_sha == sha:
            return self._cached_tree
        tree = repo.get_git_tree(sha, recursive=True)
        self._cached_tree = [item.path for item in tree.tree if item.type == "blob"]
        self._cached_tree_sha = sha
        return self._cached_tree

    def _invalidate_tree_cache(self):
        self._cached_tree = None
        self._cached_tree_sha = None

    def _detect_framework(self, repo, branch: str) -> str:
        """Best-effort framework detection from package.json."""
        try:
            content = repo.get_contents("package.json", ref=branch)
            pkg = json.loads(content.decoded_content.decode("utf-8"))
            deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
            if "next" in deps:
                has_app_dir = any(p.startswith("app/") for p in self._get_tree(repo, branch))
                return "Next.js App Router" if has_app_dir else "Next.js Pages Router"
            if "react-router-dom" in deps or "react-router" in deps:
                return "React + React Router"
            if "vue" in deps:
                return "Vue"
            if "react" in deps:
                return "React (Vite/CRA)"
            return "Unknown JS framework"
        except Exception:
            return "Unknown"

    def _build_preseed_context(self, repo, branch: str, framework: str) -> str:
        """Pre-fetch file tree + key files so Claude skips discovery turns."""
        tree_paths = self._get_tree(repo, branch)
        tree_text = "\n".join(tree_paths[:300])

        key_files_content = ""
        candidates = ["package.json", "tsconfig.json"]
        # Auto-detect likely integration points
        integration_hints = [
            "app/layout.tsx", "app/layout.jsx", "app/layout.js",
            "app/page.tsx", "app/page.jsx",
            "src/App.tsx", "src/App.jsx", "src/App.js",
            "src/main.tsx", "src/main.jsx", "src/main.js",
            "pages/_app.tsx", "pages/_app.jsx",
            "src/routes.tsx", "src/router.tsx",
        ]
        for candidate in candidates + integration_hints:
            if candidate in tree_paths:
                try:
                    fc = repo.get_contents(candidate, ref=branch)
                    if not isinstance(fc, list):
                        decoded = fc.decoded_content.decode("utf-8")[:6000]
                        key_files_content += f"\n--- {candidate} ---\n{decoded}\n"
                except Exception:
                    pass

        return f"""<repo_context>
<framework>{framework}</framework>
<file_tree>
{tree_text}
</file_tree>
<key_files>{key_files_content}</key_files>
</repo_context>"""

    # ------------------------------------------------------------------
    # Batch commit via Git Data API
    # ------------------------------------------------------------------

    def _flush_staged_writes(self, repo, branch_name: str, commit_message: str) -> int:
        """Commit all staged writes as a single tree+commit. Returns files written."""
        if not self._staged_writes:
            return 0

        branch_ref = repo.get_git_ref(f"heads/{branch_name}")
        base_sha = branch_ref.object.sha
        base_commit = repo.get_git_commit(base_sha)
        base_tree_sha = base_commit.tree.sha

        tree_items = []
        for path, content in self._staged_writes.items():
            blob = repo.create_git_blob(content, "utf-8")
            tree_items.append({"path": path, "mode": "100644", "type": "blob", "sha": blob.sha})

        new_tree = repo.create_git_tree(tree_items, base_tree=repo.get_git_tree(base_tree_sha))
        new_commit = repo.create_git_commit(commit_message, new_tree, [base_commit])
        branch_ref.edit(new_commit.sha)

        count = len(self._staged_writes)
        self._staged_writes.clear()
        self._invalidate_tree_cache()
        return count

    # ------------------------------------------------------------------
    # Tool definitions
    # ------------------------------------------------------------------

    def _build_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "list_files",
                "description": "List repo files. Pre-seeded context already includes the full tree, so only call this if you need to re-check after writes.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "path_prefix": {"type": "string", "description": "e.g. 'app', 'src'"},
                        "limit": {"type": "integer", "minimum": 1, "maximum": 300, "default": 200}
                    }
                }
            },
            {
                "name": "read_file",
                "description": "Read one file. Key files are already pre-seeded; use for additional files you need.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string"},
                        "max_chars": {"type": "integer", "minimum": 200, "maximum": 20000, "default": 10000}
                    },
                    "required": ["path"]
                }
            },
            {
                "name": "read_multiple_files",
                "description": "Read up to 5 files in one call. Much faster than multiple read_file calls.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "paths": {
                            "type": "array",
                            "items": {"type": "string"},
                            "minItems": 1,
                            "maxItems": 5,
                            "description": "File paths to read"
                        },
                        "max_chars_each": {"type": "integer", "minimum": 200, "maximum": 12000, "default": 6000}
                    },
                    "required": ["paths"]
                }
            },
            {
                "name": "grep_repo",
                "description": "Search file contents in the repo for a string/pattern. Fast local search on cached tree. Use to find route definitions, imports, providers.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "pattern": {"type": "string", "description": "Text to search for (case-insensitive substring match)"},
                        "path_prefix": {"type": "string"},
                        "max_results": {"type": "integer", "minimum": 1, "maximum": 20, "default": 10}
                    },
                    "required": ["pattern"]
                }
            },
            {
                "name": "write_file",
                "description": "Stage a file write (create or update). Writes are batched into a single commit for speed. Pass COMPLETE file content.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string"},
                        "content": {"type": "string"}
                    },
                    "required": ["path", "content"]
                }
            },
            {
                "name": "flush_writes",
                "description": "Commit all staged writes to the branch as a single commit. Call after all write_file calls are done.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "commit_message": {"type": "string", "default": "Implement experiment"}
                    }
                }
            },
            {
                "name": "compare_changes",
                "description": "View diff between working branch and base. Call AFTER flush_writes to verify file count.",
                "input_schema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "fetch_documentation",
                "description": "Fetch a public docs URL for API reference. Use when unsure about framework patterns.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "url": {"type": "string"},
                        "max_chars": {"type": "integer", "minimum": 500, "maximum": 8000, "default": 4000}
                    },
                    "required": ["url"]
                }
            }
        ]

    # ------------------------------------------------------------------
    # Tool execution
    # ------------------------------------------------------------------

    def _execute_tool_call(
        self,
        *,
        tool_name: str,
        tool_input: Dict[str, Any],
        repo,
        owner: str,
        repo_name: str,
        branch_name: str,
        default_branch: str
    ) -> Dict[str, Any]:
        try:
            if tool_name == "list_files":
                prefix = (tool_input.get("path_prefix") or "").strip().lstrip("/")
                limit = max(1, min(int(tool_input.get("limit") or 200), 300))
                files = self._get_tree(repo, branch_name)
                if prefix:
                    files = [f for f in files if f.startswith(prefix)]
                return {"ok": True, "files": files[:limit], "count": min(len(files), limit)}

            if tool_name == "read_file":
                path = (tool_input.get("path") or "").strip().lstrip("/")
                max_chars = max(200, min(int(tool_input.get("max_chars") or 10000), 20000))
                if not self._is_safe_repo_path(path):
                    return {"ok": False, "error": "Invalid path"}
                # Check staged writes first
                if path in self._staged_writes:
                    text = self._staged_writes[path]
                    return {"ok": True, "path": path, "content": text[:max_chars], "truncated": len(text) > max_chars, "source": "staged"}
                content = repo.get_contents(path, ref=branch_name)
                if isinstance(content, list):
                    return {"ok": False, "error": "Path is a directory"}
                try:
                    text = content.decoded_content.decode("utf-8")
                except UnicodeDecodeError:
                    return {"ok": False, "error": "Not UTF-8"}
                return {"ok": True, "path": path, "content": text[:max_chars], "truncated": len(text) > max_chars}

            if tool_name == "read_multiple_files":
                paths = tool_input.get("paths") or []
                max_chars = max(200, min(int(tool_input.get("max_chars_each") or 6000), 12000))
                results = []
                for p in paths[:5]:
                    p = p.strip().lstrip("/")
                    if not self._is_safe_repo_path(p):
                        results.append({"path": p, "ok": False, "error": "Invalid path"})
                        continue
                    if p in self._staged_writes:
                        text = self._staged_writes[p]
                        results.append({"path": p, "ok": True, "content": text[:max_chars], "truncated": len(text) > max_chars})
                        continue
                    try:
                        fc = repo.get_contents(p, ref=branch_name)
                        if isinstance(fc, list):
                            results.append({"path": p, "ok": False, "error": "Directory"})
                        else:
                            text = fc.decoded_content.decode("utf-8")
                            results.append({"path": p, "ok": True, "content": text[:max_chars], "truncated": len(text) > max_chars})
                    except Exception as e:
                        results.append({"path": p, "ok": False, "error": str(e)[:200]})
                return {"ok": True, "files": results}

            if tool_name == "grep_repo":
                pattern = (tool_input.get("pattern") or "").strip().lower()
                if not pattern:
                    return {"ok": False, "error": "Empty pattern"}
                prefix = (tool_input.get("path_prefix") or "").strip().lstrip("/")
                max_results = max(1, min(int(tool_input.get("max_results") or 10), 20))
                tree_paths = self._get_tree(repo, branch_name)
                if prefix:
                    tree_paths = [p for p in tree_paths if p.startswith(prefix)]
                # Only search text-like files
                searchable_exts = {".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".html", ".md", ".py", ".yml", ".yaml", ".toml", ".cfg", ".env", ".txt", ".vue", ".svelte"}
                hits = []
                for fp in tree_paths:
                    ext = "." + fp.rsplit(".", 1)[-1] if "." in fp else ""
                    if ext.lower() not in searchable_exts:
                        continue
                    try:
                        fc = repo.get_contents(fp, ref=branch_name)
                        if isinstance(fc, list):
                            continue
                        text = fc.decoded_content.decode("utf-8", errors="ignore")
                        lines = text.split("\n")
                        for i, line in enumerate(lines):
                            if pattern in line.lower():
                                hits.append({"path": fp, "line": i + 1, "text": line.strip()[:200]})
                                break
                    except Exception:
                        continue
                    if len(hits) >= max_results:
                        break
                return {"ok": True, "matches": hits, "count": len(hits)}

            if tool_name == "write_file":
                path = (tool_input.get("path") or "").strip().lstrip("/")
                content = tool_input.get("content") or ""
                if not self._is_safe_repo_path(path):
                    return {"ok": False, "error": "Invalid path"}
                self._staged_writes[path] = content
                return {"ok": True, "path": path, "staged": True, "total_staged": len(self._staged_writes)}

            if tool_name == "flush_writes":
                msg = tool_input.get("commit_message") or "Implement experiment"
                count = self._flush_staged_writes(repo, branch_name, msg)
                return {"ok": True, "committed_files": count}

            if tool_name == "compare_changes":
                comparison = repo.compare(default_branch, branch_name)
                files = [
                    {"filename": f.filename, "status": f.status, "additions": f.additions, "deletions": f.deletions}
                    for f in comparison.files[:100]
                ]
                return {"ok": True, "total_files": len(comparison.files), "ahead_by": comparison.ahead_by, "files": files}

            if tool_name == "fetch_documentation":
                url = (tool_input.get("url") or "").strip()
                max_chars = max(500, min(int(tool_input.get("max_chars") or 4000), 8000))
                parsed = urlparse(url)
                if parsed.scheme not in ("http", "https"):
                    return {"ok": False, "error": "Only http(s) URLs"}
                if (parsed.hostname or "").lower() in {"localhost", "127.0.0.1", "::1"}:
                    return {"ok": False, "error": "Localhost not allowed"}
                resp = requests.get(url, timeout=12, headers={"User-Agent": "hackeurope-ai-agent/1.0"})
                text = resp.text or ""
                text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.IGNORECASE)
                text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.IGNORECASE)
                text = re.sub(r"<[^>]+>", " ", text)
                text = re.sub(r"\s+", " ", text).strip()
                return {"ok": True, "url": url, "content": text[:max_chars], "truncated": len(text) > max_chars}

            return {"ok": False, "error": f"Unknown tool: {tool_name}"}
        except Exception as e:
            return {"ok": False, "error": str(e)[:500], "tool": tool_name}

    # ------------------------------------------------------------------
    # Compact results to stay within TPM budget
    # ------------------------------------------------------------------

    def _compact_tool_result(self, tool_name: str, result: Dict[str, Any]) -> Dict[str, Any]:
        compact = dict(result)
        if tool_name == "read_file" and isinstance(compact.get("content"), str):
            compact["content"] = compact["content"][:8000]
        if tool_name == "read_multiple_files" and isinstance(compact.get("files"), list):
            for f in compact["files"]:
                if isinstance(f.get("content"), str):
                    f["content"] = f["content"][:5000]
        if tool_name == "list_files" and isinstance(compact.get("files"), list):
            compact["files"] = compact["files"][:200]
        if tool_name == "grep_repo" and isinstance(compact.get("matches"), list):
            compact["matches"] = compact["matches"][:15]
        if tool_name == "compare_changes" and isinstance(compact.get("files"), list):
            real_total = compact.get("total_files", len(compact["files"]))
            compact["files"] = compact["files"][:80]
            compact["total_files"] = real_total
        if tool_name == "fetch_documentation" and isinstance(compact.get("content"), str):
            compact["content"] = compact["content"][:4000]

        serialized = json.dumps(compact)
        if len(serialized) > self.max_tool_result_chars:
            compact = {"ok": compact.get("ok", False), "tool": tool_name, "truncated": True, "preview": serialized[:self.max_tool_result_chars]}
        return compact

    # ------------------------------------------------------------------
    # Retry wrapper
    # ------------------------------------------------------------------

    def _is_retryable_error(self, error: Exception) -> bool:
        text = str(error).lower()
        return any(x in text for x in ("429", "rate_limit", "rate limit", "500", "502", "503", "504", "timeout", "connection"))

    def _call_anthropic_with_retry(self, *, system_prompt, messages, tools, tool_choice=None):
        for attempt in range(self.max_agent_retries):
            try:
                kwargs: Dict[str, Any] = {
                    "model": self.model,
                    "max_tokens": self.agent_max_tokens,
                    "temperature": 0,
                    "system": system_prompt,
                    "messages": messages,
                    "tools": tools,
                }
                if tool_choice:
                    kwargs["tool_choice"] = tool_choice
                return self.anthropic_client.messages.create(**kwargs)
            except Exception as e:
                if not self._is_retryable_error(e) or attempt == self.max_agent_retries - 1:
                    raise
                delay = min(40, (2 ** attempt) + random.uniform(0.5, 2.5))
                print(f"Claude retry in {delay:.1f}s (attempt {attempt + 1}): {type(e).__name__}")
                time.sleep(delay)
        raise Exception("Claude call failed after retries")

    # ------------------------------------------------------------------
    # Agent loop
    # ------------------------------------------------------------------

    def _run_claude_tool_agent(
        self,
        *,
        repo,
        owner: str,
        repo_name: str,
        branch_name: str,
        default_branch: str,
        task_prompt: str,
        min_changed_files: int
    ) -> Dict[str, Any]:
        tools = self._build_tools()

        system_prompt = """You are a fast, reliable repository-integrated coding agent.

CONTEXT: The user message includes pre-seeded repo context (file tree, framework, key files). Use it—don't re-read files you already have.

WORKFLOW:
1. Read any additional files you need with read_file or read_multiple_files
2. Use write_file for EACH file (new or modified). Provide COMPLETE content.
3. Call flush_writes to commit all staged files in one batch
4. Call compare_changes to verify
5. Output final JSON

PREVIEW HASHING CONTRACT (critical for correctness):
- Each segment has a preview_hash string
- The app MUST check URL param ?x=HASH on load
- If ?x matches a segment's hash → force that variant, skip random assignment
- This enables QA preview of each variant via URL
- Use the EXACT hash values from the experiment definition

RULES:
- Additive only — never remove existing routes, providers, or functionality
- Match existing code style exactly
- Use real IDs from the experiment data (experiment_id, segment_id, project_id)
- Track events via fetch() to the webhook URL

FINAL OUTPUT (JSON, after compare_changes confirms writes):
{"status":"done","commitMessage":"...","prTitle":"...","prDescription":"...","verificationNotes":"..."}
"""
        messages: List[Dict[str, Any]] = [{"role": "user", "content": task_prompt}]
        final_text = ""
        continuation_attempts = 0
        is_first_turn = True

        for turn in range(self.max_agent_turns):
            tc = {"type": "any"} if is_first_turn else None
            is_first_turn = False

            response = self._call_anthropic_with_retry(
                system_prompt=system_prompt,
                messages=messages,
                tools=tools,
                tool_choice=tc,
            )

            assistant_blocks: List[Dict[str, Any]] = []
            tool_result_blocks: List[Dict[str, Any]] = []
            text_chunks: List[str] = []

            for block in response.content:
                if block.type == "text":
                    text_chunks.append(block.text)
                    assistant_blocks.append({"type": "text", "text": block.text})
                elif block.type == "tool_use":
                    assistant_blocks.append({"type": "tool_use", "id": block.id, "name": block.name, "input": block.input})
                    result = self._execute_tool_call(
                        tool_name=block.name, tool_input=block.input,
                        repo=repo, owner=owner, repo_name=repo_name,
                        branch_name=branch_name, default_branch=default_branch,
                    )
                    compact = self._compact_tool_result(block.name, result)
                    tool_result_blocks.append({"type": "tool_result", "tool_use_id": block.id, "content": json.dumps(compact)})

            if assistant_blocks:
                messages.append({"role": "assistant", "content": assistant_blocks})

            stop_reason = getattr(response, "stop_reason", "") or ""

            if tool_result_blocks:
                messages.append({"role": "user", "content": tool_result_blocks})
                # Trim history but never orphan tool_result: each user tool_result must follow its assistant tool_use.
                # Remove oldest (assistant, user) pairs from the front; always keep [0] (initial prompt).
                while len(messages) > self.max_history_messages and len(messages) >= 3:
                    messages = [messages[0]] + messages[3:]
                continue

            final_text = "\n".join(text_chunks).strip()
            if final_text:
                break
            if stop_reason == "end_turn" and continuation_attempts < 2:
                # Auto-flush any un-flushed writes before asking for final JSON
                if self._staged_writes:
                    count = self._flush_staged_writes(repo, branch_name, "Implement experiment")
                    messages.append({"role": "user", "content": f"Auto-flushed {count} staged files. Now output your final JSON."})
                else:
                    messages.append({"role": "user", "content": "Output your final JSON now (status, prTitle, prDescription, commitMessage, verificationNotes)."})
                continuation_attempts += 1
                continue
            break

        # Safety: flush any remaining staged writes
        if self._staged_writes:
            self._flush_staged_writes(repo, branch_name, "Implement experiment (final flush)")

        if not final_text:
            raise Exception("Claude agent did not produce a final response")

        final_payload = self._extract_json_from_response(final_text)
        if not final_payload or final_payload.get("status") != "done":
            raise Exception("Claude agent returned invalid final payload")

        comparison = self._execute_tool_call(
            tool_name="compare_changes", tool_input={},
            repo=repo, owner=owner, repo_name=repo_name,
            branch_name=branch_name, default_branch=default_branch,
        )
        total = int(comparison.get("total_files") or 0)
        if total < min_changed_files:
            raise Exception(f"Only {total} files changed, need at least {min_changed_files}")

        final_payload["changed_files"] = comparison.get("files", [])
        final_payload["changed_files_count"] = total
        return final_payload

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    def create_experiment_pr(
        self,
        owner: str,
        repo_name: str,
        experiment_data: Dict,
        events_data: Dict
    ) -> Dict[str, Any]:
        repo = self.github_client.get_repo(f"{owner}/{repo_name}")
        default_branch = repo.default_branch

        branch_name = f"experiment-{experiment_data['name'].lower().replace(' ', '-')}-{int(time.time())}"
        ref = repo.get_git_ref(f"heads/{default_branch}")
        repo.create_git_ref(ref=f"refs/heads/{branch_name}", sha=ref.object.sha)

        # Pre-seed: detect framework + build context
        framework = self._detect_framework(repo, default_branch)
        preseed = self._build_preseed_context(repo, default_branch, framework)

        from src.prompts.pr_creation import PR_CREATION_PROMPT

        preview_hashes = experiment_data.get("segment_preview_hashes", {})

        prompt = PR_CREATION_PROMPT
        prompt = prompt.replace("{{EXPERIMENT_JSON}}", json.dumps(experiment_data, indent=2))
        prompt = prompt.replace("{{EVENTS_JSON}}", json.dumps(events_data, indent=2))
        prompt = prompt.replace("{{EXPERIMENT_NAME}}", experiment_data["name"])
        prompt = prompt.replace("{{NUM_SEGMENTS}}", str(len(experiment_data.get("segments", []))))
        prompt = prompt.replace("{{WEBHOOK_URL}}", "http://localhost:9000/webhook/event")
        prompt = prompt.replace("{{PREVIEW_HASHES_JSON}}", json.dumps(preview_hashes, indent=2))

        # Build explicit hash mapping for clarity
        hash_mapping_lines = []
        for seg in experiment_data.get("segments", []):
            h = seg.get("preview_hash", preview_hashes.get(str(seg["id"]), "???"))
            hash_mapping_lines.append(f"  Segment '{seg['name']}' (id={seg['id']}): preview_hash = \"{h}\"  →  URL: ?x={h}")

        hash_mapping = "\n".join(hash_mapping_lines)

        user_message = f"""Repo: {owner}/{repo_name} | Framework: {framework} | Branch: {branch_name}

{preseed}

PREVIEW HASH MAPPING (use these EXACT values):
{hash_mapping}

TASK:
{prompt}

Use tools to implement. Call write_file for each file, then flush_writes, then compare_changes. Output final JSON when done."""

        min_changed_files = max(2, min(6, len(experiment_data.get("segments", [])) + 1))
        self._staged_writes.clear()
        self._invalidate_tree_cache()

        result = self._run_claude_tool_agent(
            repo=repo, owner=owner, repo_name=repo_name,
            branch_name=branch_name, default_branch=default_branch,
            task_prompt=user_message, min_changed_files=min_changed_files,
        )

        try:
            pr = repo.create_pull(
                title=result.get("prTitle", f"Implement {experiment_data['name']} experiment"),
                body=result.get("prDescription", f"AI-generated experiment implementation for {experiment_data['name']}"),
                head=branch_name,
                base=default_branch,
            )
            print(f"✓ PR created successfully: {pr.html_url}")
        except GithubException as e:
            print(f"GitHub API error creating PR: {e.status} - {e.data}")
            raise Exception(f"Failed to create PR: {e.data.get('message', str(e))}")

        return {
            "pr_url": pr.html_url,
            "pr_number": pr.number,
            "branch_name": branch_name,
            "changed_files_count": result.get("changed_files_count"),
            "verification_notes": result.get("verificationNotes", ""),
        }
