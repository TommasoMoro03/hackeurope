from sqlalchemy import Column, String, Boolean, DateTime, Integer, Enum as SQLEnum
from sqlalchemy.sql import func
from src.database import Base
import enum


class AuthProvider(str, enum.Enum):
    """Authentication provider options"""
    email = "email"
    google = "google"


class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)

    # Authentication provider (email or google)
    provider = Column(SQLEnum(AuthProvider), nullable=False, default=AuthProvider.email)

    # For email auth: hashed password (null for OAuth users)
    hashed_password = Column(String, nullable=True)

    # For OAuth: Google user ID
    google_id = Column(String, nullable=True, index=True)

    # Account status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)

    # Timestamps
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
