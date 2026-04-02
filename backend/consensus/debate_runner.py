"""Debate round runner helpers."""

import asyncio
from typing import Awaitable, Callable

from backend.config import AppConfig
from backend.consensus.activity_text import critic_feedback_sentence, writer_summary_sentence
from backend.consensus.llm_clients import call_openrouter
from backend.consensus.models import DebateRound, DebateSession
from backend.consensus.parsing import extract_revised_answer
from backend.consensus.prompts import CRITIQUE, WRITER_INITIAL, WRITER_REFINEMENT
from backend.consensus.scorer import score_consensus
from backend.consensus.summarizer import summarize_round
from backend.consensus.validator import validate_relevance

WRITER_NAME = "Writer"
CRITIC_A_NAME = "Critic A"
CRITIC_B_NAME = "Critic B"


def _two_sentence_summary(summary: str) -> str:
    """Trim summary text to roughly two sentences."""
    parts = [x.strip() for x in summary.replace("\n", " ").split(".") if x.strip()]
    return ". ".join(parts[:2]) + ("." if parts else "")


async def run_rounds(
    session: DebateSession,
    question: str,
    domain: str,
    writer: str,
    critic_a: str,
    critic_b: str,
    max_rounds: int,
    threshold: int,
    cfg: AppConfig,
    report: Callable[[str], Awaitable[None]],
    image_urls: list[str] | None = None,
) -> tuple[str, str]:
    """Execute debate rounds and return latest answer and rolling summary."""
    await report(f"{WRITER_NAME} is drafting the first answer.")
    answer = await call_openrouter(
        WRITER_INITIAL.format(question=question, role_context=domain, intent_scope=session.intent_scope),
        writer,
        cfg,
        image_urls=image_urls or [],
    )
    rolling = ""
    for idx in range(1, max_rounds + 1):
        prompt = CRITIQUE.format(
            rolling_context=rolling, current_answer=answer, question=question, role_context=domain, intent_scope=session.intent_scope
        )
        critique_a, critique_b = await asyncio.gather(
            call_openrouter(prompt, critic_a, cfg),
            call_openrouter(prompt, critic_b, cfg),
        )
        writer_update = writer_summary_sentence(answer)
        critic_a_update = critic_feedback_sentence(critique_a, CRITIC_A_NAME)
        critic_b_update = critic_feedback_sentence(critique_b, CRITIC_B_NAME)
        await report(f"Round {idx}: {writer_update}")
        await report(f"Round {idx}: {critic_a_update}")
        await report(f"Round {idx}: {critic_b_update}")
        revised_a, revised_b = extract_revised_answer(critique_a), extract_revised_answer(critique_b)
        merged = f"[Critic A]\n{critique_a}\n\n[Critic B]\n{critique_b}"
        score, reason = await score_consensus(revised_a, revised_b, cfg)
        refine = WRITER_REFINEMENT.format(
            rolling_context=rolling, question=question, critique=merged, role_context=domain, intent_scope=session.intent_scope
        )
        await report(f"{WRITER_NAME} rewrites based on {CRITIC_A_NAME} and {CRITIC_B_NAME}.")
        refined_answer = await call_openrouter(refine, writer, cfg)
        (relevance_ok, relevance_score, relevance_reason), summary = await asyncio.gather(
            validate_relevance(question, refined_answer, cfg),
            summarize_round(refined_answer, merged, cfg),
        )
        session.rounds.append(DebateRound(idx, refined_answer, merged, score, reason, summary, relevance_score, relevance_reason))
        rolling += f"\n[Round {idx} summary]: {summary}"
        await report(f"Round {idx}: consensus {score:.1f}, relevance {relevance_score:.1f}. {_two_sentence_summary(summary)}")
        answer = refined_answer
        if score >= threshold and relevance_ok:
            await report(f"Consensus threshold reached at round {idx}")
            break
    return answer, rolling
