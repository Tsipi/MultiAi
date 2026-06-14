"""Public read-only access to shared sessions — no auth required."""

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from backend.storage.database import get_async_session
from backend.storage.db_session_store import load_shared_session

router = APIRouter(prefix="/api/shared", tags=["shared"])


@router.get("/{slug}")
async def shared_get(
    slug: str,
    db: AsyncSession = Depends(get_async_session),
):
    """Return a publicly shared session by slug — 404 if not shared."""
    session = await load_shared_session(slug, db)
    if session is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    payload = session.to_dict()
    payload["visibility"] = "public"
    payload["public_slug"] = slug
    return JSONResponse(payload)
