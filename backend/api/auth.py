"""fastapi-users auth setup — register, login, JWT, password reset, email verification."""

from __future__ import annotations

import logging
import uuid

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin, schemas
from fastapi_users.authentication import AuthenticationBackend, BearerTransport, JWTStrategy
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import AppConfig
from backend.storage.database import get_async_session
from backend.storage.db_models import User

_log = logging.getLogger(__name__)
_cfg = AppConfig()

JWT_LIFETIME_SECONDS = 60 * 60 * 24 * 30  # 30 days


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class UserRead(schemas.BaseUser[uuid.UUID]):
    display_name: str | None = None
    runs_this_month: int = 0


class UserCreate(schemas.BaseUserCreate):
    display_name: str | None = None


class UserUpdate(schemas.BaseUserUpdate):
    display_name: str | None = None


# ── Database adapter ──────────────────────────────────────────────────────────

async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)


# ── User manager ──────────────────────────────────────────────────────────────

class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = _cfg.jwt_secret
    verification_token_secret = _cfg.jwt_secret

    async def on_after_register(self, user: User, request: Request | None = None) -> None:
        _log.info("New user registered: %s", user.email)

    async def on_after_forgot_password(
        self, user: User, token: str, request: Request | None = None
    ) -> None:
        from backend.services.email import send_password_reset_email
        try:
            await send_password_reset_email(user.email, token, _cfg)
        except Exception:
            _log.exception("Failed to send password reset email to %s", user.email)

    async def on_after_reset_password(self, user: User, request: Request | None = None) -> None:
        _log.info("Password reset for user: %s", user.email)

    async def on_after_request_verify(
        self, user: User, token: str, request: Request | None = None
    ) -> None:
        from backend.services.email import send_verification_email
        try:
            await send_verification_email(user.email, token, _cfg)
        except Exception:
            _log.exception("Failed to send verification email to %s", user.email)

    async def on_after_verify(self, user: User, request: Request | None = None) -> None:
        _log.info("User verified: %s", user.email)


async def get_user_manager(user_db=Depends(get_user_db)):
    yield UserManager(user_db)


# ── JWT authentication backend ────────────────────────────────────────────────

_bearer_transport = BearerTransport(tokenUrl="/api/auth/login")


def _get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=_cfg.jwt_secret, lifetime_seconds=JWT_LIFETIME_SECONDS)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=_bearer_transport,
    get_strategy=_get_jwt_strategy,
)

# ── FastAPIUsers instance ─────────────────────────────────────────────────────

fastapi_users_instance = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])

current_active_user = fastapi_users_instance.current_user(active=True)
optional_current_user = fastapi_users_instance.current_user(active=True, optional=True)
