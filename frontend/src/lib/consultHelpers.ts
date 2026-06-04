import { TeamMember } from "@/data/experts";
import { AttachmentInput, ConsultPayload, SessionPreview } from "@/types";

export type CastPerson = { name: string; avatar: string; model: string };
export type CastSelection = { writer: CastPerson; critics: CastPerson[] };

export function selectCastFromTeam(team: TeamMember[]): CastSelection {
  const writer = team.find((m) => m.duty === "writer") ?? team[0];
  const critics = team.filter((m) => m.duty === "critic");
  return {
    writer: { name: writer.name, avatar: writer.avatar, model: writer.model },
    critics: critics.map((c) => ({ name: c.name, avatar: c.avatar, model: c.model })),
  };
}

export function mergeTeamIntoPayload(
  form: ConsultPayload,
  team: TeamMember[],
  attachments: AttachmentInput[],
  clarification: string,
  clarificationQuestion?: string
): ConsultPayload {
  const writer = team.find((m) => m.duty === "writer") ?? team[0];
  const critics = team.filter((m) => m.duty === "critic");
  const imageLoaded = Boolean(attachments.some((a) => a.kind === "image"));

  return {
    ...form,
    writers: team.filter((m) => m.duty === "writer").map((m) => withImageFallback(m.model, imageLoaded)),
    critics: critics.map((m) => withImageFallback(m.model, imageLoaded)),
    writer_names: team.filter((m) => m.duty === "writer").map((m) => m.name),
    critic_names: critics.map((m) => m.name),
    // Legacy fields so old backend versions and session replays still work
    writer: withImageFallback(writer.model, imageLoaded),
    critic_a: withImageFallback(critics[0]?.model ?? "", imageLoaded),
    critic_b: withImageFallback(critics[1]?.model ?? "", imageLoaded),
    role: (writer.role || form.role || "You are an expert in ...").slice(0, 255),
    attachments,
    clarification,
    clarification_question: clarificationQuestion ?? "",
  };
}

export function withImageFallback(model: string, imageLoaded: boolean): string {
  if (!imageLoaded) return model;
  return model === "deepseek/deepseek-chat-v3.2" ? "google/gemini-2.5-flash" : model;
}

export function toPreview(row: {
  session_id: string;
  question: string;
  timestamp?: string;
  thread_id?: string;
  parent_session_id?: string;
  is_followup?: boolean;
  run_title?: string;
}): SessionPreview {
  return {
    id: row.session_id,
    question: row.question,
    timestamp: row.timestamp,
    thread_id: row.thread_id || row.session_id,
    parent_session_id: row.parent_session_id || "",
    is_followup: Boolean(row.is_followup),
    run_title: row.run_title || row.question,
  };
}

export function buildRunSignature(team: TeamMember[], form: ConsultPayload): string {
  const seats = team.map((m) => `${m.id}:${m.duty}:${m.model}:${m.role}:${m.expertiseTag}`).join("|");
  return `${seats}:${form.max_rounds}:${form.consensus_score}:${form.role}`;
}
