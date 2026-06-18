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
    expect(parseActivityMessages(["Round 1: Critic A challenged the answer."]).messages[0].speaker).toBe("critic1");
    expect(parseActivityMessages(["Round 1: consensus 8.4. Summary skipped in fast mode."]).currentStage).toBe("Scoring");
    expect(parseActivityMessages(["Synthesizing final answer."]).currentStage).toBe("Synthesizing");
  });

  it("groups repeated routine progress notes", () => {
    const state = parseActivityMessages([
      "Resuming with your clarification...",
      "Resuming Fast run with your clarification...",
      "Live web research skipped for this question.",
      "Your Writer and both Critics are in session — drafting, challenging, then converging.",
      "Writer is drafting the opening answer for your question.",
    ]);

    expect(state.messages[0]).toMatchObject({
      speaker: "system",
      type: "system",
      text: "Resuming with clarification · Web research skipped · Team assembled",
    });
    expect(state.messages[1]).toMatchObject({
      speaker: "writer",
      type: "message",
    });
  });

  it("keeps repair quality-check notes compact", () => {
    const state = parseActivityMessages([
      "Quality check: adding one final pass to better match your request.",
    ]);

    expect(state.messages[0]).toMatchObject({
      speaker: "system",
      type: "system",
      text: "Quality check: adding one final pass",
    });
  });
});
