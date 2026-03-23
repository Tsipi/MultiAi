"""Attachment parsing utilities for consult requests."""

from __future__ import annotations

import base64
from io import BytesIO

from pydantic import BaseModel

from backend.config import AppConfig


class AttachmentIn(BaseModel):
    """Attachment payload received from frontend."""

    kind: str
    name: str
    mime_type: str
    data: str


def build_attachment_context(
    attachments: list[AttachmentIn], cfg: AppConfig
) -> tuple[str, list[str]]:
    """Return trimmed text context and image data URLs."""
    text_parts: list[str] = []
    images: list[str] = []
    for item in attachments:
        if item.kind == "image" and item.data.startswith("data:image/"):
            if len(images) < cfg.attachment_image_limit:
                images.append(item.data)
            continue
        if item.kind == "pdf":
            extracted = _read_pdf_text(item.data, cfg.attachment_pdf_page_limit)
            if extracted:
                text_parts.append(f"[File: {item.name}]\n{extracted}")
            continue
        if item.kind == "text" and item.data.strip():
            text_parts.append(f"[File: {item.name}]\n{item.data.strip()}")
    full_text = "\n\n".join(text_parts).strip()
    return full_text[: cfg.attachment_text_chars], images


def _read_pdf_text(data_url: str, max_pages: int) -> str:
    """Extract up to max_pages from a base64 data URL PDF."""
    if "," not in data_url:
        return ""
    try:
        from pypdf import PdfReader

        raw = base64.b64decode(data_url.split(",", 1)[1], validate=True)
        pages = PdfReader(BytesIO(raw)).pages[:max_pages]
        return "\n".join((page.extract_text() or "").strip() for page in pages if page).strip()
    except Exception:  # noqa: BLE001
        return ""
