from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core import security
from app.core.config import settings
from app.core.exceptions import AuthenticationException, PermissionDeniedException
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    """Dependency injector providing UserRepository instance."""
    return UserRepository(db)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_repo: UserRepository = Depends(get_user_repository)
) -> User:
    """Validate bearer access token and return current authenticated User entity."""
    payload = security.decode_token(token)
    if not payload or payload.get("type") != "access":
        raise AuthenticationException("Could not validate authorization token")

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise AuthenticationException("Token payload missing subject claim")

    user = user_repo.get_by_id(user_id_str)
    if not user:
        raise AuthenticationException("User referenced by token does not exist")

    if not user.is_active:
        raise AuthenticationException("User account is inactive")

    return user


def require_role(required_role: str):
    """Factory dependency enforcing Role-Based Access Control (RBAC)."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != required_role and current_user.role != "SYSTEM_ADMIN":
            raise PermissionDeniedException(f"Operation requires '{required_role}' permission")
        return current_user
    return role_checker
