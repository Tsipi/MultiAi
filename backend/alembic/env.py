"""Alembic environment — async SQLAlchemy + auto-detect models."""

from __future__ import annotations

import asyncio
import os
from logging.config import fileConfig

from alembic import context
from dotenv import find_dotenv, load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv(find_dotenv(usecwd=True), override=True)

from backend.storage.database import Base, _async_url  # noqa: E402
import backend.storage.db_models  # noqa: E402, F401

alembic_cfg = context.config
if alembic_cfg.config_file_name is not None:
    fileConfig(alembic_cfg.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Generate SQL scripts without a live DB connection (rarely used)."""
    url = _async_url(os.getenv("DATABASE_URL", ""))
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:  # type: ignore[type-arg]
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Connect to the DB and apply pending migrations."""
    url = _async_url(os.getenv("DATABASE_URL", ""))
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        await conn.run_sync(do_run_migrations)
    await engine.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
