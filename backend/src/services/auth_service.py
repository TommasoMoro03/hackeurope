from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from google.oauth2 import id_token
from google.auth.transport import requests
from src.models.user import User
from src.schemas.user import UserCreate, UserLogin
from src.schemas.token import Token
from src.services.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token
)
from src.config import settings


class AuthService:
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """
        Get a user by email.
        """
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """
        Get a user by ID.
        """
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_google_id(db: Session, google_id: str) -> Optional[User]:
        """
        Get a user by Google ID.
        """
        return db.query(User).filter(User.google_id == google_id).first()

    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> User:
        """
        Create a new user with email and password.
        """
        # Check if user already exists
        existing_user = AuthService.get_user_by_email(db, user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create new user
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            is_active=True,
            is_verified=False
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def authenticate_user(db: Session, credentials: UserLogin) -> Optional[User]:
        """
        Authenticate a user with email and password.
        """
        user = AuthService.get_user_by_email(db, credentials.email)
        if not user:
            return None
        if not user.hashed_password:
            return None
        if not verify_password(credentials.password, user.hashed_password):
            return None
        return user

    @staticmethod
    def create_tokens(user: User) -> Token:
        """
        Create access and refresh tokens for a user.
        """
        access_token = create_access_token(
            data={"sub": user.email, "user_id": user.id}
        )
        refresh_token = create_refresh_token(
            data={"sub": user.email, "user_id": user.id}
        )
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )

    @staticmethod
    def verify_google_token(token: str) -> dict:
        """
        Verify Google OAuth token and return user info.
        """
        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )

            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')

            return idinfo
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Google token: {str(e)}"
            )

    @staticmethod
    def google_login(db: Session, google_token: str) -> tuple[User, Token]:
        """
        Login or register user with Google OAuth.
        """
        # Verify Google token
        google_user_info = AuthService.verify_google_token(google_token)

        google_id = google_user_info.get('sub')
        email = google_user_info.get('email')
        full_name = google_user_info.get('name')
        profile_picture = google_user_info.get('picture')

        # Check if user exists by Google ID
        user = AuthService.get_user_by_google_id(db, google_id)

        if not user:
            # Check if user exists by email
            user = AuthService.get_user_by_email(db, email)
            if user:
                # Link Google account to existing user
                user.google_id = google_id
                user.profile_picture = profile_picture
                user.is_verified = True
            else:
                # Create new user
                user = User(
                    email=email,
                    full_name=full_name,
                    google_id=google_id,
                    profile_picture=profile_picture,
                    is_active=True,
                    is_verified=True
                )
                db.add(user)

            db.commit()
            db.refresh(user)

        # Create tokens
        tokens = AuthService.create_tokens(user)
        return user, tokens

    @staticmethod
    def refresh_access_token(refresh_token: str, db: Session) -> Token:
        """
        Generate new access token from refresh token.
        """
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        user_id = payload.get("user_id")
        user = AuthService.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        # Create new tokens
        return AuthService.create_tokens(user)

    @staticmethod
    def get_current_user(token: str, db: Session) -> User:
        """
        Get current user from JWT token.
        """
        payload = decode_token(token)
        if not payload or payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = AuthService.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user
