"""SQLAlchemy async engine and session factory."""

from __future__ import annotations

import os
from pathlib import Path
from typing import AsyncGenerator

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

load_dotenv(Path(__file__).parent.parent.parent / ".env")


def _async_url(raw: str) -> str:
    """Ensure the URL uses the asyncpg driver prefix that SQLAlchemy async requires."""
    if raw.startswith("postgres://"):
        return raw.replace("postgres://", "postgresql+asyncpg://", 1)
    if raw.startswith("postgresql://") and "+asyncpg" not in raw:
        return raw.replace("postgresql://", "postgresql+asyncpg://", 1)
    return raw


class Base(DeclarativeBase):
    pass


_engine: AsyncEngine | None = None
_session_maker: async_sessionmaker[AsyncSession] | None = None


def _get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        _engine = create_async_engine(_async_url(os.getenv("DATABASE_URL", "")), echo=False, pool_pre_ping=True)
    return _engine


def _get_session_maker() -> async_sessionmaker[AsyncSession]:
    global _session_maker
    if _session_maker is None:
        _session_maker = async_sessionmaker(_get_engine(), expire_on_commit=False)
    return _session_maker


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with _get_session_maker()() as session:
        yield session
