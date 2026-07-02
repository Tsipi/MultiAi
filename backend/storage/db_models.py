"""SQLAlchemy ORM models — one class per database table."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from backend.storage.database import Base


class User(SQLAlchemyBaseUserTableUUID, Base):
    """Auth user — managed by fastapi-users (email, hashed_password, JWT)."""

    __tablename__ = "users"

    display_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    runs_this_month: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    runs_reset_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, server_default="now()")
    pref_answer_mode: Mapped[str | None] = mapped_column(String(32), nullable=True)
    pref_web_research_mode: Mapped[str | None] = mapped_column(String(32), nullable=True)
    pref_team_template: Mapped[str | None] = mapped_column(String(64), nullable=True)


class Run(Base):
    """One debate session — maps 1:1 with a DebateSession."""

    __tablename__ = "runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    session_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(256), default="")
    prompt: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(16), default="done")       # running | done | error
    visibility: Mapped[str] = mapped_column(String(16), default="private")  # private | public
    public_slug: Mapped[str | None] = mapped_column(String(128), nullable=True)
    thread_id: Mapped[str] = mapped_column(String(64), default="")
    parent_session_id: Mapped[str] = mapped_column(String(64), default="")
    is_followup: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    team_config: Mapped[TeamConfig | None] = relationship(
        "TeamConfig", back_populates="run", uselist=False, cascade="all, delete-orphan"
    )
    output: Mapped[Output | None] = relationship(
        "Output", back_populates="run", uselist=False, cascade="all, delete-orphan"
    )
    files: Mapped[list[File]] = relationship(
        "File", back_populates="run", cascade="all, delete-orphan"
    )


class TeamConfig(Base):
    """Team members (models + names) used for a run."""

    __tablename__ = "team_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("runs.id"))
    members_json: Mapped[Any] = mapped_column(JSON, default=dict)

    run: Mapped[Run] = relationship("Run", back_populates="team_config")


class Output(Base):
    """Generated result for a run.

    full_session_json stores the complete DebateSession dict so no fields are
    lost — the structured columns (score, tokens, cost) exist for fast queries.
    """

    __tablename__ = "outputs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("runs.id"))
    final_answer_markdown: Mapped[str] = mapped_column(Text, default="")
    debate_logs_json: Mapped[Any] = mapped_column(JSON, default=list)
    score: Mapped[float] = mapped_column(Float, default=0.0)
    tokens: Mapped[int] = mapped_column(Integer, default=0)
    cost: Mapped[float] = mapped_column(Float, default=0.0)
    model_costs_json: Mapped[Any] = mapped_column(JSON, default=list)
    full_session_json: Mapped[Any] = mapped_column(JSON, default=dict)

    run: Mapped[Run] = relationship("Run", back_populates="output")


class File(Base):
    """Metadata for an uploaded context file attached to a run."""

    __tablename__ = "files"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("runs.id"))
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    filename: Mapped[str] = mapped_column(String(256), default="")
    storage_url: Mapped[str] = mapped_column(String(512), default="")
    mime_type: Mapped[str] = mapped_column(String(128), default="")

    run: Mapped[Run] = relationship("Run", back_populates="files")
