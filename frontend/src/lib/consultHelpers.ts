import { TeamMember } from "@/data/experts";
import { AttachmentInput, ConsultPayload, SessionPreview } from "@/types";

export type CastPerson = { name: string; avatar: string };
export type CastSelection = { writer: CastPerson; criticA: CastPerson; criticB: CastPerson };

export function selectCastFromTeam(team: TeamMember[]): CastSelection {
  const { writer, criticA, criticB } = selectEngineMembers(team);
  return {
    writer: { name: writer.name, avatar: writer.avatar },
    criticA: { name: criticA.name, avatar: criticA.avatar },
    criticB: { name: criticB.name, avatar: criticB.avatar },
  };
}

export function mergeTeamIntoPayload(
  form: ConsultPayload,
  team: TeamMember[],
  attachments: AttachmentInput[],
  clarification: string
): ConsultPayload {
  const { writer, criticA, criticB } = selectEngineMembers(team);
  const imageLoaded = Boolean(attachments.some((a) => a.kind === "image"));
  return {
    ...form,
    writer: withImageFallback(writer.model, imageLoaded),
    critic_a: withImageFallback(criticA.model, imageLoaded),
    critic_b: withImageFallback(criticB.model, imageLoaded),
    role: (writer.role || form.role || "You are an expert in ...").slice(0, 255),
    attachments,
    clarification,
  };
}

export function selectEngineMembers(team: TeamMember[]): {
  writer: TeamMember;
  criticA: TeamMember;
  criticB: TeamMember;
} {
  const writer = team.find((m) => m.duty === "writer") ?? team[0];
  const critics = team.filter((m) => m.duty === "critic");
  const criticA = critics[0] ?? team.find((m) => m.id !== writer.id) ?? writer;
  const criticB = critics[1] ?? team.find((m) => m.id !== writer.id && m.id !== criticA.id) ?? criticA;
  return { writer, criticA, criticB };
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
