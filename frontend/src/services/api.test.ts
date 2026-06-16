import { describe, expect, it, vi } from "vitest";

import { consult, consultStream } from "./api";

describe("consult", () => {
  it("posts payload and returns parsed JSON", async () => {
    const payload = {
      writer: "openai/gpt-5.4",
      critic_a: "anthropic/claude-sonnet-4.6",
      critic_b: "google/gemini-3.1-pro",
      max_rounds: 3,
      consensus_score: 8,
      role: "Engineer",
      question: "Question"
    };
    const result = {
      session_id: "id", question: "q", role: "r", final_answer: "ok", final_score: 8, cost_hint: "x", full_discussion: [],
      status: "completed", needs_clarification: false, clarification_question: "", clarification_reason: "",
      clarification_options: [], model_costs: [], total_cost_usd: 0, total_tokens: 0
    };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => result });
    vi.stubGlobal("fetch", fetchMock);
    const value = await consult(payload);
    expect(value.session_id).toBe("id");
    expect(value.answer_mode).toBe("balanced");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("/api/consult");
  });

  it("throws when response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(
      consult({
        writer: "w", critic_a: "a", critic_b: "b", max_rounds: 1, consensus_score: 6, role: "r", question: "q"
      })
    ).rejects.toThrow("Consult request failed.");
  });

  it("parses string boolean flags safely", async () => {
    const result = {
      session_id: "id", question: "q", role: "r", final_answer: "ok", final_score: 8, cost_hint: "x", full_discussion: [],
      needs_clarification: "false", clarification_question: "", clarification_reason: "",
      clarification_options: [], model_costs: [], total_cost_usd: 0, total_tokens: 0
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => result }));
    const value = await consult({
      writer: "w", critic_a: "a", critic_b: "b", max_rounds: 1, consensus_score: 6, role: "r", question: "q"
    });
    expect(value.needs_clarification).toBe(false);
    expect(value.status).toBe("completed");
    expect(value.answer_mode).toBe("balanced");
  });

  it("normalizes explicit answer mode from the API", async () => {
    const result = {
      session_id: "id", question: "q", role: "r", final_answer: "ok", final_score: 8, cost_hint: "x", full_discussion: [],
      needs_clarification: false, clarification_question: "", clarification_reason: "", answer_mode: "fast",
      clarification_options: [], model_costs: [], total_cost_usd: 0, total_tokens: 0
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => result }));
    const value = await consult({
      writer: "w", critic_a: "a", critic_b: "b", max_rounds: 1, consensus_score: 6, role: "r", question: "q"
    });
    expect(value.answer_mode).toBe("fast");
  });

  it("streams activity and final result events", async () => {
    const enc = new TextEncoder();
    const lines = [
      "{\"type\":\"activity\",\"message\":\"step one\"}\n",
      "{\"type\":\"final\",\"data\":{\"session_id\":\"x\",\"question\":\"q\",\"role\":\"r\",\"final_answer\":\"y\",\"final_score\":7,\"cost_hint\":\"z\",\"full_discussion\":[],\"status\":\"completed\",\"needs_clarification\":false,\"clarification_question\":\"\",\"clarification_reason\":\"\",\"clarification_options\":[],\"model_costs\":[],\"total_cost_usd\":0,\"total_tokens\":0}}\n",
      "{\"type\":\"done\"}\n"
    ];
    const stream = new ReadableStream({
      start(controller) { lines.forEach((l) => controller.enqueue(enc.encode(l))); controller.close(); }
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, body: stream }));
    const activity: string[] = [];
    let finalId = "";
    await consultStream(
      { writer: "w", critic_a: "a", critic_b: "b", max_rounds: 1, consensus_score: 6, role: "r", question: "q" },
      { onActivity: (m) => activity.push(m), onFinal: (r) => { finalId = r.session_id; } }
    );
    expect(activity).toEqual(["step one"]);
    expect(finalId).toBe("x");
  });
});
