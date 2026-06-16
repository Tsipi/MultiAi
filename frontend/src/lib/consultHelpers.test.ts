import { describe, expect, it } from "vitest";
import type { TeamMember } from "@/data/experts";
import type { ConsultPayload } from "@/types";
import { castToTeam, mergeTeamIntoPayload } from "./consultHelpers";

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
