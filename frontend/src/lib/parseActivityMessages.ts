/**
 * Pure logic — derives ChatroomState from the raw activity string[] that
 * arrives via the NDJSON stream. No React, no side-effects.
 */

export type AgentId =
  | "writer"
  | "critic1"
  | "critic2"
  | "critic3"
  | "critic4"
  | "critic5"
  | "critic6"
  | "scorer"
  | "system";

export type ChatroomMessage = {
  id: number;
  speaker: AgentId;
  text: string;
  round: number;
  type: "message" | "score_announcement" | "system";
};

export type ChatroomState = {
  activeSpeaker: AgentId | null;
  currentRound: number;
  latestScore: number | null;
  previousScore: number | null;
  consensusReached: boolean;
  consensusRound: number | null;
  messages: ChatroomMessage[];
};

// ── Patterns ─────────────────────────────────────────────────────────────────
const RE_ROUND_NUM     = /^Round (\d+):/i;
const RE_SCORE_LINE    = /consensus ([\d.]+)[,\s]+relevance ([\d.]+)/i;
const RE_THRESHOLD     = /consensus threshold reached at round (\d+)/i;
const RE_WRITER_TYPING = /writer (is drafting|rewrites)/i;
const RE_CRITIC_NUM    = /\bcritic (\d+)\b/i;
const RE_SCORER        = /^Round \d+: consensus/i;
const RE_SYNTH         = /synthesizing final answer/i;
const RE_COMPLETE      = /completed successfully/i;
const RE_QUEUED        = /queued request/i;

function toCriticId(n: number): AgentId | null {
  if (n >= 1 && n <= 6) return `critic${n}` as AgentId;
  return null;
}

function detectSpeaker(text: string): AgentId {
  if (RE_SCORER.test(text))        return "scorer";
  // Writer check before critic — "Writer rewrites based on Critic 1..." must not fall to critic
  if (RE_WRITER_TYPING.test(text)) return "writer";
  const cm = text.match(RE_CRITIC_NUM);
  if (cm) return toCriticId(parseInt(cm[1], 10)) ?? "system";
  if (RE_ROUND_NUM.test(text))     return "writer";
  return "system";
}

function detectActiveSpeaker(text: string): AgentId | null {
  if (RE_COMPLETE.test(text) || RE_THRESHOLD.test(text)) return null;
  if (RE_SYNTH.test(text))         return "system";
  if (RE_SCORER.test(text))        return "scorer";
  if (RE_WRITER_TYPING.test(text)) return "writer";
  const cm = text.match(RE_CRITIC_NUM);
  if (cm) return toCriticId(parseInt(cm[1], 10));
  if (RE_ROUND_NUM.test(text))     return "writer";
  return "system";
}

function messageType(text: string): "message" | "score_announcement" | "system" {
  if (RE_SCORER.test(text)) return "score_announcement";
  if (
    RE_COMPLETE.test(text) ||
    RE_QUEUED.test(text) ||
    RE_SYNTH.test(text) ||
    RE_THRESHOLD.test(text)
  )
    return "system";
  return "message";
}

export function parseActivityMessages(activity: string[]): ChatroomState {
  const messages: ChatroomMessage[] = [];
  let currentRound = 0;
  let latestScore: number | null = null;
  let previousScore: number | null = null;
  let activeSpeaker: AgentId | null = null;
  let consensusReached = false;
  let consensusRound: number | null = null;

  for (let i = 0; i < activity.length; i++) {
    const text = activity[i];

    const roundMatch = text.match(RE_ROUND_NUM);
    if (roundMatch) {
      const n = parseInt(roundMatch[1], 10);
      if (n > currentRound) currentRound = n;
    }

    const scoreMatch = text.match(RE_SCORE_LINE);
    if (scoreMatch) {
      const next = parseFloat(scoreMatch[1]);
      if (next !== latestScore) {
        previousScore = latestScore;
        latestScore = next;
      }
    }

    const thresholdMatch = text.match(RE_THRESHOLD);
    if (thresholdMatch) {
      consensusReached = true;
      consensusRound = parseInt(thresholdMatch[1], 10);
    }

    activeSpeaker = detectActiveSpeaker(text);

    // Skip the queued line from the visible feed
    if (RE_QUEUED.test(text)) continue;

    messages.push({
      id: i,
      speaker: detectSpeaker(text),
      text,
      round: currentRound,
      type: messageType(text),
    });
  }

  return {
    activeSpeaker,
    currentRound,
    latestScore,
    previousScore,
    consensusReached,
    consensusRound,
    messages,
  };
}

export function extractScoreFromMessage(
  text: string
): { consensus: number; relevance: number } | null {
  const m = text.match(RE_SCORE_LINE);
  if (!m) return null;
  return { consensus: parseFloat(m[1]), relevance: parseFloat(m[2]) };
}
