import { describe, expect, it } from "vitest";
import type { ConsultResult } from "@/types";
import { sharedPromptView } from "./sharedPromptView";

const PARENT_ANSWER =
  "**The Bottom Line**\nNVIDIA is projected to reach $5.1 trillion.\n\n" +
  "| Rank | Company | Market Cap |\n|---|---|---|\n| 1 | NVIDIA | $5.1 trillion |\n" +
  "Note: Relevance remained imperfect after repair.";

const ROOT_QUESTION = "compare the 10 most cap market USA stocks 2026 vs 2016";
const INSTRUCTION = "prove why an ETF beats a single stock, pros and cons";

const baseResult: ConsultResult = {
  session_id: "20260806_101500",
  question: "",
  role: "Investment analyst",
  base_question: "",
  attachment_files: [],
  web_search_mode: "off",
  answer_mode: "balanced",
  web_search_performed: false,
  web_search_query: "",
  web_search_retrieved_at: "",
  web_search_sources: [],
  web_search_summary: "",
  web_search_warning: "",
  model_writers: [],
  model_critics: [],
  writer_names: [],
  critic_names: [],
  writer_roles: [],
  critic_roles: [],
  team_template_id: "",
  final_answer: "The Bottom Line ...",
  final_score: 8,
  full_discussion: [],
  status: "completed",
  cost_hint: "",
  needs_clarification: false,
  clarification_question: "",
  clarification_reason: "",
  clarification_options: [],
  clarification_response: "",
  is_followup: false,
  thread_id: "thread",
  parent_session_id: "",
  root_question: "",
  source_prompt: "",
  source_final_answer: "",
  source_final_score: 0,
  followup_instruction: "",
  model_costs: [],
  total_cost_usd: 0,
  total_tokens: 0,
  total_duration_seconds: 0,
  phase_timings: [],
};

const followupPacket = [
  "Original prompt:", ROOT_QUESTION, "",
  "Previous final answer:", PARENT_ANSWER, "",
  "Follow-up instruction:", INSTRUCTION,
].join("\n");

describe("sharedPromptView", () => {
  it("shows only the follow-up instruction, never the packet or parent answer", () => {
    const view = sharedPromptView({
      ...baseResult,
      question: followupPacket,
      base_question: followupPacket,
      is_followup: true,
      root_question: ROOT_QUESTION,
      source_prompt: ROOT_QUESTION,
      source_final_answer: PARENT_ANSWER,
      followup_instruction: INSTRUCTION,
    });

    expect(view.isFollowup).toBe(true);
    expect(view.instruction).toBe("Prove why an ETF beats a single stock, pros and cons");
    expect(view.rootQuestion).toBe(ROOT_QUESTION);

    const rendered = `${view.rootQuestion}\n${view.instruction}`;
    expect(rendered).not.toContain("NVIDIA");
    expect(rendered).not.toContain("Previous final answer:");
    expect(rendered).not.toContain("Relevance remained imperfect");
    expect(rendered).not.toContain("|");
  });

  it("falls back to the root question when a legacy follow-up has no instruction", () => {
    const view = sharedPromptView({
      ...baseResult,
      question: followupPacket,
      is_followup: true,
      root_question: ROOT_QUESTION,
      source_final_answer: PARENT_ANSWER,
      followup_instruction: "",
    });

    expect(view.instruction).toBe("Compare the 10 most cap market USA stocks 2026 vs 2016");
    expect(view.rootQuestion).toBe("");
    expect(view.instruction).not.toContain("NVIDIA");
  });

  it("capitalises the first letter without touching the rest of the wording", () => {
    const view = sharedPromptView({
      ...baseResult,
      question: "why is my ETF underperforming the S&P 500 vs QQQ?",
    });

    expect(view.instruction).toBe("Why is my ETF underperforming the S&P 500 vs QQQ?");
  });

  it("strips inlined attachment text from a plain run", () => {
    const view = sharedPromptView({
      ...baseResult,
      question: "Summarise this contract\n\nUser-provided files:\nSECRET clause 14 text",
      base_question: "",
      attachment_files: [{ name: "contract.pdf", mime_type: "application/pdf", kind: "file", data: "" }],
    });

    expect(view.isFollowup).toBe(false);
    expect(view.instruction).toBe("Summarise this contract");
    expect(view.instruction).not.toContain("SECRET");
    expect(view.attachments).toHaveLength(1);
  });

  it("leaves a plain run without attachments unchanged", () => {
    const view = sharedPromptView({ ...baseResult, question: "How should I decide?" });

    expect(view.instruction).toBe("How should I decide?");
    expect(view.rootQuestion).toBe("");
    expect(view.attachments).toEqual([]);
  });
});
