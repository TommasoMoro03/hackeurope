from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from src.database import Base

class Project(Base):
    __tablename__ = "project"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    name = Column(String, nullable=False)
    full_name = Column(String, nullable=False)  # owner/repo
    github_url = Column(String, nullable=False)
    github_owner = Column(String, nullable=False)
    github_repo_id = Column(Integer, nullable=True)
    github_access_token = Column(Text, nullable=True)  # Encrypted token
    description = Column(Text, nullable=True)
    is_private = Column(Integer, default=0)
    stars_count = Column(Integer, default=0)
    forks_count = Column(Integer, default=0)
    default_branch = Column(String, nullable=True)
    language = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    payload = Column(JSONB)

    user = relationship("User", backref="projects")
