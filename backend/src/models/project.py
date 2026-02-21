from tokenize import String

from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from src.database import Base

class Project(Base):
    __tablename__ = "project"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    name = Column(String, nullable=False)
    github_url = Column(String, nullable=False)
    payload = Column(JSONB)

    user = relationship("User", backref="projects")
