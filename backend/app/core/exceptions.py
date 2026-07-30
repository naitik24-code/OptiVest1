from typing import Any, Dict, Optional
from fastapi import HTTPException, status

class OptiVestException(HTTPException):
    def __init__(
        self,
        status_code: int,
        message: str,
        code: str = "BAD_REQUEST",
        details: Optional[Any] = None
    ):
        super().__init__(status_code=status_code, detail=message)
        self.message = message
        self.code = code
        self.details = details


class AuthenticationException(OptiVestException):
    def __init__(self, message: str = "Invalid authentication credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=message,
            code="AUTHENTICATION_FAILED"
        )


class PermissionDeniedException(OptiVestException):
    def __init__(self, message: str = "Permission denied"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message=message,
            code="PERMISSION_DENIED"
        )


class NotFoundException(OptiVestException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=message,
            code="NOT_FOUND"
        )


class ConflictException(OptiVestException):
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            message=message,
            code="RESOURCE_CONFLICT"
        )
