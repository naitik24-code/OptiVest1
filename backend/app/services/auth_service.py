from datetime import timedelta
from app.core import security
from app.core.config import settings
from app.core.exceptions import AuthenticationException, ConflictException
from app.models.user import User
from app.models.user_preference import UserPreference
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenData, UserLoginRequest, UserRegisterRequest
from app.schemas.user import UserResponse


class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def register(self, request: UserRegisterRequest) -> UserResponse:
        """Register a new user account with default portfolio risk preferences."""
        existing_user = self.user_repo.get_by_email(request.email)
        if existing_user:
            raise ConflictException(f"User with email '{request.email}' already exists.")

        hashed_password = security.get_password_hash(request.password)
        new_user = User(
            email=request.email.lower(),
            hashed_password=hashed_password,
            role="INVESTOR_USER",
            is_active=True
        )

        default_preference = UserPreference(
            max_reallocation_pct=15.00,
            risk_tolerance_level=3,
            preferred_benchmark="SP500",
            investment_goal="Growth",
            timezone="UTC",
            preferred_currency="USD"
        )

        created_user = self.user_repo.create(new_user, default_preference)
        return UserResponse.model_validate(created_user)

    def login(self, request: UserLoginRequest) -> TokenData:
        """Authenticate user credentials and issue signed JWT access & refresh tokens."""
        user = self.user_repo.get_by_email(request.email)
        if not user or not security.verify_password(request.password, user.hashed_password):
            raise AuthenticationException("Invalid email or password.")

        if not user.is_active:
            raise AuthenticationException("User account is deactivated.")

        access_token = security.create_access_token(
            subject=str(user.id),
            roles=[user.role]
        )
        refresh_token = security.create_refresh_token(subject=str(user.id))

        return TokenData(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    def refresh_token(self, refresh_token_str: str) -> TokenData:
        """Validate refresh token and issue new JWT access token."""
        payload = security.decode_token(refresh_token_str)
        if not payload or payload.get("type") != "refresh":
            raise AuthenticationException("Invalid or expired refresh token.")

        user_id_str = payload.get("sub")
        if not user_id_str:
            raise AuthenticationException("Invalid refresh token payload.")

        user = self.user_repo.get_by_id(user_id_str)
        if not user or not user.is_active:
            raise AuthenticationException("User not found or inactive.")

        new_access_token = security.create_access_token(
            subject=str(user.id),
            roles=[user.role]
        )
        new_refresh_token = security.create_refresh_token(subject=str(user.id))

        return TokenData(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
