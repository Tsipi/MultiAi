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

    # ── Identity ────────────────────────────────────────────────────────────
    session_id: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    # ── Input / question ────────────────────────────────────────────────────
    question: str = ""          # full question sent to LLMs (may include attachment text)
    base_question: str = ""     # raw user question before attachment injection
    domain: str = ""            # writer expert-role prompt (maps to "role" in API)
    attachment_files: list[dict] = field(default_factory=list)

    # ── Team ────────────────────────────────────────────────────────────────
    # OpenRouter model IDs — determine which LLMs are called
    model_writers: list[str] = field(default_factory=list)
    model_critics: list[str] = field(default_factory=list)
    # Display names shown in the UI (set by the user in the team builder)
    writer_names: list[str] = field(default_factory=list)
    critic_names: list[str] = field(default_factory=list)
    writer_roles: list[str] = field(default_factory=list)
    critic_roles: list[str] = field(default_factory=list)

    # ── Debate output ───────────────────────────────────────────────────────
    rounds: list[DebateRound] = field(default_factory=list)
    final_answer: str = ""
    final_score: float = 0.0
    intent_scope: str = ""      # one-line scope extracted by intent assessment

    # ── Clarification flow ──────────────────────────────────────────────────
    needs_clarification: bool = False
    clarification_question: str = ""
    clarification_reason: str = ""
    clarification_options: list[str] = field(default_factory=list)
    clarification_response: str = ""    # user's chosen answer

    # ── Follow-up chain ─────────────────────────────────────────────────────
    is_followup: bool = False
    thread_id: str = ""                 # shared across all runs in a thread
    parent_session_id: str = ""
    root_question: str = ""             # the very first question in this thread (never changes across follow-ups)
    source_prompt: str = ""             # immediate parent's question
    source_final_answer: str = ""       # immediate parent's final answer
    followup_instruction: str = ""      # what the user asked to change/extend

    # ── Usage & cost ────────────────────────────────────────────────────────
    model_costs: list[dict] = field(default_factory=list)
    total_cost_usd: float = 0.0
    total_tokens: int = 0

    def to_dict(self) -> dict:
        """Return serializable session dictionary."""
        return asdict(self)
