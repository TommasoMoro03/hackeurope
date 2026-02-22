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
    Service to create Pull Requests using Anthropic's Claude agent.
    Based on the github_linking implementation but simplified for backend use.
    """

    def __init__(self, github_token: str):
        """
        Initialize the GitHub Agent Service.

        Args:
            github_token: GitHub access token
        """
        self.github_client = Github(github_token)
        self.anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-sonnet-4-6"
        self.max_agent_turns = 20
        self.max_agent_retries = 4
        self.agent_max_tokens = 2048
        self.max_tool_result_chars = 7000
        self.max_history_messages = 16

    def _extract_json_from_response(self, text: str) -> Optional[Dict]:
        """Extract JSON object from Claude's response."""
        # Try to find JSON in the response
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return None
        return None

    def _is_safe_repo_path(self, file_path: str) -> bool:
        """Guard against path traversal and invalid file targets."""
        if not file_path or file_path.startswith("/") or file_path.startswith("\\"):
            return False
        if ".." in file_path.replace("\\", "/").split("/"):
            return False
        return True

    def _build_tools(self) -> List[Dict[str, Any]]:
        """Tool definitions exposed to Claude."""
        return [
            {
                "name": "list_files",
                "description": "List repository files under an optional prefix path.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "path_prefix": {"type": "string"},
                        "limit": {"type": "integer", "minimum": 1, "maximum": 300}
                    }
                }
            },
            {
                "name": "read_file",
                "description": "Read the contents of a repository file from the working branch.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string"},
                        "max_chars": {"type": "integer", "minimum": 200, "maximum": 20000}
                    },
                    "required": ["path"]
                }
            },
            {
                "name": "search_code",
                "description": "Search code in the repository using GitHub code search.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"},
                        "path_prefix": {"type": "string"},
                        "limit": {"type": "integer", "minimum": 1, "maximum": 30}
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "write_file",
                "description": "Create or update a file in the working branch.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string"},
                        "content": {"type": "string"},
                        "commit_message": {"type": "string"}
                    },
                    "required": ["path", "content"]
                }
            },
            {
                "name": "compare_changes",
                "description": "Compare branch changes versus base branch.",
                "input_schema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "fetch_documentation",
                "description": "Fetch public documentation URL content snippet for implementation guidance.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "url": {"type": "string"},
                        "max_chars": {"type": "integer", "minimum": 500, "maximum": 8000}
                    },
                    "required": ["url"]
                }
            }
        ]

    def _is_rate_limit_error(self, error: Exception) -> bool:
        """Best-effort detection for Anthropic/API rate-limit responses."""
        text = str(error).lower()
        return "429" in text or "rate_limit" in text or "rate limit" in text

    def _call_anthropic_with_retry(
        self,
        *,
        system_prompt: str,
        messages: List[Dict[str, Any]],
        tools: List[Dict[str, Any]]
    ):
        """Call Anthropic with retry/backoff on rate limiting."""
        for attempt in range(self.max_agent_retries):
            try:
                return self.anthropic_client.messages.create(
                    model=self.model,
                    max_tokens=max(1024, self.agent_max_tokens - attempt * 256),
                    system=system_prompt,
                    messages=messages,
                    tools=tools
                )
            except Exception as e:
                if not self._is_rate_limit_error(e) or attempt == self.max_agent_retries - 1:
                    raise
                delay = min(20, (2 ** attempt) + random.uniform(0.2, 1.3))
                print(f"Claude rate-limited, retrying in {delay:.1f}s (attempt {attempt + 1})")
                time.sleep(delay)
        raise Exception("Claude call failed after retries")

    def _compact_tool_result(self, tool_name: str, result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Keep tool outputs token-efficient to avoid TPM spikes.
        Preserves key fields while truncating large payloads.
        """
        compact = dict(result)
        if tool_name == "read_file" and "content" in compact and isinstance(compact["content"], str):
            compact["content"] = compact["content"][:5000]
            compact["truncated"] = True
        if tool_name == "list_files" and "files" in compact and isinstance(compact["files"], list):
            compact["files"] = compact["files"][:120]
            compact["count"] = len(compact["files"])
        if tool_name == "search_code" and "results" in compact and isinstance(compact["results"], list):
            compact["results"] = compact["results"][:20]
            compact["count"] = len(compact["results"])
        if tool_name == "compare_changes" and "files" in compact and isinstance(compact["files"], list):
            compact["files"] = compact["files"][:80]
            compact["total_files"] = len(compact["files"])
        if tool_name == "fetch_documentation" and "content" in compact and isinstance(compact["content"], str):
            compact["content"] = compact["content"][:4000]
            compact["truncated"] = True

        serialized = json.dumps(compact)
        if len(serialized) > self.max_tool_result_chars:
            compact = {
                "ok": compact.get("ok", False),
                "tool": tool_name,
                "truncated": True,
                "preview": serialized[:self.max_tool_result_chars]
            }
        return compact

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
        """Execute one Claude tool call and return serializable result."""
        try:
            if tool_name == "list_files":
                path_prefix = (tool_input.get("path_prefix") or "").strip().lstrip("/")
                limit = int(tool_input.get("limit") or 120)
                limit = max(1, min(limit, 300))

                tree = repo.get_git_tree(repo.get_branch(branch_name).commit.sha, recursive=True)
                files = [
                    item.path for item in tree.tree
                    if item.type == "blob" and (not path_prefix or item.path.startswith(path_prefix))
                ]
                files = files[:limit]
                return {"ok": True, "files": files, "count": len(files)}

            if tool_name == "read_file":
                path = (tool_input.get("path") or "").strip().lstrip("/")
                max_chars = int(tool_input.get("max_chars") or 8000)
                max_chars = max(200, min(max_chars, 20000))
                if not self._is_safe_repo_path(path):
                    return {"ok": False, "error": "Invalid file path"}

                content = repo.get_contents(path, ref=branch_name)
                if isinstance(content, list):
                    return {"ok": False, "error": "Path is a directory"}

                try:
                    text = content.decoded_content.decode("utf-8")
                except UnicodeDecodeError:
                    return {"ok": False, "error": "File is not UTF-8 text"}

                return {
                    "ok": True,
                    "path": path,
                    "content": text[:max_chars],
                    "truncated": len(text) > max_chars
                }

            if tool_name == "search_code":
                query = (tool_input.get("query") or "").strip()
                if not query:
                    return {"ok": False, "error": "Missing query"}
                path_prefix = (tool_input.get("path_prefix") or "").strip().lstrip("/")
                limit = int(tool_input.get("limit") or 12)
                limit = max(1, min(limit, 30))

                qualified_query = f"{query} repo:{owner}/{repo_name} in:file"
                if path_prefix:
                    qualified_query += f" path:{path_prefix}"

                results = []
                for idx, item in enumerate(self.github_client.search_code(qualified_query)):
                    if idx >= limit:
                        break
                    results.append(
                        {
                            "path": item.path,
                            "name": item.name,
                            "sha": item.sha,
                            "url": item.html_url
                        }
                    )

                return {"ok": True, "results": results, "count": len(results)}

            if tool_name == "write_file":
                path = (tool_input.get("path") or "").strip().lstrip("/")
                content = tool_input.get("content") or ""
                commit_message = (
                    tool_input.get("commit_message")
                    or f"Implement experiment changes in {path}"
                )

                if not self._is_safe_repo_path(path):
                    return {"ok": False, "error": "Invalid file path"}

                action = "create"
                existing_sha = None
                try:
                    existing_file = repo.get_contents(path, ref=branch_name)
                    if isinstance(existing_file, list):
                        return {"ok": False, "error": "Path is a directory"}
                    existing_sha = existing_file.sha
                    action = "update"
                except GithubException as e:
                    if e.status != 404:
                        raise

                if action == "update":
                    repo.update_file(
                        path=path,
                        message=commit_message,
                        content=content,
                        sha=existing_sha,
                        branch=branch_name
                    )
                else:
                    repo.create_file(
                        path=path,
                        message=commit_message,
                        content=content,
                        branch=branch_name
                    )

                return {"ok": True, "path": path, "action": action}

            if tool_name == "compare_changes":
                comparison = repo.compare(default_branch, branch_name)
                files = []
                for file_item in comparison.files[:120]:
                    files.append(
                        {
                            "filename": file_item.filename,
                            "status": file_item.status,
                            "additions": file_item.additions,
                            "deletions": file_item.deletions,
                            "changes": file_item.changes
                        }
                    )
                return {
                    "ok": True,
                    "total_files": len(files),
                    "ahead_by": comparison.ahead_by,
                    "files": files
                }

            if tool_name == "fetch_documentation":
                url = (tool_input.get("url") or "").strip()
                max_chars = int(tool_input.get("max_chars") or 4000)
                max_chars = max(500, min(max_chars, 8000))
                parsed = urlparse(url)

                if parsed.scheme not in ("http", "https"):
                    return {"ok": False, "error": "Only http(s) URLs are allowed"}
                hostname = (parsed.hostname or "").lower()
                if hostname in {"localhost", "127.0.0.1", "::1"}:
                    return {"ok": False, "error": "Localhost URLs are not allowed"}

                response = requests.get(
                    url,
                    timeout=12,
                    headers={"User-Agent": "hackeurope-ai-agent/1.0"}
                )
                text = response.text or ""
                # Basic HTML tag stripping for compact context.
                text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.IGNORECASE)
                text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.IGNORECASE)
                text = re.sub(r"<[^>]+>", " ", text)
                text = re.sub(r"\s+", " ", text).strip()

                return {
                    "ok": True,
                    "url": url,
                    "status_code": response.status_code,
                    "content": text[:max_chars],
                    "truncated": len(text) > max_chars
                }

            return {"ok": False, "error": f"Unknown tool: {tool_name}"}
        except Exception as e:
            return {"ok": False, "error": str(e), "tool": tool_name}

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
        """Run Claude in tool-use loop until completion or max turns."""
        tools = self._build_tools()

        system_prompt = """You are an expert repository-integrated coding agent.

You MUST use tools to inspect the repository before writing code.
Workflow:
1) Discover framework, entry points, routes/layouts, and tracking patterns
2) Plan minimal additive integration
3) Implement changes with write_file tool across all required files
4) Use compare_changes to verify integration and file coverage
5) Finish only when implementation is complete and coherent

Constraints:
- Additive changes only
- Do not remove unrelated existing functionality
- Match project style and conventions
- Use actual experiment/event IDs from the request
- Prefer smaller, targeted edits over rewrites

Final response MUST be JSON only with this schema:
{
  "status": "done",
  "commitMessage": "string",
  "prTitle": "string",
  "prDescription": "string",
  "verificationNotes": "string"
}
"""
        messages: List[Dict[str, Any]] = [{"role": "user", "content": task_prompt}]
        final_text = ""

        for _ in range(self.max_agent_turns):
            response = self._call_anthropic_with_retry(
                system_prompt=system_prompt,
                messages=messages,
                tools=tools
            )

            assistant_blocks: List[Dict[str, Any]] = []
            tool_result_blocks: List[Dict[str, Any]] = []
            text_chunks: List[str] = []

            for block in response.content:
                if block.type == "text":
                    text_chunks.append(block.text)
                    assistant_blocks.append({"type": "text", "text": block.text})
                elif block.type == "tool_use":
                    assistant_blocks.append(
                        {
                            "type": "tool_use",
                            "id": block.id,
                            "name": block.name,
                            "input": block.input
                        }
                    )
                    result = self._execute_tool_call(
                        tool_name=block.name,
                        tool_input=block.input,
                        repo=repo,
                        owner=owner,
                        repo_name=repo_name,
                        branch_name=branch_name,
                        default_branch=default_branch
                    )
                    compact_result = self._compact_tool_result(block.name, result)
                    tool_result_blocks.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(compact_result)
                        }
                    )

            if assistant_blocks:
                messages.append({"role": "assistant", "content": assistant_blocks})

            if tool_result_blocks:
                messages.append({"role": "user", "content": tool_result_blocks})
                if len(messages) > self.max_history_messages:
                    messages = [messages[0]] + messages[-(self.max_history_messages - 1):]
                continue

            final_text = "\n".join(text_chunks).strip()
            break

        if not final_text:
            raise Exception("Claude tool agent did not produce a final response")

        final_payload = self._extract_json_from_response(final_text)
        if not final_payload or final_payload.get("status") != "done":
            raise Exception("Claude tool agent returned invalid final payload")

        comparison = self._execute_tool_call(
            tool_name="compare_changes",
            tool_input={},
            repo=repo,
            owner=owner,
            repo_name=repo_name,
            branch_name=branch_name,
            default_branch=default_branch
        )
        total_changed_files = int(comparison.get("total_files") or 0)
        if total_changed_files < min_changed_files:
            raise Exception(
                f"Insufficient integration changes: {total_changed_files} files changed, "
                f"required at least {min_changed_files}"
            )

        final_payload["changed_files"] = comparison.get("files", [])
        final_payload["changed_files_count"] = total_changed_files
        return final_payload

    def _get_repo_context(self, repo, max_files: int = 100) -> str:
        """
        Build repository context for Claude.

        Args:
            repo: GitHub repository object
            max_files: Maximum number of files to include in context

        Returns:
            XML-formatted repository context
        """
        # Get default branch
        default_branch = repo.default_branch

        # Get tree
        tree = repo.get_git_tree(repo.get_branch(default_branch).commit.sha, recursive=True)

        # Get file paths
        file_paths = [item.path for item in tree.tree if item.type == 'blob']
        file_paths = file_paths[:max_files]  # Limit files

        # Build file tree preview
        file_tree = '\n'.join(file_paths[:500])  # Limit to 500 paths in preview

        # Try to get key files
        key_files = ['package.json', 'tsconfig.json', 'README.md']
        documents_xml = ""

        for file_path in key_files:
            if file_path in file_paths:
                try:
                    content = repo.get_contents(file_path, ref=default_branch)
                    if hasattr(content, 'decoded_content'):
                        decoded = content.decoded_content.decode('utf-8')[:5000]  # Limit size
                        documents_xml += f"""<document>
<source>{file_path}</source>
<content>
{decoded}
</content>
</document>

"""
                except:
                    pass

        context = f"""<repository_context>
<file_tree>
{file_tree}
</file_tree>
<documents>
{documents_xml}
</documents>
</repository_context>"""

        return context

    def create_experiment_pr(
        self,
        owner: str,
        repo_name: str,
        experiment_data: Dict,
        events_data: Dict
    ) -> Dict[str, Any]:
        """
        Create a Pull Request for an experiment using Claude agent.

        Args:
            owner: Repository owner
            repo_name: Repository name
            experiment_data: Full experiment JSON
            events_data: Events and computation logic JSON

        Returns:
            Dictionary with PR URL and number
        """
        # Get repository
        repo = self.github_client.get_repo(f"{owner}/{repo_name}")
        default_branch = repo.default_branch

        # Create new branch
        branch_name = f"experiment-{experiment_data['name'].lower().replace(' ', '-')}-{int(time.time())}"
        ref = repo.get_git_ref(f"heads/{default_branch}")
        repo.create_git_ref(ref=f"refs/heads/{branch_name}", sha=ref.object.sha)

        # Build prompt from template
        from src.prompts.pr_creation import PR_CREATION_PROMPT

        preview_hashes_json = json.dumps(
            experiment_data.get("segment_preview_hashes", {}), indent=2
        )

        prompt = PR_CREATION_PROMPT
        prompt = prompt.replace("{{EXPERIMENT_JSON}}", json.dumps(experiment_data, indent=2))
        prompt = prompt.replace("{{EVENTS_JSON}}", json.dumps(events_data, indent=2))
        prompt = prompt.replace("{{EXPERIMENT_NAME}}", experiment_data['name'])
        prompt = prompt.replace("{{NUM_SEGMENTS}}", str(len(experiment_data.get('segments', []))))
        prompt = prompt.replace("{{WEBHOOK_URL}}", "http://localhost:9000/webhook/event")
        prompt = prompt.replace("{{PREVIEW_HASHES_JSON}}", preview_hashes_json)

        user_message = f"""Repository: {owner}/{repo_name}
Base branch: {default_branch}
Working branch: {branch_name}

TASK:
{prompt}

Use the provided tools to inspect, implement, and verify changes.
Do not finish until compare_changes confirms a coherent multi-file integration."""

        min_changed_files = max(2, min(6, len(experiment_data.get("segments", [])) + 1))
        result = self._run_claude_tool_agent(
            repo=repo,
            owner=owner,
            repo_name=repo_name,
            branch_name=branch_name,
            default_branch=default_branch,
            task_prompt=user_message,
            min_changed_files=min_changed_files
        )

        # Create Pull Request
        pr = repo.create_pull(
            title=result.get("prTitle", f"Implement {experiment_data['name']} experiment"),
            body=result.get("prDescription", f"AI-generated experiment implementation for {experiment_data['name']}"),
            head=branch_name,
            base=default_branch
        )

        return {
            "pr_url": pr.html_url,
            "pr_number": pr.number,
            "branch_name": branch_name,
            "changed_files_count": result.get("changed_files_count"),
            "verification_notes": result.get("verificationNotes", "")
        }
