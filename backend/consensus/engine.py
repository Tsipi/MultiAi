"""Main consensus debate loop."""

from __future__ import annotations

import logging
from datetime import datetime
from time import perf_counter
from typing import Awaitable, Callable

from backend.config import AppConfig
from backend.consensus.attachments import AttachmentIn, build_attachment_context
from backend.consensus.debate_runner import run_rounds
from backend.consensus.llm_clients import LLMCallError, call_openrouter
from backend.consensus.models import DebateSession
from backend.consensus.intent import assess_intent
from backend.consensus.prompts import FINAL_SYNTHESIS, WRITER_REFINEMENT
from backend.consensus.usage_tracker import start_usage_collection, stop_usage_collection
from backend.consensus.validator import _token_overlap, validate_relevance
from backend.consensus.web_research import build_research_context, research_web, should_search

log = logging.getLogger(__name__)


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
        source_final_score: float = 0.0,
        followup_instruction: str = "",
        writer_names: list[str] | None = None,
        critic_names: list[str] | None = None,
        writer_roles: list[str] | None = None,
        critic_roles: list[str] | None = None,
        team_template_id: str = "",
        web_search_mode: str = "auto",
        answer_mode: str = "balanced",
        progress_hook: Callable[[str], Awaitable[None]] | None = None,
    ) -> DebateSession:
        """Run multi-round consensus process and save session."""
        run_started = perf_counter()
        phase_timings: list[dict] = []

        def record_phase(name: str, started: float, **metadata: object) -> None:
            row = {
                "phase": name,
                "duration_seconds": round(max(perf_counter() - started, 0.0), 3),
            }
            row.update(metadata)
            phase_timings.append(row)

        def finalize_timings(target: DebateSession) -> None:
            target.total_duration_seconds = round(max(perf_counter() - run_started, 0.0), 3)
            log.debug(
                "session timing session_id=%s total=%.3fs phases=%s",
                target.session_id,
                target.total_duration_seconds,
                target.phase_timings,
            )

        async def report(message: str) -> None:
            if progress_hook:
                await progress_hook(message)

        phase_started = perf_counter()
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
        record_phase(
            "input_preparation",
            phase_started,
            attachment_count=len(normalized_attachments),
            image_mode=image_mode,
        )
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
            team_template_id=team_template_id,
            thread_id=thread_id or session_id,
            parent_session_id=parent_session_id,
            is_followup=is_followup,
            root_question=root_question or (question if not is_followup else ""),
            source_prompt=source_prompt,
            source_final_answer=source_final_answer,
            source_final_score=source_final_score,
            followup_instruction=followup_instruction,
            base_question=question,
            attachment_files=[
                {"name": a.name, "mime_type": a.mime_type, "kind": a.kind, "data": a.data}
                for a in normalized_attachments
            ],
            web_search_mode=web_search_mode,
            answer_mode=answer_mode,
            phase_timings=phase_timings,
        )
        if clarification:
            session.clarification_question = clarification_question_asked
            session.clarification_response = clarification
        usage_token = start_usage_collection()
        phase_started = perf_counter()
        assessment = await assess_intent(question_with_context, domain, clarification, self.cfg)
        record_phase(
            "intent_assessment",
            phase_started,
            status="needs_clarification" if assessment.is_ambiguous else "clear",
        )
        session.intent_scope = assessment.intent_scope
        if assessment.is_ambiguous:
            session.needs_clarification = True
            session.clarification_reason = assessment.reason
            session.clarification_question = assessment.clarification_question
            session.clarification_options = assessment.clarification_options or []
            await report(f"Clarification required: {assessment.reason}")
            _apply_usage(session, usage_token)
            finalize_timings(session)
            return session
        search_subject = followup_instruction or question
        phase_started = perf_counter()
        if should_search(search_subject, web_search_mode):
            await report("Searching the live web for current sources.")
            try:
                search_timeout = (
                    self.cfg.fast_web_search_timeout_seconds
                    if answer_mode == "fast"
                    else self.cfg.web_search_timeout_seconds
                )
                research = await research_web(search_subject, self.cfg, timeout_seconds=search_timeout)
                session.web_search_performed = research.performed
                session.web_search_query = research.query
                session.web_search_retrieved_at = research.retrieved_at
                session.web_search_sources = research.sources
                session.web_search_summary = research.summary
                session.web_search_warning = research.warning
                question_with_context += build_research_context(research)
                await report(f"Live web research found {len(research.sources)} source(s).")
                record_phase(
                    "web_research",
                    phase_started,
                    status="performed",
                    source_count=len(research.sources),
                )
            except LLMCallError as exc:
                session.web_search_warning = str(exc)
                await report("Live web research failed; continuing with a freshness warning.")
                record_phase("web_research", phase_started, status="failed")
        else:
            await report("Live web research skipped for this question.")
            record_phase("web_research", phase_started, status="skipped")
        try:
            await report("Your Writer and both Critics are in session — drafting, challenging, then converging.")
            phase_started = perf_counter()
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
                fast_mode=answer_mode == "fast",
            )
            record_phase(
                "debate_rounds",
                phase_started,
                round_count=len(session.rounds),
                answer_mode=answer_mode,
            )
            final_critique = session.rounds[-1].critique if session.rounds else ""
            if is_followup and followup_instruction:
                synthesis_question = _build_followup_synthesis_context(
                    followup_instruction=followup_instruction,
                    source_prompt=source_prompt,
                    source_final_answer=source_final_answer,
                    root_question=root_question,
                    clarification=clarification,
                )
                synthesis_scope = followup_instruction
                if clarification:
                    synthesis_scope += f"\n\nClarification: {clarification[:500]}"
            else:
                synthesis_question = question_with_context
                synthesis_scope = session.intent_scope
            primary_writer_role = _role_for(writer_roles or [], 0, domain)
            final_prompt = FINAL_SYNTHESIS.format(
                question=synthesis_question, current_answer=answer, critique=final_critique, role_context=primary_writer_role, intent_scope=synthesis_scope
            )
            await report("Synthesizing final answer")
            phase_started = perf_counter()
            session.final_answer = await call_openrouter(final_prompt, writers[0], self.cfg)
            record_phase("final_synthesis", phase_started, model=writers[0])
            session.final_score = session.rounds[-1].consensus_score if session.rounds else 0.0
            phase_started = perf_counter()
            if answer_mode == "fast" and _token_overlap(question_with_context, session.final_answer) >= 0.05:
                await report("Fast mode: skipping final relevance validation.")
                is_ok, rel_score, rel_reason = True, 0.0, ""
                record_phase("relevance_validation", phase_started, status="skipped_fast_mode")
            else:
                is_ok, rel_score, rel_reason = await validate_relevance(question_with_context, session.final_answer, self.cfg)
                record_phase(
                    "relevance_validation",
                    phase_started,
                    status="passed" if is_ok else "failed",
                    relevance_score=rel_score,
                )
            if not is_ok:
                await report("Quality check: adding one final pass to better match your request.")
                phase_started = perf_counter()
                repair = f"The answer drifted from user intent. Rewrite it to answer exactly: {question_with_context}"
                refined = WRITER_REFINEMENT.format(
                    rolling_context=rolling, question=question_with_context, critique=repair, role_context=primary_writer_role, intent_scope=session.intent_scope
                )
                session.final_answer = await call_openrouter(refined, writers[0], self.cfg)
                is_ok, _, _ = await validate_relevance(question_with_context, session.final_answer, self.cfg)
                record_phase("repair", phase_started, status="passed" if is_ok else "failed")
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
            user_message = _user_facing_llm_error(exc)
            log.warning("session stopped due to LLM error: %s", exc)
            await report(user_message)
            session.final_answer = user_message
        _apply_usage(session, usage_token)
        finalize_timings(session)
        return session


def _fallback_for_image(model: str) -> str:
    """Switch image-unsupported Deepseek to Gemini Flash."""
    return "google/gemini-2.5-flash" if model == "deepseek/deepseek-chat-v3.2" else model


def _role_for(roles: list[str], index: int, fallback: str) -> str:
    """Return a seat-specific role, falling back to the shared role."""
    return roles[index] if index < len(roles) and roles[index].strip() else fallback


def _build_followup_synthesis_context(
    *,
    followup_instruction: str,
    source_prompt: str,
    source_final_answer: str,
    root_question: str,
    clarification: str,
) -> str:
    """Build focused follow-up context for final synthesis without losing the parent answer."""
    parts = [f"Follow-up instruction:\n{followup_instruction}"]
    if clarification:
        parts.append(f"User clarification:\n{clarification[:500]}")
    if source_final_answer:
        parts.append(f"Previous final answer to revise or extend:\n{source_final_answer[:2000]}")
    if source_prompt:
        parts.append(f"Immediate parent prompt:\n{source_prompt[:600]}")
    if root_question and root_question != source_prompt:
        parts.append(f"Original root question:\n{root_question[:600]}")
    return "\n\n".join(parts)


def _user_facing_llm_error(exc: LLMCallError) -> str:
    """Translate provider errors into concise user-facing guidance."""
    raw = str(exc)
    lowered = raw.lower()
    if "http 402" in lowered and "openrouter" in lowered:
        if any(token in lowered for token in ("more credits", "max_tokens", "total limit", "token limit")):
            return (
                "OpenRouter credit/token limit reached. Add credits or increase the key's "
                "total token limit in OpenRouter, then retry this run."
            )
        return "OpenRouter billing limit reached. Check your OpenRouter credits and key limits, then retry this run."
    if "openrouter_api_key is missing" in lowered:
        return "OpenRouter API key is missing. Add your OpenRouter API key, then retry this run."
    return "The AI provider stopped this run before completion. Please retry, or choose a different model if it happens again."


def _apply_usage(session: DebateSession, token: object) -> None:
    """Stop collection and write cost/token totals onto session."""
    usage = stop_usage_collection(token)
    session.model_costs = [{"model": k, **v} for k, v in usage.items()]
    session.total_cost_usd = round(sum(v["total_cost_usd"] for v in usage.values()), 6)
    session.total_tokens = int(sum(v["total_tokens"] for v in usage.values()))
