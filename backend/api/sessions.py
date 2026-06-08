"""Session retrieval API routes."""

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from backend.storage.database import get_async_session
from backend.storage.db_session_store import delete_session, list_sessions, load_session

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("")
async def sessions_index(db: AsyncSession = Depends(get_async_session)) -> list[dict]:
    """List available stored sessions."""
    return await list_sessions(db)


@router.get("/{session_id}")
async def sessions_get(session_id: str, db: AsyncSession = Depends(get_async_session)):
    """Return one stored session payload."""
    try:
        session = await load_session(session_id, db)
        return JSONResponse(session.to_dict())
    except FileNotFoundError:
        return JSONResponse({"error": "session_not_found"}, status_code=404)


@router.delete("/{session_id}")
async def sessions_delete(session_id: str, db: AsyncSession = Depends(get_async_session)):
    """Delete one stored session."""
    deleted = await delete_session(session_id, db)
    return JSONResponse({"deleted": deleted}, status_code=200 if deleted else 404)
