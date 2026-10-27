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


def create_access_token(data=None, subject=None, roles=None, **kwargs):
    """Backward-compatible test/helper wrapper around the canonical security token creator.

    Older integration scripts imported this helper from ``dependencies.auth`` and
    passed ``data={"sub": ...}``; production code uses ``app.core.security``.
    Keeping the adapter here prevents legacy tests from failing at collection.
    """
    payload = data if isinstance(data, dict) else {}
    token_subject = subject or payload.get("sub") or payload.get("email")
    token_roles = roles or ([payload.get("role")] if payload.get("role") else None)
    if not token_subject:
        raise ValueError("create_access_token requires subject or data['sub']")
    return security.create_access_token(token_subject, roles=token_roles)

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
        user_role = (current_user.role or "USER").upper()
        target_role = required_role.upper()
        if user_role not in ("ADMIN", "SYSTEM_ADMIN") and user_role != target_role:
            raise PermissionDeniedException(f"Operation requires '{required_role}' permission")
        return current_user
    return role_checker


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency enforcing ADMIN access control."""
    user_role = (current_user.role or "USER").upper()
    if user_role not in ("ADMIN", "SYSTEM_ADMIN"):
        raise PermissionDeniedException("Operation requires 'ADMIN' permission")
    return current_user


oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)


def get_optional_current_user(
    token: str | None = Depends(oauth2_scheme_optional),
    user_repo: UserRepository = Depends(get_user_repository)
) -> User | None:
    """Optional bearer access token validation. Returns User if valid, None otherwise."""
    if not token:
        return None
    try:
        payload = security.decode_token(token)
        if not payload or payload.get("type") != "access":
            return None
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None
        user = user_repo.get_by_id(user_id_str)
        return user if user and user.is_active else None
    except Exception:
        return None
