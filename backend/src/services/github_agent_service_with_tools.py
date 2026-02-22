import json
import random
import re
import time
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import requests
from anthropic import Anthropic
from github import Github, GithubException, InputGitTreeElement

from src.config import settings


class GitHubAgentService:
    """
    3-phase A/B experiment agent:
      Phase 1 — Plan  (1 fast Claude call, no tools): identify files to read & create
      Phase 2 — Read  (server-side GitHub API): fetch exactly those files
      Phase 3 — Write (write-only Claude agent, max 8 turns): write_file + flush_writes only
      Phase 4 — PR    (server-side): create the pull request
    """

    WEBHOOK_URL = "http://localhost:8001/webhook/event"

    def __init__(self, github_token: str):
        self.github_client = Github(github_token)
        self.anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-sonnet-4-6"
        self.max_agent_retries = 5
        self.agent_max_tokens = 8000    # Claude Sonnet hard cap; enough for 3 full files per turn
        self.max_tool_result_chars = 10000

        self._cached_tree: Optional[List[str]] = None
        self._cached_tree_sha: Optional[str] = None
        self._staged_writes: Dict[str, str] = {}

    # ------------------------------------------------------------------ #
    # Core helpers                                                         #
    # ------------------------------------------------------------------ #

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

    # ------------------------------------------------------------------ #
    # Style detection                                                      #
    # ------------------------------------------------------------------ #

    def _extract_style_hints(self, file_contents: Dict[str, str]) -> str:
        """
        Analyse the files read in Phase 2 and return a compact bullet-list of
        code-style rules Claude must follow when writing experiment files.
        """
        all_code = "\n".join(file_contents.values())
        lines = [l for l in all_code.split("\n") if l.strip()]

        # ── Indentation ──────────────────────────────────────────────────
        tab_lines = sum(1 for l in lines if l.startswith("\t"))
        two_lines = sum(1 for l in lines if l.startswith("  ") and not l.startswith("   "))
        four_lines = sum(1 for l in lines if l.startswith("    "))
        if tab_lines > max(two_lines, four_lines):
            indent = "hard tabs"
        elif four_lines > two_lines:
            indent = "4 spaces"
        else:
            indent = "2 spaces"

        # ── Quote style ──────────────────────────────────────────────────
        # Count JS string literals, not JSX attribute values
        single = all_code.count("'")
        double = all_code.count('"')
        quotes = "single" if single > double * 1.2 else "double"

        # ── Semicolons ───────────────────────────────────────────────────
        stmt_ends = [l.rstrip() for l in lines if not l.strip().startswith("//")]
        semi_count = sum(1 for l in stmt_ends if l.endswith(";"))
        no_semi_count = sum(
            1 for l in stmt_ends
            if l and not l.endswith(("{", "}", ",", "(", ")", "=>", "|", "&", "?", ":"))
               and not l.endswith(";")
        )
        semicolons = "yes" if semi_count > no_semi_count * 0.4 else "no"

        # ── CSS approach ─────────────────────────────────────────────────
        tailwind_signals = ["className=", "flex ", "grid ", "text-", "bg-", "p-", "m-",
                            "rounded", "border", "font-", "w-", "h-", "gap-", "space-"]
        tw_score = sum(all_code.count(s) for s in tailwind_signals)
        uses_tailwind = tw_score > 10 and "className" in all_code

        uses_css_modules = ".module.css" in all_code or ".module.scss" in all_code or "styles." in all_code
        uses_styled = "styled." in all_code or "styled(" in all_code

        if uses_tailwind:
            css_approach = "Tailwind CSS — use className with Tailwind utility classes ONLY; match existing Tailwind patterns exactly"
        elif uses_css_modules:
            css_approach = "CSS Modules — import styles from the corresponding .module.css file"
        elif uses_styled:
            css_approach = "styled-components — use styled.div/button/etc patterns"
        else:
            css_approach = "plain className strings or inline styles"

        # ── Import aliases ───────────────────────────────────────────────
        uses_at_alias = ("from '@/" in all_code or 'from "@/' in all_code)
        uses_tilde = ("from '~/" in all_code or 'from "~/' in all_code)
        if uses_at_alias:
            alias = "@/ alias (e.g., import from '@/components/Foo')"
        elif uses_tilde:
            alias = "~/ alias"
        else:
            alias = "relative paths (./  or ../)"

        # ── Export style ─────────────────────────────────────────────────
        named_exports = all_code.count("export const ") + all_code.count("export function ")
        default_exports = all_code.count("export default ")
        if named_exports > default_exports * 1.5:
            export_style = "named exports only (export const Foo = () => ...)"
        elif default_exports > named_exports * 1.5:
            export_style = "default exports (export default function Foo)"
        else:
            export_style = "mixed — prefer named exports for components"

        # ── TypeScript ───────────────────────────────────────────────────
        ts_files = [p for p in file_contents if p.endswith(".tsx") or p.endswith(".ts")]
        if ts_files:
            has_types = ("interface " in all_code or ": string" in all_code
                         or ": number" in all_code or "React.FC" in all_code
                         or "Props>" in all_code)
            ts_rule = "TypeScript (.tsx) — add interface Props and type annotations where the existing files do"
            if not has_types:
                ts_rule = "TypeScript (.tsx) — minimal typing; only add types if strictly needed"
        else:
            ts_rule = "JavaScript (.jsx / .js) — no TypeScript, no type annotations"

        # ── 'use client' boundary ────────────────────────────────────────
        use_client = '"use client"' in all_code or "'use client'" in all_code
        client_rule = ('add "use client" as the FIRST line of every new component file'
                       if use_client else
                       'do NOT add "use client" unless explicitly required')

        rules = "\n".join([
            f"• Indentation   : {indent}",
            f"• Quotes        : {quotes} quotes",
            f"• Semicolons    : {semicolons}",
            f"• Styling       : {css_approach}",
            f"• Imports       : {alias}",
            f"• Exports       : {export_style}",
            f"• Language      : {ts_rule}",
            f"• Client boundary: {client_rule}",
        ])
        return rules

    # ------------------------------------------------------------------ #
    # Batch commit via Git Data API                                        #
    # ------------------------------------------------------------------ #

    def _flush_staged_writes(self, repo, branch_name: str, commit_message: str) -> int:
        if not self._staged_writes:
            return 0
        branch_ref = repo.get_git_ref(f"heads/{branch_name}")
        base_sha = branch_ref.object.sha
        base_commit = repo.get_git_commit(base_sha)
        base_tree_sha = base_commit.tree.sha

        tree_items = []
        for path, content in self._staged_writes.items():
            blob = repo.create_git_blob(content, "utf-8")
            tree_items.append(InputGitTreeElement(path=path, mode="100644", type="blob", sha=blob.sha))

        new_tree = repo.create_git_tree(tree_items, base_tree=repo.get_git_tree(base_tree_sha))
        new_commit = repo.create_git_commit(commit_message, new_tree, [base_commit])
        branch_ref.edit(new_commit.sha)

        count = len(self._staged_writes)
        self._staged_writes.clear()
        self._invalidate_tree_cache()
        return count

    # ------------------------------------------------------------------ #
    # Tool definitions & execution (write-only subset used in Phase 3)    #
    # ------------------------------------------------------------------ #

    def _build_write_tools(self) -> List[Dict[str, Any]]:
        """Only expose write_file, flush_writes, compare_changes in Phase 3."""
        return [
            {
                "name": "write_file",
                "description": "Stage a file (create or overwrite). Provide COMPLETE file content — no placeholders.",
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
                "description": "Commit all staged files as a single Git commit. Call once after all write_file calls.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "commit_message": {"type": "string", "default": "Implement experiment"}
                    }
                }
            },
            {
                "name": "compare_changes",
                "description": "Show diff between working branch and base. Call after flush_writes to confirm.",
                "input_schema": {"type": "object", "properties": {}}
            }
        ]

    def _execute_write_tool(self, tool_name: str, tool_input: Dict,
                            repo, owner: str, repo_name: str,
                            branch_name: str, default_branch: str) -> Dict:
        try:
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
                    for f in comparison.files[:50]
                ]
                return {"ok": True, "total_files": len(comparison.files), "ahead_by": comparison.ahead_by, "files": files}

            return {"ok": False, "error": f"Unknown tool: {tool_name}"}
        except Exception as e:
            return {"ok": False, "error": str(e)[:300], "tool": tool_name}

    def _compact_result(self, tool_name: str, result: Dict) -> Dict:
        compact = dict(result)
        if tool_name == "compare_changes" and isinstance(compact.get("files"), list):
            compact["files"] = compact["files"][:30]
        serialized = json.dumps(compact)
        if len(serialized) > self.max_tool_result_chars:
            return {"ok": compact.get("ok", False), "tool": tool_name, "truncated": True,
                    "preview": serialized[:self.max_tool_result_chars]}
        return compact

    # ------------------------------------------------------------------ #
    # Retry wrapper                                                        #
    # ------------------------------------------------------------------ #

    def _is_retryable_error(self, error: Exception) -> bool:
        text = str(error).lower()
        return any(x in text for x in ("429", "rate_limit", "rate limit", "500", "502", "503", "504", "timeout", "connection"))

    def _call_claude(self, *, system: str, messages: List, tools: List = None, tool_choice=None) -> Any:
        for attempt in range(self.max_agent_retries):
            try:
                kwargs: Dict[str, Any] = {
                    "model": self.model,
                    "max_tokens": self.agent_max_tokens,
                    "temperature": 0,
                    "system": system,
                    "messages": messages,
                }
                if tools:
                    kwargs["tools"] = tools
                if tool_choice:
                    kwargs["tool_choice"] = tool_choice
                return self.anthropic_client.messages.create(**kwargs)
            except Exception as e:
                if not self._is_retryable_error(e) or attempt == self.max_agent_retries - 1:
                    raise
                delay = min(40, (2 ** attempt) + random.uniform(0.5, 2.5))
                print(f"  Claude retry in {delay:.1f}s (attempt {attempt + 1}): {type(e).__name__}")
                time.sleep(delay)
        raise Exception("Claude call failed after retries")

    # ------------------------------------------------------------------ #
    # PHASE 1 — Planning call (no tools, fast)                            #
    # ------------------------------------------------------------------ #

    def _phase1_plan(self, tree_paths: List[str], mini_context: str,
                     framework: str, experiment_data: Dict, events_data: Dict) -> Dict:
        """
        Single fast Claude call (no tools). Returns:
          {"files_to_read": [...], "integration_target": "path", "new_files": [...]}
        """
        tree_text = "\n".join(tree_paths[:350])
        segments_summary = ", ".join(
            f"{s['name']} ({int(s.get('percentage', 0.5)*100)}%)"
            for s in experiment_data.get("segments", [])
        )
        events_list = ", ".join(e["event_id"] for e in events_data.get("events", []))
        exp_slug = re.sub(r"[^a-z0-9-]", "-", experiment_data["name"].lower())
        exp_slug = re.sub(r"-+", "-", exp_slug).strip("-")[:50]

        prompt = f"""You are planning how to integrate an A/B experiment into an existing {framework} codebase.

Experiment: "{experiment_data['name']}"
Segments: {segments_summary}
Events to track: {events_list}

EXISTING FILES (already read for you):
{mini_context}

FILE TREE (full repo):
{tree_text}

Return a JSON plan ONLY. No explanation. No markdown. Just the JSON object.

Rules:
- files_to_read: 2-4 paths of existing files you need to see before writing (pick the main page + any component near the experiment target)
- integration_target: ONE existing file to minimally modify to render the experiment controller (the real entry point users visit)
- new_files: 3 paths for new files to create: Controller + one file per segment variant

Example:
{{
  "files_to_read": ["app/page.tsx"],
  "integration_target": "app/page.tsx",
  "new_files": ["src/experiments/{exp_slug}/Controller.tsx", "src/experiments/{exp_slug}/Control.tsx", "src/experiments/{exp_slug}/VariantB.tsx"]
}}"""

        try:
            response = self.anthropic_client.messages.create(
                model=self.model,
                max_tokens=600,
                temperature=0,
                messages=[{"role": "user", "content": prompt}],
            )
            text = "".join(b.text for b in response.content if hasattr(b, "text"))
            plan = self._extract_json_from_response(text)
            if plan and isinstance(plan.get("new_files"), list) and plan.get("integration_target"):
                print(f"  [plan] read={plan.get('files_to_read')}")
                print(f"  [plan] integration_target={plan.get('integration_target')}")
                print(f"  [plan] new_files={plan.get('new_files')}")
                return plan
        except Exception as e:
            print(f"  [plan] Planning call failed: {e}")

        # Fallback
        entry = next((h for h in ["app/page.tsx", "src/App.tsx", "pages/index.tsx", "src/main.tsx"] if h in tree_paths), None)
        return {
            "files_to_read": [entry] if entry else [],
            "integration_target": entry,
            "new_files": [
                f"src/experiments/{exp_slug}/Controller.tsx",
                f"src/experiments/{exp_slug}/Control.tsx",
                f"src/experiments/{exp_slug}/VariantB.tsx",
            ]
        }

    # ------------------------------------------------------------------ #
    # PHASE 2 — Read files (server-side, no Claude)                       #
    # ------------------------------------------------------------------ #

    def _phase2_read(self, repo, branch: str, paths: List[str], max_chars: int = 6000) -> Dict[str, str]:
        contents: Dict[str, str] = {}
        for path in paths[:8]:
            if not path:
                continue
            try:
                fc = repo.get_contents(path, ref=branch)
                if not isinstance(fc, list):
                    text = fc.decoded_content.decode("utf-8")[:max_chars]
                    contents[path] = text
                    print(f"  [read] {path} ({len(text)} chars)")
            except Exception as e:
                print(f"  [read] !! {path}: {e}")
        return contents

    # ------------------------------------------------------------------ #
    # PHASE 3 — Write-only agent                                          #
    # ------------------------------------------------------------------ #

    def _phase3_write(self, repo, owner: str, repo_name: str,
                      branch_name: str, default_branch: str,
                      write_prompt: str, min_changed_files: int) -> Dict:
        """
        Focused write-only agent. Claude can ONLY call write_file / flush_writes / compare_changes.
        Max 8 turns. Server auto-flushes if Claude forgets.
        """
        tools = self._build_write_tools()
        system = (
            "You are a code-writing agent. All context is already provided — DO NOT request more files.\n\n"
            "STYLE CONTRACT (non-negotiable):\n"
            "• Copy the indentation, quote style, semicolons, and CSS approach from the EXISTING FILE CONTENTS.\n"
            "• If the repo uses Tailwind, every className must use Tailwind utility classes only — no inline styles.\n"
            "• If the repo uses named exports (export const Foo), never use default exports, and vice-versa.\n"
            "• If the repo has 'use client' directives, add it as line 1 of every new component file.\n"
            "• If the repo uses TypeScript, include proper interface Props definitions.\n"
            "• Use the same import alias pattern (@/ vs relative) seen in existing files.\n"
            "• The generated files must look indistinguishable from the existing codebase.\n\n"
            "WORKFLOW: write_file each file (COMPLETE — no placeholders) → flush_writes → compare_changes → output JSON.\n\n"
            "FINAL OUTPUT (after compare_changes):\n"
            '{"status":"done","commitMessage":"...","prTitle":"...","prDescription":"...","verificationNotes":"..."}'
        )
        messages: List[Dict] = [{"role": "user", "content": write_prompt}]
        final_text = ""
        MAX_TURNS = 8

        print(f"\n{'='*55}")
        print(f"[phase-3] Write agent — max {MAX_TURNS} turns, {self.agent_max_tokens} tokens/turn")
        print(f"{'='*55}")

        for turn in range(MAX_TURNS):
            # Force a tool call on turn 0; let Claude decide after that
            tc = {"type": "any"} if turn == 0 else None
            print(f"\n[write-turn {turn+1}/{MAX_TURNS}] Calling Claude...")

            response = self._call_claude(system=system, messages=messages, tools=tools, tool_choice=tc)
            stop_reason = getattr(response, "stop_reason", "") or ""
            print(f"  stop_reason={stop_reason} | blocks={len(response.content)}")

            assistant_blocks: List[Dict] = []
            tool_results: List[Dict] = []
            text_chunks: List[str] = []

            for block in response.content:
                if block.type == "text":
                    text_chunks.append(block.text)
                    assistant_blocks.append({"type": "text", "text": block.text})
                    snippet = block.text[:100].replace("\n", " ")
                    print(f"  [text] {snippet}{'...' if len(block.text) > 100 else ''}")

                elif block.type == "tool_use":
                    inp = block.input or {}
                    if block.name == "write_file":
                        print(f"  [tool] write_file({inp.get('path')}) — {len(inp.get('content', ''))} chars")
                    elif block.name == "flush_writes":
                        print(f"  [tool] flush_writes({len(self._staged_writes)} staged)")
                    elif block.name == "compare_changes":
                        print(f"  [tool] compare_changes()")

                    assistant_blocks.append({"type": "tool_use", "id": block.id, "name": block.name, "input": block.input})
                    result = self._execute_write_tool(
                        tool_name=block.name, tool_input=block.input,
                        repo=repo, owner=owner, repo_name=repo_name,
                        branch_name=branch_name, default_branch=default_branch,
                    )

                    if not result.get("ok"):
                        print(f"  [tool] !! ERROR: {result.get('error', '?')[:150]}")
                    elif block.name == "compare_changes":
                        print(f"  [tool] → {result.get('total_files')} files changed, ahead_by={result.get('ahead_by')}")
                    elif block.name == "flush_writes":
                        print(f"  [tool] → committed {result.get('committed_files')} files")

                    compact = self._compact_result(block.name, result)
                    tool_results.append({"type": "tool_result", "tool_use_id": block.id, "content": json.dumps(compact)})

            if assistant_blocks:
                messages.append({"role": "assistant", "content": assistant_blocks})

            if tool_results:
                messages.append({"role": "user", "content": tool_results})
                print(f"  [history] {len(messages)} msgs | staged={len(self._staged_writes)}")
                continue

            final_text = "\n".join(text_chunks).strip()
            if final_text:
                print(f"[phase-3] Final text received ({len(final_text)} chars)")
                break

            if stop_reason == "end_turn":
                if self._staged_writes:
                    count = self._flush_staged_writes(repo, branch_name, "Implement experiment")
                    print(f"[phase-3] Auto-flushed {count} files → asking for final JSON")
                    messages.append({"role": "user", "content": f"Auto-flushed {count} files. Output final JSON now."})
                else:
                    messages.append({"role": "user", "content": "Output final JSON now."})
                continue
            break

        print(f"\n[phase-3] Done — staged_writes={len(self._staged_writes)}")

        # Safety flush
        if self._staged_writes:
            count = self._flush_staged_writes(repo, branch_name, "Implement experiment (auto-flush)")
            print(f"[phase-3] Safety-flushed {count} files")

        # Parse final payload
        final_payload = self._extract_json_from_response(final_text) if final_text else None

        # Check how many files actually changed
        comparison = self._execute_write_tool(
            tool_name="compare_changes", tool_input={},
            repo=repo, owner=owner, repo_name=repo_name,
            branch_name=branch_name, default_branch=default_branch,
        )
        total_changed = int(comparison.get("total_files") or 0)
        print(f"[phase-3] compare_changes → {total_changed} files changed")

        if total_changed < min_changed_files:
            raise Exception(f"Only {total_changed} files changed, expected at least {min_changed_files}")

        if not final_payload or final_payload.get("status") != "done":
            # Files are committed — don't fail, just use defaults
            print(f"[phase-3] Warning: missing/invalid final JSON — using defaults")
            final_payload = {
                "status": "done",
                "prTitle": "feat: A/B experiment",
                "prDescription": "A/B experiment implementation with event tracking.",
                "commitMessage": "Implement A/B experiment",
                "verificationNotes": "Auto-completed",
            }

        final_payload["changed_files_count"] = total_changed
        final_payload["changed_files"] = comparison.get("files", [])
        return final_payload

    # ------------------------------------------------------------------ #
    # Public entry point                                                   #
    # ------------------------------------------------------------------ #

    def create_experiment_pr(
        self,
        owner: str,
        repo_name: str,
        experiment_data: Dict,
        events_data: Dict
    ) -> Dict[str, Any]:
        repo = self.github_client.get_repo(f"{owner}/{repo_name}")
        default_branch = repo.default_branch

        exp_name = experiment_data["name"]
        # Git ref names forbid: space : ~ ^ ? * [ \ .. @{ and leading/trailing dots/hyphens
        exp_slug = re.sub(r"[^a-z0-9-]", "-", exp_name.lower())
        exp_slug = re.sub(r"-+", "-", exp_slug).strip("-")[:50]
        num_segments = len(experiment_data.get("segments", []))
        min_files = max(2, min(6, num_segments + 1))
        preview_hashes = experiment_data.get("segment_preview_hashes", {})

        # Build branch
        branch_name = f"exp-{exp_slug}-{int(time.time())}"
        ref = repo.get_git_ref(f"heads/{default_branch}")
        repo.create_git_ref(ref=f"refs/heads/{branch_name}", sha=ref.object.sha)

        # ── PHASE 1: Plan ──────────────────────────────────────────────
        print(f"\n{'#'*55}")
        print(f"## PHASE 1 — Plan")
        print(f"{'#'*55}")
        framework = self._detect_framework(repo, default_branch)
        tree_paths = self._get_tree(repo, default_branch)
        print(f"[phase-1] Framework: {framework} | {len(tree_paths)} files")

        # Read tiny context for the planning call: package.json + one entry point
        mini_candidates = ["package.json"] + [
            h for h in ["app/page.tsx", "src/App.tsx", "pages/index.tsx", "app/layout.tsx"]
            if h in tree_paths
        ][:2]
        mini_files = self._phase2_read(repo, default_branch, mini_candidates, max_chars=2500)
        mini_context = "\n".join(f"--- {p} ---\n{c}" for p, c in mini_files.items())

        plan = self._phase1_plan(tree_paths, mini_context, framework, experiment_data, events_data)

        # ── PHASE 2: Read ──────────────────────────────────────────────
        print(f"\n{'#'*55}")
        print(f"## PHASE 2 — Read identified files")
        print(f"{'#'*55}")
        # Read what the planner asked for + integration target (deduplicated)
        files_to_read = list(dict.fromkeys(
            [f for f in (plan.get("files_to_read") or []) + [plan.get("integration_target")]
             if f and f in tree_paths]
        ))
        print(f"[phase-2] Fetching: {files_to_read}")
        file_contents = self._phase2_read(repo, default_branch, files_to_read)

        # ── Detect repo style from read files ─────────────────────────
        style_hints = self._extract_style_hints(file_contents)
        print(f"[style] Detected:\n{style_hints}")

        # ── Build write prompt ─────────────────────────────────────────
        hash_mapping_lines = []
        for seg in experiment_data.get("segments", []):
            h = seg.get("preview_hash", preview_hashes.get(str(seg["id"]), "???"))
            hash_mapping_lines.append(
                f"  Segment '{seg['name']}' (id={seg['id']}): preview_hash=\"{h}\"  →  preview URL: <base>#{h}"
            )
        hash_mapping = "\n".join(hash_mapping_lines)

        from src.prompts.pr_creation import PR_CREATION_PROMPT
        prompt_text = (PR_CREATION_PROMPT
            .replace("{{EXPERIMENT_JSON}}", json.dumps(experiment_data, indent=2))
            .replace("{{EVENTS_JSON}}", json.dumps(events_data, indent=2))
            .replace("{{EXPERIMENT_NAME}}", exp_slug)
            .replace("{{NUM_SEGMENTS}}", str(num_segments))
            .replace("{{WEBHOOK_URL}}", self.WEBHOOK_URL)
            .replace("{{PREVIEW_HASHES_JSON}}", json.dumps(preview_hashes, indent=2))
            .replace("{{PREVIEW_HASHES_MAPPING}}", hash_mapping)
            .replace("{{MIN_CHANGED_FILES}}", str(min_files))
        )

        files_content_str = "\n\n".join(
            f"=== EXISTING FILE: {p} ===\n{c}" for p, c in file_contents.items()
        )
        new_files_str = "\n".join(f"  - {f}" for f in (plan.get("new_files") or []))
        integration_target = plan.get("integration_target") or "the main entry point"

        write_prompt = f"""Repo: {owner}/{repo_name} | Framework: {framework} | Branch: {branch_name}

╔══════════════════════════════════════════════════════════╗
║  STRICT STYLE RULES — mirror the existing codebase EXACTLY
╚══════════════════════════════════════════════════════════╝
{style_hints}

Every file you write MUST follow these rules without exception.
Do not invent a different style. Copy the patterns you see in
the EXISTING FILE CONTENTS below as your style reference.

IMPLEMENTATION PLAN (already decided — just execute it):
  Create these new files:
{new_files_str}
  Modify (minimally — add one import + one JSX element): {integration_target}

SEGMENT → PREVIEW HASH MAPPING:
{hash_mapping}

EXISTING FILE CONTENTS (use these as your style reference AND integration context):
{files_content_str}

FULL TASK SPEC:
{prompt_text}

You CANNOT read any more files. Use write_file for every file (complete content),
then flush_writes, then compare_changes, then output final JSON."""

        # ── PHASE 3: Write ─────────────────────────────────────────────
        print(f"\n{'#'*55}")
        print(f"## PHASE 3 — Write agent")
        print(f"{'#'*55}")
        self._staged_writes.clear()
        self._invalidate_tree_cache()

        result = self._phase3_write(
            repo=repo, owner=owner, repo_name=repo_name,
            branch_name=branch_name, default_branch=default_branch,
            write_prompt=write_prompt, min_changed_files=min_files,
        )

        # ── PHASE 4: PR ────────────────────────────────────────────────
        print(f"\n{'#'*55}")
        print(f"## PHASE 4 — Create PR")
        print(f"{'#'*55}")
        try:
            pr = repo.create_pull(
                title=result.get("prTitle", f"feat: {exp_name} A/B experiment"),
                body=result.get("prDescription", f"A/B experiment: {exp_name}"),
                head=branch_name,
                base=default_branch,
            )
            print(f"✓ PR created: {pr.html_url}")
        except GithubException as e:
            print(f"GitHub API error: {e.status} — {e.data}")
            raise Exception(f"Failed to create PR: {e.data.get('message', str(e))}")

        return {
            "pr_url": pr.html_url,
            "pr_number": pr.number,
            "branch_name": branch_name,
            "changed_files_count": result.get("changed_files_count"),
            "verification_notes": result.get("verificationNotes", ""),
        }
