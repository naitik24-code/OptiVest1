from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserPreferenceSchema(BaseModel):
    max_reallocation_pct: float = Field(default=15.0, ge=1.0, le=100.0)
    risk_tolerance_level: int = Field(default=3, ge=1, le=5)
    preferred_benchmark: str = Field(default="SP500")
    investment_goal: str = Field(default="Growth")
    timezone: str = Field(default="UTC")
    preferred_currency: str = Field(default="USD")

    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: str
    is_active: bool
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfileResponse(UserResponse):
    preference: Optional[UserPreferenceSchema] = None


class UserProfileUpdateRequest(BaseModel):
    avatar_url: Optional[str] = None
    max_reallocation_pct: Optional[float] = Field(None, ge=1.0, le=100.0)
    risk_tolerance_level: Optional[int] = Field(None, ge=1, le=5)
    preferred_benchmark: Optional[str] = None
    investment_goal: Optional[str] = None
    timezone: Optional[str] = None
    preferred_currency: Optional[str] = None
