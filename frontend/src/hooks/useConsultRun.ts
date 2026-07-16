import { useRef, useState } from "react";
import type { ConsultPayload, ConsultResult } from "@/types";
import type { CastSelection } from "@/lib/consultHelpers";
import { consultStream, generateTitle } from "@/services/api";
import { toPreview } from "@/lib/consultHelpers";
import type { SessionPreview } from "@/types";

// ─── Public types ─────────────────────────────────────────────────────────────

export type PendingRun = { payload: ConsultPayload; cast: CastSelection; title: string };

export interface ConsultRunCallbacks {
  /** Called when the backend requests clarification before running. */
  onClarificationNeeded: (
    data: { question: string; reason: string; options: string[] },
    pending: PendingRun
  ) => void;
  /** Called when a run completes successfully with a final result. */
  onRunComplete: (result: ConsultResult, cast: CastSelection, title: string) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Owns loading / activity / isResuming state and the consultStream execution.
 * All persistent state updates (history, resultsById, etc.) are delegated to
 * the caller via callbacks so App.tsx stays in control of its own state shape.
 */
export function useConsultRun(callbacks: ConsultRunCallbacks) {
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState<string[]>([]);
  const [isResuming, setIsResuming] = useState(false);

  // Keep callbacks stable so callers don't have to memoize them
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  async function execute(payload: ConsultPayload, cast: CastSelection, title: string) {
    await consultStream(payload, {
      onActivity: (msg) => setActivity((prev) => [...prev, msg]),
      onFinal: (next) => {
        const canClarify = Boolean(
          next.needs_clarification &&
          next.clarification_question &&
          next.clarification_options.length
        );
        if (canClarify) {
          cbRef.current.onClarificationNeeded(
            { question: next.clarification_question, reason: next.clarification_reason, options: next.clarification_options },
            { payload, cast, title }
          );
          setActivity((prev) => [...prev, "Waiting for user clarification"]);
          return;
        }
        cbRef.current.onRunComplete(next, cast, title);
      },
    });
  }

  return { loading, setLoading, activity, setActivity, isResuming, setIsResuming, execute };
}

export function sessionTitleFallback(next: ConsultResult, title: string): string {
  const rawTitle = (
    next.followup_instruction ||
    next.base_question ||
    title ||
    next.question ||
    "Untitled run"
  ).trim().replace(/\s+/g, " ");
  const words = rawTitle.split(" ").filter(Boolean);
  if (words.length <= 12) return rawTitle || "Untitled run";
  return `${words.slice(0, 12).join(" ")}...`;
}

export function generatedSessionTitlePrompt(next: ConsultResult, title: string): string {
  return next.followup_instruction || next.base_question || next.question || title;
}

const GENERATED_TITLE_MIN_QUESTION_LENGTH = 37;

/** Short questions already fit the sidebar as-is — skip the LLM title call for them. */
export function shouldRequestGeneratedTitle(questionText: string): boolean {
  return questionText.trim().length > GENERATED_TITLE_MIN_QUESTION_LENGTH;
}

export function shouldUseGeneratedSessionTitle(generatedTitle: string, fallbackTitle: string): boolean {
  const normalized = generatedTitle.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === "consensus team answer" || normalized === "saved team answer") return false;
  return normalized !== fallbackTitle.trim().toLowerCase();
}

// ─── Shared helper (used by both executeConsult callers in App.tsx) ───────────

/**
 * Persists a completed run into session history and fires an async title generation.
 * Pure data transformation — no React state, safe to call from anywhere.
 */
export function applyRunResult(
  next: ConsultResult,
  cast: CastSelection,
  title: string,
  navigate: (path: string) => void,
  setters: {
    setResult: (r: ConsultResult) => void;
    setResultsById: (fn: (p: Record<string, ConsultResult>) => Record<string, ConsultResult>) => void;
    setCastBySession: (fn: (p: Record<string, CastSelection>) => Record<string, CastSelection>) => void;
    setSelectedId: (id: string) => void;
    setHistory: (fn: (p: SessionPreview[]) => SessionPreview[]) => void;
    setSessionTitles: (fn: (p: Record<string, string>) => Record<string, string>) => void;
  }
) {
  const { setResult, setResultsById, setCastBySession, setSelectedId, setHistory, setSessionTitles } = setters;
  const fallbackTitle = sessionTitleFallback(next, title);
  setResult(next);
  setResultsById((prev) => ({ ...prev, [next.session_id]: next }));
  setCastBySession((prev) => ({ ...prev, [next.session_id]: cast }));
  setSelectedId(next.session_id);
  navigate(`/app/run/${next.session_id}`);
  setHistory((prev) => [
    toPreview({
      session_id: next.session_id,
      question: next.question || title,
      timestamp: new Date().toISOString(),
      thread_id: next.thread_id,
      parent_session_id: next.parent_session_id,
      is_followup: next.is_followup,
      run_title: fallbackTitle,
      team_template_id: next.team_template_id,
    }),
    ...prev.filter((p) => p.id !== next.session_id),
  ]);
  setSessionTitles((prev) => ({ ...prev, [next.session_id]: fallbackTitle }));
  const titlePrompt = generatedSessionTitlePrompt(next, title);
  if (shouldRequestGeneratedTitle(titlePrompt)) {
    generateTitle(titlePrompt, next.role || "")
      .then((t) => {
        if (shouldUseGeneratedSessionTitle(t, fallbackTitle)) {
          setSessionTitles((prev) => ({ ...prev, [next.session_id]: t }));
        }
      })
      .catch(() => {});
  }
}
