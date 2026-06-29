"""One-time seed script: create admin user and migrate JSON sessions to DB.

Run once from the project root:
    uv run python -m backend.scripts.seed_admin

Credentials are read from environment variables:
    ADMIN_EMAIL    (default: admin@teamstoa.com)
    ADMIN_PASSWORD (required — no default for security)

Safe to run multiple times — skips existing sessions and won't create a
duplicate admin user.
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys

from fastapi_users.password import PasswordHelper
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import AppConfig
from backend.storage.database import _get_session_maker
from backend.storage.db_models import User
from backend.storage.db_session_store import save_session as save_session_db
from backend.storage.session_store import load_session

_log = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@teamstoa.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")

if not ADMIN_PASSWORD:
    _log.error("ADMIN_PASSWORD env var is required. Set it before running this script.")
    sys.exit(1)

CFG = AppConfig()
_pwd = PasswordHelper()


async def get_or_create_admin(db: AsyncSession) -> User:
    """Return the existing admin user or create one if it doesn't exist."""
    result = await db.execute(select(User).where(User.email == ADMIN_EMAIL))
    user = result.scalar_one_or_none()

    if user is not None:
        _log.info("Admin user already exists — skipping creation")
        return user

    user = User(
        email=ADMIN_EMAIL,
        hashed_password=_pwd.hash(ADMIN_PASSWORD),
        is_active=True,
        is_superuser=True,
        is_verified=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    _log.info("Admin user created: %s", ADMIN_EMAIL)
    return user


async def migrate_json_sessions(db: AsyncSession, admin: User) -> None:
    """Load every JSON session file and save it to the DB under the admin user."""
    sessions_dir = CFG.sessions_dir
    if not sessions_dir.exists():
        _log.info("No sessions/ directory found — nothing to migrate")
        return

    files = sorted(sessions_dir.glob("*.json"))
    _log.info("Found %d JSON session files", len(files))

    migrated = skipped = 0
    for file in files:
        session_id = file.stem
        try:
            session = load_session(session_id, sessions_dir)
            await save_session_db(session, db, user_id=admin.id)
            migrated += 1
            _log.info("  migrated  %s", session_id)
        except Exception as exc:  # noqa: BLE001
            _log.warning("  skipped   %s  (%s)", session_id, exc)
            skipped += 1

    _log.info("Done — %d migrated, %d skipped", migrated, skipped)


async def main() -> None:
    async with _get_session_maker()() as db:
        admin = await get_or_create_admin(db)
        await migrate_json_sessions(db, admin)


if __name__ == "__main__":
    asyncio.run(main())
