"""Main consensus debate loop."""

from __future__ import annotations

from datetime import datetime
from typing import Awaitable, Callable

from backend.config import AppConfig
from backend.consensus.attachments import AttachmentIn, build_attachment_context
from backend.consensus.debate_runner import run_rounds
from backend.consensus.llm_clients import LLMCallError, call_openrouter
from backend.consensus.models import DebateSession
from backend.consensus.intent import assess_intent
from backend.consensus.prompts import FINAL_SYNTHESIS, WRITER_REFINEMENT
from backend.consensus.usage_tracker import start_usage_collection, stop_usage_collection
from backend.consensus.validator import validate_relevance
class ConsensusEngine:
    """Orchestrates writer/critics toward consensus."""

    def __init__(self, cfg: AppConfig) -> None:
        self.cfg = cfg

    async def consult(
        self,
        question: str,
        domain: str,
        writers: list[str],
        critics: list[str],
        max_rounds: int,
        threshold: int,
        clarification: str = "",
        clarification_question_asked: str = "",
        attachments: list[AttachmentIn] | None = None,
        is_followup: bool = False,
        parent_session_id: str = "",
        thread_id: str = "",
        root_question: str = "",
        source_prompt: str = "",
        source_final_answer: str = "",
        followup_instruction: str = "",
        writer_names: list[str] | None = None,
        critic_names: list[str] | None = None,
        writer_roles: list[str] | None = None,
        critic_roles: list[str] | None = None,
        progress_hook: Callable[[str], Awaitable[None]] | None = None,
    ) -> DebateSession:
        """Run multi-round consensus process and save session."""
        async def report(message: str) -> None:
            if progress_hook:
                await progress_hook(message)

        normalized_attachments = [AttachmentIn.model_validate(a.model_dump() if hasattr(a, "model_dump") else a) for a in (attachments or [])]
        attachment_text, image_urls = build_attachment_context(normalized_attachments, self.cfg)
        image_mode = bool(image_urls)
        if image_mode:
            writers = [_fallback_for_image(w) for w in writers]
            critics = [_fallback_for_image(c) for c in critics]
            await report("Image input detected. Deepseek selections were switched to Gemini Flash.")
        question_with_context = question
        if attachment_text:
            question_with_context = f"{question}\n\nUser-provided files:\n{attachment_text}"
            await report("Attachment text extracted and added to context.")
        session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        session = DebateSession(
            session_id=session_id,
            question=question_with_context,
            domain=domain,
            model_writers=list(writers),
            model_critics=list(critics),
            writer_names=list(writer_names or []),
            critic_names=list(critic_names or []),
            writer_roles=list(writer_roles or []),
            critic_roles=list(critic_roles or []),
            thread_id=thread_id or session_id,
            parent_session_id=parent_session_id,
            is_followup=is_followup,
            root_question=root_question or (question if not is_followup else ""),
            source_prompt=source_prompt,
            source_final_answer=source_final_answer,
            followup_instruction=followup_instruction,
            base_question=question,
            attachment_files=[
                {"name": a.name, "mime_type": a.mime_type, "kind": a.kind, "data": a.data}
                for a in normalized_attachments
            ],
        )
        if clarification:
            session.clarification_question = clarification_question_asked
            session.clarification_response = clarification
        usage_token = start_usage_collection()
        assessment = await assess_intent(question_with_context, domain, clarification, self.cfg)
        session.intent_scope = assessment.intent_scope
        if assessment.is_ambiguous:
            session.needs_clarification = True
            session.clarification_reason = assessment.reason
            session.clarification_question = assessment.clarification_question
            session.clarification_options = assessment.clarification_options or []
            await report(f"Clarification required: {assessment.reason}")
            _apply_usage(session, usage_token)
            return session
        try:
            await report("Your Writer and both Critics are in session — drafting, challenging, then converging.")
            answer, rolling = await run_rounds(
                session,
                question_with_context,
                domain,
                writers,
                critics,
                writer_roles or [],
                critic_roles or [],
                max_rounds,
                threshold,
                self.cfg,
                report,
                image_urls=image_urls,
            )
            final_critique = session.rounds[-1].critique if session.rounds else ""
            # For follow-ups both {question} and {intent_scope} were the full 500-word context
            # blob, drowning the format instructions. Use just the follow-up instruction for both.
            if is_followup and followup_instruction:
                synthesis_question = followup_instruction
                if source_prompt:
                    synthesis_question += f"\n\n(Follow-up to: {source_prompt[:300]})"
                synthesis_scope = followup_instruction
            else:
                synthesis_question = question_with_context
                synthesis_scope = session.intent_scope
            primary_writer_role = _role_for(writer_roles or [], 0, domain)
            final_prompt = FINAL_SYNTHESIS.format(
                question=synthesis_question, current_answer=answer, critique=final_critique, role_context=primary_writer_role, intent_scope=synthesis_scope
            )
            await report("Synthesizing final answer")
            session.final_answer = await call_openrouter(final_prompt, writers[0], self.cfg)
            session.final_score = session.rounds[-1].consensus_score if session.rounds else 0.0
            is_ok, rel_score, rel_reason = await validate_relevance(question_with_context, session.final_answer, self.cfg)
            if not is_ok:
                await report("Relevance failed, running one repair round")
                repair = f"The answer drifted from user intent. Rewrite it to answer exactly: {question_with_context}"
                refined = WRITER_REFINEMENT.format(
                    rolling_context=rolling, question=question_with_context, critique=repair, role_context=primary_writer_role, intent_scope=session.intent_scope
                )
                session.final_answer = await call_openrouter(refined, writers[0], self.cfg)
                is_ok, _, _ = await validate_relevance(question_with_context, session.final_answer, self.cfg)
                if not is_ok:
                    retry = await assess_intent(question_with_context, domain, clarification, self.cfg)
                    options = retry.clarification_options or []
                    if retry.is_ambiguous and retry.clarification_question and options:
                        session.needs_clarification = True
                        session.clarification_reason = rel_reason
                        session.clarification_question = retry.clarification_question
                        session.clarification_options = options[:5]
                        await report("Clarification required before continuing")
                    else:
                        session.final_answer += (
                            "\n\nNote: Relevance remained imperfect after repair. "
                            "Please add more specific constraints for a tighter result."
                        )
            await report("Completed successfully")
        except LLMCallError as exc:
            await report(f"Stopped due to LLM error: {exc}")
            session.final_answer = f"Stopped early due to LLM error: {exc}"
        _apply_usage(session, usage_token)
        return session


def _fallback_for_image(model: str) -> str:
    """Switch image-unsupported Deepseek to Gemini Flash."""
    return "google/gemini-2.5-flash" if model == "deepseek/deepseek-chat-v3.2" else model


def _role_for(roles: list[str], index: int, fallback: str) -> str:
    """Return a seat-specific role, falling back to the shared role."""
    return roles[index] if index < len(roles) and roles[index].strip() else fallback


def _apply_usage(session: DebateSession, token: object) -> None:
    """Stop collection and write cost/token totals onto session."""
    usage = stop_usage_collection(token)
    session.model_costs = [{"model": k, **v} for k, v in usage.items()]
    session.total_cost_usd = round(sum(v["total_cost_usd"] for v in usage.values()), 6)
    session.total_tokens = int(sum(v["total_tokens"] for v in usage.values()))
