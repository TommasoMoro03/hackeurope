from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProjectBase(BaseModel):
    name: str
    full_name: str
    github_url: str
    github_owner: str
    description: Optional[str] = None
    is_private: bool = False
    stars_count: int = 0
    forks_count: int = 0
    default_branch: Optional[str] = None
    language: Optional[str] = None


class ProjectCreate(ProjectBase):
    github_repo_id: Optional[int] = None
    github_access_token: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: int
    user_id: int
    github_repo_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
