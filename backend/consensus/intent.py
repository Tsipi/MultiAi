"""Intent ambiguity detection and focused clarification helpers."""

import json
from dataclasses import dataclass

from backend.config import AppConfig
from backend.consensus.llm_clients import call_openrouter

INTENT_PROMPT = """Analyze whether this request is clear enough to answer without clarification.
Role: {role}
Question: {question}

Rules:
- Ask clarification only if truly needed.
- If clarification is needed, ask ONE focused multiple-choice question with 3-5 short options.
- Options must be easy to answer and mutually exclusive.
- Include "Other" as the final option.
- Do not ask open-ended questions.
- Use the role context and question wording to make options specific.
- Prefer concrete choices like scope/format/priority.

Respond as strict JSON:
{{"needs_clarification": true|false, "reason": "...", "intent_scope": "...", "clarification_question": "...", "clarification_options": ["..."]}}
"""
@dataclass
class IntentAssessment:
    """Structured result of ambiguity assessment."""

    is_ambiguous: bool
    reason: str
    intent_scope: str
    clarification_question: str = ""
    clarification_options: list[str] | None = None
def _with_other_option(options: list[str], limit: int = 5) -> list[str]:
    """Ensure 'Other' exists as the final clarification option."""
    clean = [x.strip() for x in options if x.strip()]
    no_other = [x for x in clean if x.lower() != "other"]
    room = max(limit - 1, 0)
    return [*no_other[:room], "Other"] if limit else []


def _fallback_assessment(question: str, role: str) -> IntentAssessment:
    """Fallback when LLM intent analysis cannot be parsed."""
    q = question.strip().lower()
    r = role.strip().lower()
    if len(q.split()) < 8 or not r or "search" in q or "tools" in q:
        if "job" in r or "linkedin" in r or "interview" in q:
            return IntentAssessment(
                True,
                "The request could mean different job-search scopes.",
                question.strip(),
                "Which area should the team focus on first?",
                _with_other_option(
                    ["Finding roles", "Submitting applications", "Interview process", "Tracking/search tools"]
                ),
            )
        return IntentAssessment(
            True,
            "The request can be interpreted in multiple scopes.",
            question.strip(),
            "Which interpretation should John, Christy, and Mark use?",
            _with_other_option(["Web search frustrations", "Research workflow", "Tool comparison only"]),
        )
    return IntentAssessment(False, "Intent appears clear.", question.strip(), "", [])


def _strip_fences(raw: str) -> str:
    """Remove markdown code fences around JSON payload."""
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`")
        text = text.replace("json", "", 1).strip()
    return text


async def assess_intent(question: str, role: str, clarification: str, cfg: AppConfig) -> IntentAssessment:
    """Assess clarity using an LLM and return focused clarification when needed."""
    if clarification.strip():
        scope = f"{question.strip()} | Clarification: {clarification.strip()}"
        return IntentAssessment(False, "Clarification provided by user.", scope, "", [])
    raw = await call_openrouter(INTENT_PROMPT.format(question=question.strip(), role=role.strip()), cfg.scorer_model, cfg)
    try:
        data = json.loads(_strip_fences(raw))
        options = [str(x).strip() for x in data.get("clarification_options", []) if str(x).strip()]
        need = bool(data.get("needs_clarification"))
        if need and len(options) < 3:
            return _fallback_assessment(question, role)
        normalized = _with_other_option(options)
        return IntentAssessment(
            need,
            str(data.get("reason", "")),
            str(data.get("intent_scope", question.strip())),
            str(data.get("clarification_question", "")).strip(),
            normalized if need else [],
        )
    except Exception:  # noqa: BLE001
        return _fallback_assessment(question, role)
