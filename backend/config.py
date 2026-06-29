"""Application configuration and constants."""

from dataclasses import dataclass, field
from pathlib import Path
import os

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class AppConfig:
    """Runtime configuration for consensus engine."""

    openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")
    openrouter_base_url: str = os.getenv(
        "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
    )
    default_writer_model: str = os.getenv("DEFAULT_WRITER_MODEL", "openai/gpt-5.4")
    default_critic_model_a: str = os.getenv(
        "DEFAULT_CRITIC_MODEL_A", "anthropic/claude-sonnet-4.6"
    )
    default_critic_model_b: str = os.getenv(
        "DEFAULT_CRITIC_MODEL_B", "google/gemini-3.1-pro"
    )
    utility_model: str = field(default_factory=lambda: os.getenv("UTILITY_MODEL", "deepseek/deepseek-chat-v3.2"))
    intent_model: str = field(default_factory=lambda: os.getenv("INTENT_MODEL", ""))
    scorer_model: str = field(default_factory=lambda: os.getenv("SCORER_MODEL", ""))
    summarizer_model: str = field(default_factory=lambda: os.getenv("SUMMARIZER_MODEL", ""))
    validator_model: str = field(default_factory=lambda: os.getenv("VALIDATOR_MODEL", ""))
    export_title_model: str = os.getenv("EXPORT_TITLE_MODEL", "openrouter/gpt-oss-120b")
    web_search_model: str = os.getenv("WEB_SEARCH_MODEL", "openai/gpt-5.4")
    web_search_engine: str = os.getenv("WEB_SEARCH_ENGINE", "exa")
    web_search_max_results: int = int(os.getenv("WEB_SEARCH_MAX_RESULTS", "5"))
    web_search_timeout_seconds: float = float(os.getenv("WEB_SEARCH_TIMEOUT_SECONDS", "45"))
    fast_web_search_timeout_seconds: float = float(os.getenv("FAST_WEB_SEARCH_TIMEOUT_SECONDS", "20"))
    web_research_context_chars: int = int(os.getenv("WEB_RESEARCH_CONTEXT_CHARS", "12000"))
    jwt_secret: str = os.getenv("JWT_SECRET", "change-me-in-production")
    sessions_dir: Path = Path("sessions")
    # App public URL — used in password-reset / verification email links
    app_url: str = os.getenv("APP_URL", "http://localhost:5173")
    # Email provider: "log" (dev, prints to console) | "resend" | "smtp"
    email_provider: str = os.getenv("EMAIL_PROVIDER", "log")
    email_from: str = os.getenv("EMAIL_FROM", "TeamStoa <noreply@teamstoa.com>")
    resend_api_key: str = os.getenv("RESEND_API_KEY", "")
    smtp_host: str = os.getenv("SMTP_HOST", "")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_username: str = os.getenv("SMTP_USERNAME", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    # Usage quota (runs per calendar month, free tier only; superusers are exempt)
    free_tier_quota: int = int(os.getenv("FREE_TIER_QUOTA", "20"))
    max_rounds_default: int = 2
    consensus_default: int = 8
    min_relevance_score: float = 7.0
    summary_max_tokens: int = 200
    attachment_text_chars: int = 8000
    attachment_image_limit: int = 3
    attachment_pdf_page_limit: int = 12
    allowed_origins: str = os.getenv("ALLOWED_ORIGINS", "*")

    def __post_init__(self) -> None:
        """Fill utility-role model defaults from the shared utility model."""
        for name in ("intent_model", "scorer_model", "summarizer_model", "validator_model"):
            if not getattr(self, name):
                object.__setattr__(self, name, self.utility_model)
