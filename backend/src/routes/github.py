from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from src.database import get_db
from src.dependencies import get_current_active_user
from src.models.user import User
from src.models.project import Project
from src.schemas.project import ProjectResponse
from src.services.github_service import GitHubService
from src.config import settings
from typing import List, Dict, Any

router = APIRouter(prefix="/github", tags=["GitHub"])


@router.get("/link")
def initiate_github_oauth(
    current_user: User = Depends(get_current_active_user)
):
    """
    Initiate GitHub OAuth flow.
    Redirects user to GitHub authorization page.
    """
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
        f"&scope=repo user"
    )
    return {"auth_url": github_auth_url}


@router.get("/callback")
async def github_oauth_callback(code: str):
    """
    Handle GitHub OAuth callback.
    Exchanges code for access token.
    Note: Does NOT require authentication - this is the OAuth callback
    """
    try:
        # Exchange code for access token
        access_token = await GitHubService.exchange_code_for_token(code)

        # Return access token to be used for repo selection
        # Frontend will redirect to /link-repository with this token
        return {
            "message": "GitHub account linked successfully",
            "access_token": access_token
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to link GitHub account: {str(e)}"
        )


@router.get("/repos")
async def get_user_repositories(
    access_token: str,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, List[Any]]:
    """
    Fetch repositories where user has push access.
    Requires GitHub access token.
    """
    try:
        repos = await GitHubService.get_user_repos(access_token)
        return {"repos": repos}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch repositories: {str(e)}"
        )


from pydantic import BaseModel

class LinkRepoRequest(BaseModel):
    repo_id: int
    access_token: str

@router.post("/project/link")
async def link_repository(
    request: LinkRepoRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> ProjectResponse:
    """
    Link a specific repository to the user's project.
    Creates a project record in the database.
    """
    try:
        # If user already has a project (e.g. switching repository), delete it (in same tx)
        existing_project = db.query(Project).filter(Project.user_id == current_user.id).first()
        if existing_project:
            db.delete(existing_project)

        # Get all repos to find the selected one
        repos = await GitHubService.get_user_repos(request.access_token)
        selected_repo = next((r for r in repos if r["id"] == request.repo_id), None)

        if not selected_repo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found"
            )

        # Create project record
        new_project = Project(
            user_id=current_user.id,
            name=selected_repo["name"],
            full_name=selected_repo["full_name"],
            github_url=selected_repo["url"],
            github_owner=selected_repo["owner"],
            github_repo_id=selected_repo["id"],
            github_access_token=request.access_token,  # TODO: Encrypt this
            description=selected_repo.get("description"),
            is_private=1 if selected_repo["private"] else 0,
            stars_count=selected_repo.get("stars_count", 0),
            forks_count=selected_repo.get("forks_count", 0),
            default_branch=selected_repo.get("default_branch"),
            language=selected_repo.get("language")
        )

        db.add(new_project)
        db.commit()
        db.refresh(new_project)

        return new_project
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to link repository: {str(e)}"
        )


@router.get("/project")
def get_user_project(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> ProjectResponse:
    """
    Get the user's linked project.
    Returns 404 if no project is linked.
    """
    project = db.query(Project).filter(Project.user_id == current_user.id).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No project linked"
        )

    return project


@router.delete("/project")
def unlink_project(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Unlink the user's project.
    """
    project = db.query(Project).filter(Project.user_id == current_user.id).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No project linked"
        )

    db.delete(project)
    db.commit()

    return {"message": "Project unlinked successfully"}
