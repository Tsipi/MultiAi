"""Application configuration and constants."""

from dataclasses import dataclass
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
    scorer_model: str = "deepseek/deepseek-chat-v3.2"
    summarizer_model: str = "deepseek/deepseek-chat-v3.2"
    export_title_model: str = os.getenv("EXPORT_TITLE_MODEL", "openrouter/gpt-oss-120b")
    sessions_dir: Path = Path("sessions")
    max_rounds_default: int = 3
    consensus_default: int = 8
    min_relevance_score: float = 7.0
    summary_max_tokens: int = 200
    attachment_text_chars: int = 8000
    attachment_image_limit: int = 3
    attachment_pdf_page_limit: int = 12
