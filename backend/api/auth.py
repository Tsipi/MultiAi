"""fastapi-users auth setup — register, login, JWT, current user."""

from __future__ import annotations

import logging
import uuid

from fastapi import Depends
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


# ── Pydantic schemas exposed to FastAPI routes ───────────────────────────────

class UserRead(schemas.BaseUser[uuid.UUID]):
    pass


class UserCreate(schemas.BaseUserCreate):
    pass


class UserUpdate(schemas.BaseUserUpdate):
    pass


# ── Database adapter ─────────────────────────────────────────────────────────

async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)


# ── User manager (business logic: registration, password reset, etc.) ────────

class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = _cfg.jwt_secret
    verification_token_secret = _cfg.jwt_secret

    async def on_after_register(self, user: User, request=None) -> None:
        _log.info("New user registered: %s", user.email)


async def get_user_manager(user_db=Depends(get_user_db)):
    yield UserManager(user_db)


# ── JWT authentication backend ───────────────────────────────────────────────

_bearer_transport = BearerTransport(tokenUrl="/api/auth/login")


def _get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=_cfg.jwt_secret, lifetime_seconds=JWT_LIFETIME_SECONDS)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=_bearer_transport,
    get_strategy=_get_jwt_strategy,
)

# ── Main FastAPIUsers instance ───────────────────────────────────────────────

fastapi_users_instance = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])

# Dependency injected into routes that need the logged-in user
current_active_user = fastapi_users_instance.current_user(active=True)

# Same but returns None instead of 401 when no token is present
optional_current_user = fastapi_users_instance.current_user(active=True, optional=True)
