from datetime import datetime, timezone
from typing import Generic, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class MetaEnvelope(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    request_id: Optional[str] = None


class ResponseEnvelope(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    error: Optional[dict] = None
    meta: MetaEnvelope = Field(default_factory=MetaEnvelope)

    @classmethod
    def success_response(cls, data: T) -> "ResponseEnvelope[T]":
        return cls(success=True, data=data)



class MessagePayload(BaseModel):
    message: str



