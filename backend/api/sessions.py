"""Session retrieval API routes."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.config import AppConfig
from backend.storage.session_store import delete_session, list_sessions, load_session

router = APIRouter(prefix="/api/sessions", tags=["sessions"])
CFG = AppConfig()


@router.get("")
async def sessions_index() -> list[dict]:
    """List available stored sessions."""
    return list_sessions(CFG.sessions_dir)


@router.get("/{session_id}")
async def sessions_get(session_id: str):
    """Return one stored session payload."""
    try:
        session = load_session(session_id, CFG.sessions_dir)
        return JSONResponse(session.to_dict())
    except Exception:  # noqa: BLE001
        return JSONResponse({"error": "session_not_found"}, status_code=404)


@router.delete("/{session_id}")
async def sessions_delete(session_id: str):
    """Delete one stored session."""
    deleted = delete_session(session_id, CFG.sessions_dir)
    return JSONResponse({"deleted": deleted}, status_code=200 if deleted else 404)
