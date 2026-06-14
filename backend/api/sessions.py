"""Session retrieval API routes."""

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.auth import current_active_user
from backend.storage.database import get_async_session
from backend.storage.db_models import User
from backend.storage.db_session_store import (
    delete_session,
    get_share_info,
    list_sessions,
    load_session,
    share_session,
    unshare_session,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("")
async def sessions_index(
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_active_user),
) -> list[dict]:
    """List sessions belonging to the authenticated user."""
    return await list_sessions(db, user_id=current_user.id)


@router.get("/{session_id}")
async def sessions_get(
    session_id: str,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_active_user),
):
    """Return one stored session — 404 if not found or owned by another user."""
    try:
        session = await load_session(session_id, db, user_id=current_user.id)
        payload = session.to_dict()
    except FileNotFoundError:
        return JSONResponse({"error": "session_not_found"}, status_code=404)

    share_info = await get_share_info(session_id, db, user_id=current_user.id)
    if share_info is not None:
        visibility, public_slug = share_info
        payload["visibility"] = visibility
        payload["public_slug"] = public_slug
    return JSONResponse(payload)


@router.delete("/{session_id}")
async def sessions_delete(
    session_id: str,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_active_user),
):
    """Delete a session owned by the authenticated user."""
    deleted = await delete_session(session_id, db, user_id=current_user.id)
    return JSONResponse({"deleted": deleted}, status_code=200 if deleted else 404)


@router.post("/{session_id}/share")
async def sessions_share(
    session_id: str,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_active_user),
):
    """Make a session publicly viewable and return its share slug."""
    slug = await share_session(session_id, db, user_id=current_user.id)
    if slug is None:
        return JSONResponse({"error": "session_not_found"}, status_code=404)
    return JSONResponse({"visibility": "public", "public_slug": slug})


@router.post("/{session_id}/unshare")
async def sessions_unshare(
    session_id: str,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_active_user),
):
    """Make a session private again."""
    ok = await unshare_session(session_id, db, user_id=current_user.id)
    if not ok:
        return JSONResponse({"error": "session_not_found"}, status_code=404)
    return JSONResponse({"visibility": "private", "public_slug": None})
