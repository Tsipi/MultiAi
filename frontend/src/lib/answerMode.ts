import type { AnswerMode } from "@/types";

export function recommendedRoundsForAnswerMode(mode: AnswerMode): number {
  if (mode === "fast") return 1;
  if (mode === "deep") return 3;
  return 2;
}
