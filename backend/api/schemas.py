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

    # Preferred: full team lists
    writers: list[str] = Field(default_factory=list, max_length=6)
    critics: list[str] = Field(default_factory=list, max_length=6)
    # Legacy single-model fields kept for backward compatibility
    writer: str = ""
    critic_a: str = ""
    critic_b: str = ""

    max_rounds: int = Field(ge=1, le=6)

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
    consensus_score: int = Field(ge=6, le=10)
    role: str = Field(max_length=255)
    question: str
    clarification: str = Field(default="", max_length=512)
    attachments: list[AttachmentPayload] = Field(default_factory=list)
    is_followup: bool = False
    parent_session_id: str = ""
    thread_id: str = ""
    source_prompt: str = ""
    source_final_answer: str = ""
    followup_instruction: str = ""


class ConsultResponse(BaseModel):
    """Serialized response for frontend UI."""

    session_id: str
    question: str = ""
    role: str = ""
    final_answer: str
    final_score: float
    cost_hint: str
    full_discussion: list[dict]
    status: str = "completed"
    needs_clarification: bool = False
    clarification_question: str = ""
    clarification_reason: str = ""
    clarification_options: list[str] = []
    model_costs: list[dict] = []
    total_cost_usd: float = 0.0
    total_tokens: int = 0
    thread_id: str = ""
    parent_session_id: str = ""
    is_followup: bool = False
    source_prompt: str = ""
    source_final_answer: str = ""
    followup_instruction: str = ""
    base_question: str = ""
    attachment_files: list[dict] = Field(default_factory=list)
