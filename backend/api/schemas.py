"""Pydantic models for API contracts."""

from pydantic import BaseModel, Field, model_validator


class AttachmentPayload(BaseModel):
    """Attachment information sent with consult request."""

    kind: str
    name: str
    mime_type: str
    data: str


class ConsultRequest(BaseModel):
    """Input payload for consultation endpoint."""

    # ── Input / question ────────────────────────────────────────────────────
    question: str
    role: str = Field(max_length=255)
    attachments: list[AttachmentPayload] = Field(default_factory=list)
    web_search_mode: str = Field(default="auto", pattern="^(off|auto|on)$")
    answer_mode: str = Field(default="balanced", pattern="^(fast|balanced|deep)$")

    # ── Team ────────────────────────────────────────────────────────────────
    # Preferred: full lists sent by the frontend team builder
    writers: list[str] = Field(default_factory=list, max_length=6)
    critics: list[str] = Field(default_factory=list, max_length=6)
    writer_names: list[str] = Field(default_factory=list)
    critic_names: list[str] = Field(default_factory=list)
    writer_roles: list[str] = Field(default_factory=list)
    critic_roles: list[str] = Field(default_factory=list)
    team_template_id: str = ""
    # Legacy single-model fields — coerced into the list fields by the validator below
    writer: str = ""
    critic_a: str = ""
    critic_b: str = ""

    @model_validator(mode="after")
    def _coerce_and_validate_team(self) -> "ConsultRequest":
        """Populate list fields from legacy named fields, then enforce minimum sizes."""
        if not self.writers and self.writer:
            self.writers = [self.writer]
        if not self.critics:
            self.critics = [m for m in (self.critic_a, self.critic_b) if m]
        if not self.writers:
            raise ValueError("At least one writer model is required.")
        if not self.critics:
            raise ValueError("At least one critic model is required.")
        return self

    # ── Debate settings ─────────────────────────────────────────────────────
    max_rounds: int = Field(ge=1, le=6)
    consensus_score: int = Field(ge=6, le=10)

    # ── Clarification flow ──────────────────────────────────────────────────
    clarification: str = Field(default="", max_length=512)
    clarification_question: str = Field(default="", max_length=1024)

    # ── Follow-up chain ─────────────────────────────────────────────────────
    is_followup: bool = False
    thread_id: str = ""
    parent_session_id: str = ""
    root_question: str = ""
    source_prompt: str = ""
    source_final_answer: str = ""
    source_final_score: float = 0.0
    followup_instruction: str = ""


class ConsultResponse(BaseModel):
    """Serialized response returned to the frontend."""

    # ── Identity ────────────────────────────────────────────────────────────
    session_id: str

    # ── Input / question ────────────────────────────────────────────────────
    question: str = ""
    role: str = ""
    base_question: str = ""
    attachment_files: list[dict] = Field(default_factory=list)
    web_search_mode: str = "auto"
    answer_mode: str = "balanced"
    web_search_performed: bool = False
    web_search_query: str = ""
    web_search_retrieved_at: str = ""
    web_search_sources: list[dict] = Field(default_factory=list)
    web_search_summary: str = ""
    web_search_warning: str = ""

    # ── Team ────────────────────────────────────────────────────────────────
    model_writers: list[str] = []
    model_critics: list[str] = []
    writer_names: list[str] = []
    critic_names: list[str] = []
    writer_roles: list[str] = []
    critic_roles: list[str] = []
    team_template_id: str = ""

    # ── Debate output ───────────────────────────────────────────────────────
    final_answer: str
    final_score: float
    full_discussion: list[dict]
    status: str = "completed"
    cost_hint: str

    # ── Clarification flow ──────────────────────────────────────────────────
    needs_clarification: bool = False
    clarification_question: str = ""
    clarification_reason: str = ""
    clarification_options: list[str] = []
    clarification_response: str = ""

    # ── Follow-up chain ─────────────────────────────────────────────────────
    is_followup: bool = False
    thread_id: str = ""
    parent_session_id: str = ""
    root_question: str = ""
    source_prompt: str = ""
    source_final_answer: str = ""
    source_final_score: float = 0.0
    followup_instruction: str = ""

    # ── Usage & cost ────────────────────────────────────────────────────────
    model_costs: list[dict] = []
    total_cost_usd: float = 0.0
    total_tokens: int = 0
    total_duration_seconds: float = 0.0
    phase_timings: list[dict] = []
