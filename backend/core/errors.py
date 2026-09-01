from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status


class AppError(HTTPException):
    def __init__(self, status_code: int, code: str, message: str, details: Any = None) -> None:
        super().__init__(
            status_code=status_code,
            detail={"code": code, "message": message, "details": details},
        )


def not_found(message: str = "Resource not found") -> AppError:
    return AppError(status.HTTP_404_NOT_FOUND, "not_found", message)


def conflict(message: str) -> AppError:
    return AppError(status.HTTP_409_CONFLICT, "conflict", message)


def unauthorized(message: str = "Authentication required") -> AppError:
    return AppError(status.HTTP_401_UNAUTHORIZED, "unauthorized", message)


def forbidden(message: str = "Insufficient permissions") -> AppError:
    return AppError(status.HTTP_403_FORBIDDEN, "forbidden", message)


def bad_request(message: str, details: Any = None) -> AppError:
    return AppError(status.HTTP_400_BAD_REQUEST, "bad_request", message, details)


def service_unavailable(message: str) -> AppError:
    return AppError(status.HTTP_503_SERVICE_UNAVAILABLE, "unavailable", message)
