import { parseActivityMessages } from "./parseActivityMessages";

export type AgentSlot = "writer" | "criticA" | "criticB" | "bench";

/** Infer which seat is highlighted from the latest progress line. */
export function detectActiveAgent(lastMessage: string | undefined | null): AgentSlot {
  if (!lastMessage) return "bench";
  const { activeSpeaker } = parseActivityMessages([lastMessage]);
  if (!activeSpeaker || activeSpeaker === "scorer" || activeSpeaker === "system") return "bench";
  return activeSpeaker; // "writer" | "criticA" | "criticB" — all match AgentSlot
}
