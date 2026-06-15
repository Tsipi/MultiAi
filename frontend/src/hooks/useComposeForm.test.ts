import { describe, expect, it } from "vitest";
import { createFreshComposeState } from "./useComposeForm";

describe("createFreshComposeState", () => {
  it("clears the lead role, question, attachments, and team-member roles", () => {
    const fresh = createFreshComposeState();

    expect(fresh.form.role).toBe("");
    expect(fresh.form.question).toBe("");
    expect(fresh.attachments).toEqual([]);
    expect(fresh.team.every((member) => member.role === "")).toBe(true);
  });
});
