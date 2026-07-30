from uuid import UUID
from app.core.exceptions import NotFoundException
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserProfileResponse, UserProfileUpdateRequest


class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def get_profile(self, user_id: UUID) -> UserProfileResponse:
        """Fetch complete profile and preferences for authenticated user."""
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User profile not found.")
        return UserProfileResponse.model_validate(user)

    def update_profile(self, user_id: UUID, request: UserProfileUpdateRequest) -> UserProfileResponse:
        """Update profile metadata and portfolio risk settings for authenticated user."""
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User profile not found.")

        if request.avatar_url is not None:
            user.avatar_url = request.avatar_url
            self.user_repo.update(user)

        if user.preference:
            if request.max_reallocation_pct is not None:
                user.preference.max_reallocation_pct = request.max_reallocation_pct
            if request.risk_tolerance_level is not None:
                user.preference.risk_tolerance_level = request.risk_tolerance_level
            if request.preferred_benchmark is not None:
                user.preference.preferred_benchmark = request.preferred_benchmark
            if request.investment_goal is not None:
                user.preference.investment_goal = request.investment_goal
            if request.timezone is not None:
                user.preference.timezone = request.timezone
            if request.preferred_currency is not None:
                user.preference.preferred_currency = request.preferred_currency

            self.user_repo.update_preference(user.preference)

        updated_user = self.user_repo.get_by_id(user_id)
        return UserProfileResponse.model_validate(updated_user)
