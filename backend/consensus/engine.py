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
from backend.storage.session_store import save_session
class ConsensusEngine:
    """Orchestrates writer/critics toward consensus."""

    def __init__(self, cfg: AppConfig) -> None:
        self.cfg = cfg

    async def consult(
        self,
        question: str,
        domain: str,
        writer: str,
        critic_a: str,
        critic_b: str,
        max_rounds: int,
        threshold: int,
        clarification: str = "",
        attachments: list[AttachmentIn] | None = None,
        is_followup: bool = False,
        parent_session_id: str = "",
        thread_id: str = "",
        source_prompt: str = "",
        source_final_answer: str = "",
        followup_instruction: str = "",
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
            writer = _fallback_for_image(writer)
            critic_a = _fallback_for_image(critic_a)
            critic_b = _fallback_for_image(critic_b)
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
            model_writer=writer,
            model_critic_a=critic_a,
            model_critic_b=critic_b,
            thread_id=thread_id or session_id,
            parent_session_id=parent_session_id,
            is_followup=is_followup,
            source_prompt=source_prompt,
            source_final_answer=source_final_answer,
            followup_instruction=followup_instruction,
        )
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
            save_session(session, self.cfg.sessions_dir)
            return session
        try:
            answer, rolling = await run_rounds(
                session,
                question_with_context,
                domain,
                writer,
                critic_a,
                critic_b,
                max_rounds,
                threshold,
                self.cfg,
                report,
                image_urls=image_urls,
            )
            final_critique = session.rounds[-1].critique if session.rounds else ""
            final_prompt = FINAL_SYNTHESIS.format(
                question=question_with_context, current_answer=answer, critique=final_critique, role_context=domain, intent_scope=session.intent_scope
            )
            await report("Synthesizing final answer")
            session.final_answer = await call_openrouter(final_prompt, writer, self.cfg)
            session.final_score = session.rounds[-1].consensus_score if session.rounds else 0.0
            is_ok, rel_score, rel_reason = await validate_relevance(question_with_context, session.final_answer, self.cfg)
            if not is_ok:
                await report("Relevance failed, running one repair round")
                repair = f"The answer drifted from user intent. Rewrite it to answer exactly: {question_with_context}"
                refined = WRITER_REFINEMENT.format(
                    rolling_context=rolling, question=question_with_context, critique=repair, role_context=domain, intent_scope=session.intent_scope
                )
                session.final_answer = await call_openrouter(refined, writer, self.cfg)
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
        save_session(session, self.cfg.sessions_dir)
        return session


def _fallback_for_image(model: str) -> str:
    """Switch image-unsupported Deepseek to Gemini Flash."""
    return "google/gemini-2.5-flash" if model == "deepseek/deepseek-chat-v3.2" else model


def _apply_usage(session: DebateSession, token: object) -> None:
    """Stop collection and write cost/token totals onto session."""
    usage = stop_usage_collection(token)
    session.model_costs = [{"model": k, **v} for k, v in usage.items()]
    session.total_cost_usd = round(sum(v["total_cost_usd"] for v in usage.values()), 6)
    session.total_tokens = int(sum(v["total_tokens"] for v in usage.values()))
