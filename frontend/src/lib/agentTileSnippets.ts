import type { ConsultResult } from "@/types";
import type { AgentSlot } from "@/lib/detectActiveAgent";

export function tileHot(key: "w" | "a" | "b", slot: AgentSlot, loading: boolean): boolean {
  if (!loading) return false;
  if (key === "w") return slot === "writer";
  if (key === "a") return slot === "criticA";
  return slot === "criticB";
}

export function skeletonLine(key: "w" | "a" | "b", slot: AgentSlot, loading: boolean): string {
  if (!tileHot(key, slot, loading)) return "Standing by…";
  if (key === "w") return "Drafting and refining…";
  return "Reviewing the latest draft…";
}

export function snippetFor(key: "w" | "a" | "b", activity: string[], result: ConsultResult | null): string {
  const fromActs = lastSnippet(key, activity);
  if (fromActs) return fromActs;
  if (!result?.full_discussion?.length) return "";
  const last = result.full_discussion[result.full_discussion.length - 1] as Record<string, unknown>;
  if (key === "w") return String(last.answer ?? result.final_answer ?? "").slice(0, 360);
  const crit = String(last.critique ?? "");
  if (key === "a") return crit.split(/\[Critic B\]/i)[0].replace(/\[\s*Critic A\s*\]\s*/i, "").trim().slice(0, 360);
  const parts = crit.split(/\[Critic B\]/i);
  return (parts[1] ?? parts[0] ?? "").replace(/\[\s*Critic B\s*\]\s*/i, "").trim().slice(0, 360);
}

function lastSnippet(key: "w" | "a" | "b", activity: string[]): string {
  const pred =
    key === "w"
      ? (s: string) => /writer|draft|round/i.test(s)
      : key === "a"
        ? (s: string) => /critic a|christy/i.test(s)
        : (s: string) => /critic b|mark/i.test(s);
  for (let i = activity.length - 1; i >= 0; i--) {
    if (pred(activity[i])) return activity[i].replace(/^Round \d+:\s*/i, "").slice(0, 360);
  }
  return "";
}

export function tileBody(key: "w" | "a" | "b", activity: string[], loading: boolean, result: ConsultResult | null): string {
  const s = snippetFor(key, activity, result);
  if (s) return s;
  return loading ? "In progress…" : "No output yet for this seat.";
}
