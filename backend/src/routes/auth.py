from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.schemas.user import UserCreate, UserLogin, UserResponse
from src.schemas.token import Token, GoogleAuthRequest
from src.services.auth_service import AuthService
from src.dependencies import get_current_active_user
from src.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user with email and password.
    Returns access and refresh tokens.
    """
    try:
        # Create user
        user = AuthService.create_user(db, user_data)

        # Create tokens
        tokens = AuthService.create_tokens(user)

        return tokens
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )


@router.post("/login", response_model=Token)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Login with email and password.
    Returns access and refresh tokens.
    """
    user = AuthService.authenticate_user(db, credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )

    tokens = AuthService.create_tokens(user)
    return tokens


@router.post("/google", response_model=Token)
def google_login(
    request: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """
    Login or register with Google OAuth.
    Accepts a Google ID token and returns access and refresh tokens.
    """
    try:
        user, tokens = AuthService.google_login(db, request.code)
        return tokens
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google authentication failed: {str(e)}"
        )


@router.post("/refresh", response_model=Token)
def refresh_token(
    token: Token,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    """
    if not token.refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token is required"
        )

    try:
        new_tokens = AuthService.refresh_access_token(token.refresh_token, db)
        return new_tokens
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh token: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user information.
    Requires authentication.
    """
    return current_user


@router.post("/logout")
def logout(
    current_user: User = Depends(get_current_active_user)
):
    """
    Logout endpoint.
    In a stateless JWT system, logout is handled client-side by removing the token.
    This endpoint exists for consistency and can be extended for token blacklisting.
    """
    return {"message": "Successfully logged out"}
