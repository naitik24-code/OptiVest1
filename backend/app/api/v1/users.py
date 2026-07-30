from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user, get_user_repository
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.common import ResponseEnvelope
from app.schemas.user import UserProfileResponse, UserProfileUpdateRequest, UserResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users Profile"])


@router.get("/me", response_model=ResponseEnvelope[UserResponse])
def get_current_user_account(
    current_user: User = Depends(get_current_user)
):
    """Fetch identity details of currently authenticated user."""
    return ResponseEnvelope(
        success=True,
        data=UserResponse.model_validate(current_user)
    )


@router.get("/profile", response_model=ResponseEnvelope[UserProfileResponse])
def get_user_profile(
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Fetch complete profile and portfolio risk preferences of current user."""
    user_service = UserService(user_repo)
    profile_data = user_service.get_profile(current_user.id)
    return ResponseEnvelope(success=True, data=profile_data)


@router.put("/profile", response_model=ResponseEnvelope[UserProfileResponse])
def update_user_profile(
    request: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Update profile metadata and portfolio risk settings for authenticated user."""
    user_service = UserService(user_repo)
    updated_profile = user_service.update_profile(current_user.id, request)
    return ResponseEnvelope(success=True, data=updated_profile)
