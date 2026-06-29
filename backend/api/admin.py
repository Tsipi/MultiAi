"""Admin-only API routes for user management and operational visibility."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.auth import current_active_user, get_user_manager
from backend.storage.database import get_async_session
from backend.storage.db_models import Run, User

_log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


async def _require_admin(user: User = Depends(current_active_user)) -> User:
    if not user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user


@router.get("/users")
async def admin_list_users(
    q: str = "",
    db: AsyncSession = Depends(get_async_session),
    _: User = Depends(_require_admin),
) -> list[dict]:
    """Return all users with total run counts, optionally filtered by email."""
    stmt = select(User).order_by(User.email)
    if q:
        stmt = stmt.where(User.email.ilike(f"%{q}%"))
    rows = (await db.execute(stmt)).scalars().all()

    # Batch-fetch total run counts to avoid N+1 queries
    user_ids = [u.id for u in rows]
    run_counts: dict = {}
    if user_ids:
        count_stmt = (
            select(Run.user_id, func.count().label("cnt"))
            .where(Run.user_id.in_(user_ids))
            .group_by(Run.user_id)
        )
        for row in (await db.execute(count_stmt)).all():
            run_counts[str(row.user_id)] = row.cnt

    return [
        {
            "id": str(u.id),
            "email": u.email,
            "display_name": u.display_name,
            "is_active": u.is_active,
            "is_superuser": u.is_superuser,
            "is_verified": u.is_verified,
            "runs_this_month": u.runs_this_month,
            "total_runs": run_counts.get(str(u.id), 0),
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "runs_reset_at": u.runs_reset_at.isoformat() if u.runs_reset_at else None,
        }
        for u in rows
    ]


@router.get("/users/{user_id}")
async def admin_get_user(
    user_id: str,
    db: AsyncSession = Depends(get_async_session),
    _: User = Depends(_require_admin),
) -> dict:
    """Return one user with aggregate run statistics."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    total_runs = await db.scalar(select(func.count()).where(Run.user_id == user.id)) or 0
    return {
        "id": str(user.id),
        "email": user.email,
        "display_name": user.display_name,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "is_verified": user.is_verified,
        "runs_this_month": user.runs_this_month,
        "runs_reset_at": user.runs_reset_at.isoformat() if user.runs_reset_at else None,
        "total_runs": total_runs,
    }


@router.patch("/users/{user_id}/disable")
async def admin_disable_user(
    user_id: str,
    db: AsyncSession = Depends(get_async_session),
    admin: User = Depends(_require_admin),
) -> dict:
    """Deactivate a user account. Superusers cannot be disabled."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.is_superuser:
        raise HTTPException(status_code=400, detail="Cannot disable a superuser account.")
    if str(user.id) == str(admin.id):
        raise HTTPException(status_code=400, detail="Cannot disable your own account.")
    user.is_active = False
    await db.commit()
    _log.warning("Admin %s disabled user %s", admin.email, user.email)
    return {"id": str(user.id), "is_active": False}


@router.patch("/users/{user_id}/enable")
async def admin_enable_user(
    user_id: str,
    db: AsyncSession = Depends(get_async_session),
    admin: User = Depends(_require_admin),
) -> dict:
    """Re-activate a disabled user account."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_active = True
    await db.commit()
    _log.info("Admin %s enabled user %s", admin.email, user.email)
    return {"id": str(user.id), "is_active": True}


@router.post("/users/{user_id}/resend-verification")
async def admin_resend_verification(
    user_id: str,
    request: Request,
    db: AsyncSession = Depends(get_async_session),
    admin: User = Depends(_require_admin),
    user_manager=Depends(get_user_manager),
) -> dict:
    """Trigger a new email verification email for a specific user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="User is already verified.")
    await user_manager.request_verify(user, request)
    _log.info("Admin %s triggered verification resend for %s", admin.email, user.email)
    return {"detail": "Verification email sent."}


@router.get("/stats")
async def admin_stats(
    db: AsyncSession = Depends(get_async_session),
    _: User = Depends(_require_admin),
) -> dict:
    """High-level stats for the admin dashboard."""
    total_users = await db.scalar(select(func.count()).select_from(User)) or 0
    active_users = await db.scalar(select(func.count()).where(User.is_active == True)) or 0  # noqa: E712
    total_runs = await db.scalar(select(func.count()).select_from(Run)) or 0
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_runs": total_runs,
    }
