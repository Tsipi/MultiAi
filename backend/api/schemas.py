"""Pydantic models for API contracts."""

from pydantic import BaseModel, Field


class AttachmentPayload(BaseModel):
    """Attachment information sent with consult request."""

    kind: str
    name: str
    mime_type: str
    data: str


class ConsultRequest(BaseModel):
    """Input payload for consultation endpoint."""

    writer: str
    critic_a: str
    critic_b: str
    max_rounds: int = Field(ge=1, le=6)
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
