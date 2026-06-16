import { describe, expect, it } from "vitest";
import { recommendedRoundsForAnswerMode } from "./answerMode";

describe("recommendedRoundsForAnswerMode", () => {
  it("maps answer modes to their starting debate pass counts", () => {
    expect(recommendedRoundsForAnswerMode("fast")).toBe(1);
    expect(recommendedRoundsForAnswerMode("balanced")).toBe(2);
    expect(recommendedRoundsForAnswerMode("deep")).toBe(3);
  });
});
