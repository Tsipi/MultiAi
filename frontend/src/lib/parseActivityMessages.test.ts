import { describe, expect, it } from "vitest";
import { parseActivityMessages } from "./parseActivityMessages";

describe("parseActivityMessages stage detection", () => {
  it("shows preparation before model output begins", () => {
    const state = parseActivityMessages([
      "Preparing Fast run. Your team is assembling the debate...",
    ]);

    expect(state.currentStage).toBe("Preparing");
  });

  it("shows research while live web research is active", () => {
    const state = parseActivityMessages([
      "Preparing Balanced run. Your team is assembling the debate...",
      "Searching the live web for current sources.",
    ]);

    expect(state.currentStage).toBe("Researching");
  });

  it("shows drafting, critiquing, scoring, and synthesis stages", () => {
    expect(parseActivityMessages(["Writer is drafting the opening answer for your question."]).currentStage).toBe("Drafting");
    expect(parseActivityMessages(["Round 1: Critic 1 challenged the answer."]).currentStage).toBe("Critiquing");
    expect(parseActivityMessages(["Round 1: consensus 8.4. Summary skipped in fast mode."]).currentStage).toBe("Scoring");
    expect(parseActivityMessages(["Synthesizing final answer."]).currentStage).toBe("Synthesizing");
  });
});
