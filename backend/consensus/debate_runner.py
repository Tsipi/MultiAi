"""Debate round runner helpers."""

import asyncio
from typing import Awaitable, Callable

from backend.config import AppConfig
from backend.consensus.activity_text import critic_feedback_sentence, writer_summary_sentence
from backend.consensus.llm_clients import call_openrouter
from backend.consensus.models import DebateRound, DebateSession
from backend.consensus.parsing import extract_revised_answer
from backend.consensus.prompts import CRITIQUE, WRITER_INITIAL, WRITER_REFINEMENT
from backend.consensus.scorer import score_consensus, score_consensus_multi
from backend.consensus.summarizer import summarize_round


def _two_sentence_summary(summary: str) -> str:
    """Trim summary text to roughly two sentences."""
    parts = [x.strip() for x in summary.replace("\n", " ").split(".") if x.strip()]
    return ". ".join(parts[:2]) + ("." if parts else "")


def _critic_name(index: int, total: int) -> str:
    """Return display name for a critic by 1-based position."""
    return f"Critic {index + 1}"


def _critics_label(count: int) -> str:
    """Return a readable label for the critic group."""
    if count == 1:
        return "Critic 1"
    labels = ", ".join(f"Critic {i + 1}" for i in range(count - 1))
    return f"{labels}, and Critic {count}"


def _role_for(roles: list[str], index: int, fallback: str) -> str:
    """Return a seat-specific role, falling back to the shared role."""
    return roles[index] if index < len(roles) and roles[index].strip() else fallback


async def run_rounds(
    session: DebateSession,
    question: str,
    domain: str,
    writers: list[str],
    critics: list[str],
    writer_roles: list[str],
    critic_roles: list[str],
    max_rounds: int,
    threshold: int,
    cfg: AppConfig,
    report: Callable[[str], Awaitable[None]],
    image_urls: list[str] | None = None,
    fast_mode: bool = False,
) -> tuple[str, str]:
    """Execute debate rounds and return latest answer and rolling summary."""
    primary_writer = writers[0]

    if len(writers) > 1:
        await report(f"Writer team ({len(writers)} models) is drafting opening answers in parallel.")
        drafts = await asyncio.gather(*[
            call_openrouter(
                WRITER_INITIAL.format(
                    question=question,
                    role_context=_role_for(writer_roles, i, domain),
                    intent_scope=session.intent_scope,
                ),
                writer,
                cfg,
                image_urls=image_urls or [],
                max_tokens=cfg.round_call_max_tokens,
            )
            for i, writer in enumerate(writers)
        ])
        answer = "\n\n".join(f"[Writer {i + 1}]\n{d}" for i, d in enumerate(drafts))
    else:
        await report("Writer is drafting the opening answer for your question.")
        initial_prompt = WRITER_INITIAL.format(
            question=question,
            role_context=_role_for(writer_roles, 0, domain),
            intent_scope=session.intent_scope,
        )
        answer = await call_openrouter(
            initial_prompt, primary_writer, cfg, image_urls=image_urls or [], max_tokens=cfg.round_call_max_tokens
        )

    rolling = ""
    for idx in range(1, max_rounds + 1):
        critiques = await asyncio.gather(*[
            call_openrouter(
                CRITIQUE.format(
                    rolling_context=rolling,
                    current_answer=answer,
                    question=question,
                    role_context=_role_for(critic_roles, i, domain),
                    intent_scope=session.intent_scope,
                ),
                critic,
                cfg,
                max_tokens=cfg.round_call_max_tokens,
            )
            for i, critic in enumerate(critics)
        ])

        await report(f"Round {idx}: {writer_summary_sentence(answer)}")
        for i, critique in enumerate(critiques):
            name = _critic_name(i, len(critics))
            await report(f"Round {idx}: {critic_feedback_sentence(critique, name)}")

        revised_answers = [extract_revised_answer(c) for c in critiques]
        merged = "\n\n".join(f"[{_critic_name(i, len(critics))}]\n{c}" for i, c in enumerate(critiques))

        if fast_mode:
            await report("Fast mode: using critic revisions without an extra writer rewrite.")
            if len(revised_answers) >= 2:
                score, reason = await score_consensus_multi(revised_answers, cfg)
            else:
                score, reason = await score_consensus(answer, revised_answers[0], cfg)
            refined_answer = "\n\n".join(
                f"[{_critic_name(i, len(critics))} revised answer]\n{revised}"
                for i, revised in enumerate(revised_answers)
            )
            session.rounds.append(DebateRound(idx, refined_answer, merged, score, reason, "Summary skipped in fast mode."))
            rolling += f"\n[Round {idx} summary]: Fast mode used critic revisions directly."
            await report(f"Round {idx}: consensus {score:.1f}. Summary skipped in fast mode.")
            return refined_answer, rolling

        refine = WRITER_REFINEMENT.format(
            rolling_context=rolling, question=question, critique=merged,
            role_context=_role_for(writer_roles, 0, domain), intent_scope=session.intent_scope,
        )
        await report(f"Writer rewrites based on {_critics_label(len(critics))}.")

        # Scorer and writer refinement are independent — run in parallel
        if len(revised_answers) >= 2:
            (score, reason), refined_answer = await asyncio.gather(
                score_consensus_multi(revised_answers, cfg),
                call_openrouter(refine, primary_writer, cfg, max_tokens=cfg.round_call_max_tokens),
            )
        else:
            (score, reason), refined_answer = await asyncio.gather(
                score_consensus(answer, revised_answers[0], cfg),
                call_openrouter(refine, primary_writer, cfg, max_tokens=cfg.round_call_max_tokens),
            )

        summary = await summarize_round(refined_answer, merged, cfg)
        session.rounds.append(DebateRound(idx, refined_answer, merged, score, reason, summary))
        rolling += f"\n[Round {idx} summary]: {summary}"
        await report(f"Round {idx}: consensus {score:.1f}. {_two_sentence_summary(summary)}")
        answer = refined_answer
        if score >= threshold:
            await report(f"Consensus threshold reached at round {idx}")
            break

    return answer, rolling
