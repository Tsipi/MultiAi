export type AgentSlot = "writer" | "criticA" | "criticB" | "bench";

/** Infer which seat is highlighted from the latest progress line. */
export function detectActiveAgent(lastMessage: string | undefined | null): AgentSlot {
  if (!lastMessage) return "bench";
  const t = lastMessage.toLowerCase();
  if (t.includes("critic a") || t.includes("christy")) return "criticA";
  if (t.includes("critic b") || t.includes("mark")) return "criticB";
  if (t.includes("writer") && !t.includes("rewrite")) return "writer";
  if (t.includes("rewrites") || t.includes("drafting")) return "writer";
  if (t.includes("synthesiz") || t.includes("completed") || t.includes("threshold")) return "bench";
  return "writer";
}
