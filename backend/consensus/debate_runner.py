"""Debate round runner helpers."""

import asyncio
from typing import Awaitable, Callable

from backend.config import AppConfig
from backend.consensus.activity_text import critic_feedback_sentence, writer_summary_sentence
from backend.consensus.llm_clients import call_openrouter
from backend.consensus.models import DebateRound, DebateSession
from backend.consensus.parsing import extract_revised_answer
from backend.consensus.prompts import CRITIQUE, WRITER_INITIAL, WRITER_REFINEMENT
from backend.consensus.scorer import score_consensus_multi
from backend.consensus.summarizer import summarize_round
from backend.consensus.validator import validate_relevance


def _two_sentence_summary(summary: str) -> str:
    """Trim summary text to roughly two sentences."""
    parts = [x.strip() for x in summary.replace("\n", " ").split(".") if x.strip()]
    return ". ".join(parts[:2]) + ("." if parts else "")


def _critic_name(index: int, total: int) -> str:
    """Return display name for a critic by index."""
    if total == 2:
        return ("Critic A", "Critic B")[index]
    return f"Critic {index + 1}"


def _critics_label(count: int) -> str:
    """Return a readable label for the critic group."""
    if count == 1:
        return "the critic"
    if count == 2:
        return "Critic A and Critic B"
    return f"all {count} critics"


async def run_rounds(
    session: DebateSession,
    question: str,
    domain: str,
    writers: list[str],
    critics: list[str],
    max_rounds: int,
    threshold: int,
    cfg: AppConfig,
    report: Callable[[str], Awaitable[None]],
    image_urls: list[str] | None = None,
) -> tuple[str, str]:
    """Execute debate rounds and return latest answer and rolling summary."""
    primary_writer = writers[0]
    initial_prompt = WRITER_INITIAL.format(
        question=question, role_context=domain, intent_scope=session.intent_scope
    )

    if len(writers) > 1:
        await report(f"Writer team ({len(writers)} models) is drafting opening answers in parallel.")
        drafts = await asyncio.gather(*[
            call_openrouter(initial_prompt, w, cfg, image_urls=image_urls or [])
            for w in writers
        ])
        answer = "\n\n".join(f"[Writer {i + 1}]\n{d}" for i, d in enumerate(drafts))
    else:
        await report("Writer is drafting the opening answer for your question.")
        answer = await call_openrouter(initial_prompt, primary_writer, cfg, image_urls=image_urls or [])

    rolling = ""
    for idx in range(1, max_rounds + 1):
        prompt = CRITIQUE.format(
            rolling_context=rolling, current_answer=answer, question=question,
            role_context=domain, intent_scope=session.intent_scope,
        )
        critiques = await asyncio.gather(*[call_openrouter(prompt, c, cfg) for c in critics])

        await report(f"Round {idx}: {writer_summary_sentence(answer)}")
        for i, critique in enumerate(critiques):
            name = _critic_name(i, len(critics))
            await report(f"Round {idx}: {critic_feedback_sentence(critique, name)}")

        revised_answers = [extract_revised_answer(c) for c in critiques]
        merged = "\n\n".join(f"[{_critic_name(i, len(critics))}]\n{c}" for i, c in enumerate(critiques))
        score, reason = await score_consensus_multi(revised_answers, cfg)

        refine = WRITER_REFINEMENT.format(
            rolling_context=rolling, question=question, critique=merged,
            role_context=domain, intent_scope=session.intent_scope,
        )
        await report(f"Writer rewrites based on {_critics_label(len(critics))}.")
        refined_answer = await call_openrouter(refine, primary_writer, cfg)

        (relevance_ok, relevance_score, relevance_reason), summary = await asyncio.gather(
            validate_relevance(question, refined_answer, cfg),
            summarize_round(refined_answer, merged, cfg),
        )
        session.rounds.append(DebateRound(
            idx, refined_answer, merged, score, reason, summary, relevance_score, relevance_reason
        ))
        rolling += f"\n[Round {idx} summary]: {summary}"
        await report(
            f"Round {idx}: consensus {score:.1f}, relevance {relevance_score:.1f}. {_two_sentence_summary(summary)}"
        )
        answer = refined_answer
        if score >= threshold and relevance_ok:
            await report(f"Consensus threshold reached at round {idx}")
            break

    return answer, rolling
