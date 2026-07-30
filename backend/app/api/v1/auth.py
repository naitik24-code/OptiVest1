from fastapi import APIRouter, Depends, status
from app.dependencies.auth import get_user_repository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import RefreshTokenRequest, TokenData, UserLoginRequest, UserRegisterRequest
from app.schemas.common import ResponseEnvelope
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=ResponseEnvelope[UserResponse], status_code=status.HTTP_201_CREATED)
def register(
    request: UserRegisterRequest,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Register a new user profile with default portfolio risk preferences."""
    auth_service = AuthService(user_repo)
    user_data = auth_service.register(request)
    return ResponseEnvelope(success=True, data=user_data)


@router.post("/login", response_model=ResponseEnvelope[TokenData])
def login(
    request: UserLoginRequest,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Authenticate user credentials and issue signed JWT access & refresh tokens."""
    auth_service = AuthService(user_repo)
    token_data = auth_service.login(request)
    return ResponseEnvelope(success=True, data=token_data)


@router.post("/refresh", response_model=ResponseEnvelope[TokenData])
def refresh_token(
    request: RefreshTokenRequest,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Exchange a valid refresh token for a new access token."""
    auth_service = AuthService(user_repo)
    token_data = auth_service.refresh_token(request.refresh_token)
    return ResponseEnvelope(success=True, data=token_data)


@router.post("/logout", response_model=ResponseEnvelope[dict])
def logout():
    """Client-side token revocation endpoint."""
    return ResponseEnvelope(
        success=True,
        data={"message": "Successfully logged out. Please discard tokens from storage."}
    )
