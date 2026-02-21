import httpx
from typing import Dict, List, Any, Optional
from src.config import settings


class GitHubService:
    """Service for interacting with GitHub API"""

    BASE_URL = "https://api.github.com"

    @staticmethod
    async def exchange_code_for_token(code: str) -> str:
        """Exchange GitHub OAuth code for access token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": settings.GITHUB_CLIENT_ID,
                    "client_secret": settings.GITHUB_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": settings.GITHUB_REDIRECT_URI,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["access_token"]

    @staticmethod
    async def get_user_repos(access_token: str) -> List[Dict[str, Any]]:
        """Fetch repositories where user has push access"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GitHubService.BASE_URL}/user/repos",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github+json",
                },
                params={
                    "per_page": 100,
                    "sort": "updated",
                    "affiliation": "owner,collaborator",
                },
            )
            response.raise_for_status()
            repos = response.json()

            # Filter repos where user has push access
            writable_repos = [
                {
                    "id": repo["id"],
                    "name": repo["name"],
                    "full_name": repo["full_name"],
                    "owner": repo["owner"]["login"],
                    "description": repo.get("description"),
                    "private": repo["private"],
                    "updated_at": repo["updated_at"],
                    "url": repo["html_url"],
                    "stars_count": repo.get("stargazers_count", 0),
                    "forks_count": repo.get("forks_count", 0),
                    "default_branch": repo.get("default_branch"),
                    "language": repo.get("language"),
                }
                for repo in repos
                if repo.get("permissions", {}).get("push") or repo.get("permissions", {}).get("admin")
            ]

            return writable_repos

    @staticmethod
    async def get_repo_details(access_token: str, owner: str, repo: str) -> Dict[str, Any]:
        """Get detailed information about a specific repository"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GitHubService.BASE_URL}/repos/{owner}/{repo}",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github+json",
                },
            )
            response.raise_for_status()
            return response.json()
