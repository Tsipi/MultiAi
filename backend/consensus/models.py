"""Dataclasses for debate entities."""

from dataclasses import asdict, dataclass, field
from datetime import datetime


@dataclass
class DebateRound:
    """Single round state in the debate loop."""

    round_num: int
    answer: str
    critique: str
    consensus_score: float
    consensus_reason: str
    summary: str
    relevance_score: float = 0.0
    relevance_reason: str = ""


@dataclass
class DebateSession:
    """Complete debate session persisted to storage."""

    session_id: str
    question: str
    domain: str
    rounds: list[DebateRound] = field(default_factory=list)
    final_answer: str = ""
    final_score: float = 0.0
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    model_writer: str = ""
    model_critic_a: str = ""
    model_critic_b: str = ""
    intent_scope: str = ""
    needs_clarification: bool = False
    clarification_question: str = ""
    clarification_reason: str = ""
    clarification_options: list[str] = field(default_factory=list)
    model_costs: list[dict] = field(default_factory=list)
    total_cost_usd: float = 0.0
    total_tokens: int = 0
    thread_id: str = ""
    parent_session_id: str = ""
    is_followup: bool = False
    source_prompt: str = ""
    source_final_answer: str = ""
    followup_instruction: str = ""

    def to_dict(self) -> dict:
        """Return serializable session dictionary."""
        return asdict(self)
