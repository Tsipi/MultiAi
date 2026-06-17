import { describe, expect, it } from "vitest";
import type { TeamMember } from "@/data/experts";
import type { ConsultPayload, ConsultResult } from "@/types";
import { buildFollowupContext, castToTeam, mergeTeamIntoPayload } from "./consultHelpers";

const form: ConsultPayload = {
  question: "How should I decide?",
  role: "Shared Expert",
  writer: "",
  critic_a: "",
  critic_b: "",
  max_rounds: 2,
  consensus_score: 8,
  answer_mode: "deep",
};

const team: TeamMember[] = [
  {
    id: "writer",
    name: "John",
    avatar: "john.jpg",
    model: "writer-model",
    duty: "writer",
    role: "Generalist Synthesizer",
    lockToBaseRole: false,
  },
  {
    id: "critic-a",
    name: "Christy",
    avatar: "christy.jpg",
    model: "critic-a-model",
    duty: "critic",
    role: "Accuracy Reviewer",
    lockToBaseRole: false,
  },
  {
    id: "critic-b",
    name: "Mark",
    avatar: "mark.jpg",
    model: "critic-b-model",
    duty: "critic",
    role: "User Advocate",
    lockToBaseRole: false,
  },
];

describe("mergeTeamIntoPayload", () => {
  it("keeps role arrays aligned with writer and critic arrays", () => {
    const payload = mergeTeamIntoPayload(form, team, [], "");

    expect(payload.writers).toEqual(["writer-model"]);
    expect(payload.writer_roles).toEqual(["Generalist Synthesizer"]);
    expect(payload.critics).toEqual(["critic-a-model", "critic-b-model"]);
    expect(payload.critic_roles).toEqual(["Accuracy Reviewer", "User Advocate"]);
    expect(payload.answer_mode).toBe("deep");
  });
});

describe("castToTeam", () => {
  it("restores saved seat-specific roles without locking them to the shared role", () => {
    const restored = castToTeam(
      {
        writer: { name: "John", avatar: "john.jpg", model: "writer-model" },
        critics: [{ name: "Christy", avatar: "christy.jpg", model: "critic-model" }],
      },
      "Shared Expert",
      ["Generalist Synthesizer"],
      ["Accuracy Reviewer"]
    );

    expect(restored.map((member) => member.role)).toEqual([
      "Generalist Synthesizer",
      "Accuracy Reviewer",
    ]);
    expect(restored.every((member) => member.lockToBaseRole === false)).toBe(true);
  });
});

describe("buildFollowupContext", () => {
  const baseResult: ConsultResult = {
    session_id: "20260617_132229",
    question: "Original trip prompt",
    role: "Travel planner",
    base_question: "Original trip prompt",
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
    final_answer: "Immediate parent answer mentions Verona.",
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
    root_question: "Original root trip prompt",
    source_prompt: "Original source prompt",
    source_final_answer: "Older source answer without the new city.",
    followup_instruction: "",
    model_costs: [],
    total_cost_usd: 0,
    total_tokens: 0,
    total_duration_seconds: 0,
    phase_timings: [],
  };

  it("uses the immediate follow-up answer when chaining a second follow-up", () => {
    const context = buildFollowupContext({
      ...baseResult,
      is_followup: true,
      followup_instruction: "Add Verona before Venice.",
    });

    expect(context.rootQuestion).toBe("Original root trip prompt");
    expect(context.parentPrompt).toBe("Add Verona before Venice.");
    expect(context.parentFinalAnswer).toBe("Immediate parent answer mentions Verona.");
  });
});
