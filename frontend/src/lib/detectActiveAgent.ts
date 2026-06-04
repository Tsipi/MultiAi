import { parseActivityMessages } from "./parseActivityMessages";

export type AgentSlot = "writer" | "critic1" | "critic2" | "critic3" | "critic4" | "critic5" | "critic6" | "bench";

/** Infer which seat is highlighted from the latest progress line. */
export function detectActiveAgent(lastMessage: string | undefined | null): AgentSlot {
  if (!lastMessage) return "bench";
  const { activeSpeaker } = parseActivityMessages([lastMessage]);
  if (!activeSpeaker || activeSpeaker === "scorer" || activeSpeaker === "system") return "bench";
  if (activeSpeaker === "writer") return "writer";
  if (activeSpeaker.startsWith("critic")) return activeSpeaker as AgentSlot;
  return "bench";
}
