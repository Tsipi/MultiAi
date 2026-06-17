import { describe, expect, it } from "vitest";
import type { ConsultResult } from "@/types";
import { generatedSessionTitlePrompt, sessionTitleFallback, shouldUseGeneratedSessionTitle } from "./useConsultRun";

const baseResult = {
  session_id: "session-1",
  question: "Full prompt with extra uploaded context that should not become the default title",
  role: "",
  base_question: "How should we reduce latency?",
  followup_instruction: "",
} as ConsultResult;

describe("sessionTitleFallback", () => {
  it("uses the follow-up instruction first", () => {
    expect(
      sessionTitleFallback(
        { ...baseResult, followup_instruction: "Focus only on Railway deployment" },
        "Original compose title",
      ),
    ).toBe("Focus only on Railway deployment");
  });

  it("prefers the base question over attachment-expanded prompt text", () => {
    expect(sessionTitleFallback(baseResult, "Original compose title")).toBe(
      "How should we reduce latency?",
    );
  });

  it("keeps pending titles short enough for the sidebar", () => {
    const result = {
      ...baseResult,
      base_question:
        "One two three four five six seven eight nine ten eleven twelve thirteen fourteen",
    };

    expect(sessionTitleFallback(result, "")).toBe(
      "One two three four five six seven eight nine ten eleven twelve...",
    );
  });
});

describe("generatedSessionTitlePrompt", () => {
  it("uses the follow-up instruction for deferred AI title generation", () => {
    expect(
      generatedSessionTitlePrompt(
        { ...baseResult, followup_instruction: "Compare the Railway frontend deploy behavior" },
        "Original compose title",
      ),
    ).toBe("Compare the Railway frontend deploy behavior");
  });

  it("uses the base question for normal runs", () => {
    expect(generatedSessionTitlePrompt(baseResult, "Original compose title")).toBe(
      "How should we reduce latency?",
    );
  });
});

describe("shouldUseGeneratedSessionTitle", () => {
  it("does not replace a meaningful follow-up title with a generic fallback", () => {
    expect(shouldUseGeneratedSessionTitle("consensus team answer", "and in Jerusalem")).toBe(false);
  });

  it("allows a useful generated title", () => {
    expect(shouldUseGeneratedSessionTitle("jerusalem budget stays", "and in Jerusalem")).toBe(true);
  });
});
