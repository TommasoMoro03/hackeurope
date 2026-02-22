import json
import time
from anthropic import Anthropic
from github import Github, GithubException
from src.config import settings
from typing import Dict, List, Any, Optional
import re


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

        # Get repository context
        repo_context = self._get_repo_context(repo)

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

        # Build system prompt (simplified from apply-changes)
        system_prompt = """You are an expert repository-integrated coding assistant creating A/B test experiments.

BEFORE making any edits, understand the app structure:
1) Identify the framework (Next.js App Router, Pages Router, etc.)
2) Locate entry points (app/, pages/), layouts, and main pages
3) Match existing code style, naming conventions, and import patterns
4) Plan integration points (routes, navigation, tracking)

OUTPUT FORMAT (strict JSON only, no markdown):
{
  "files": [
    {
      "path": "path/to/file",
      "content": "complete file content",
      "action": "create or update"
    }
  ],
  "commitMessage": "Brief commit message",
  "prTitle": "PR title",
  "prDescription": "PR description"
}

Rules:
- Return ONLY JSON, no explanation or code fences
- Provide complete file contents (not patches)
- Match repository conventions exactly
- Create user-facing routes for each segment
- Integrate into existing navigation
- Implement all tracking events"""

        user_message = f"""Repository: {owner}/{repo_name}

{repo_context}

---
USER REQUEST:
{prompt}

---
Analyze the repository, then output the JSON with all required changes."""

        # Call Claude with the agent prompt
        response = self.anthropic_client.messages.create(
            model=self.model,
            max_tokens=16384,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}]
        )

        # Extract response text
        response_text = ""
        for block in response.content:
            if block.type == "text":
                response_text += block.text

        # Parse JSON response
        changes = self._extract_json_from_response(response_text)
        if not changes or 'files' not in changes:
            raise Exception("Failed to parse AI response")

        # Apply changes to repository
        for file_change in changes['files']:
            file_path = file_change['path']
            file_content = file_change['content']
            action = file_change['action']

            try:
                # Try to get existing file
                existing_file = repo.get_contents(file_path, ref=branch_name)

                if action == 'update':
                    # Update existing file
                    repo.update_file(
                        file_path,
                        changes.get('commitMessage', 'Update file'),
                        file_content,
                        existing_file.sha,
                        branch=branch_name
                    )
            except GithubException as e:
                if e.status == 404 and action == 'create':
                    # Create new file
                    repo.create_file(
                        file_path,
                        changes.get('commitMessage', 'Create file'),
                        file_content,
                        branch=branch_name
                    )
                else:
                    raise

        # Create Pull Request
        pr = repo.create_pull(
            title=changes.get('prTitle', f"Implement {experiment_data['name']} experiment"),
            body=changes.get('prDescription', f"AI-generated experiment implementation for {experiment_data['name']}"),
            head=branch_name,
            base=default_branch
        )

        return {
            "pr_url": pr.html_url,
            "pr_number": pr.number,
            "branch_name": branch_name
        }
