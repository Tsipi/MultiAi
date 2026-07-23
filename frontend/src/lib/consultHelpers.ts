import { mkMember, TeamMember } from "@/data/experts";
import { AttachmentInput, ConsultPayload, ConsultResult, SessionPreview } from "@/types";

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
    writer_roles: team.filter((m) => m.duty === "writer").map((m) => m.role),
    critic_roles: critics.map((m) => m.role),
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
  team_template_id?: string;
  writer_names?: string[];
  critic_names?: string[];
  model_writers?: string[];
  model_critics?: string[];
}): SessionPreview {
  return {
    id: row.session_id,
    question: row.question,
    timestamp: row.timestamp,
    thread_id: row.thread_id || row.session_id,
    parent_session_id: row.parent_session_id || "",
    is_followup: Boolean(row.is_followup),
    run_title: row.run_title || row.question,
    team_template_id: row.team_template_id ?? "",
    writer_names: row.writer_names,
    critic_names: row.critic_names,
    model_writers: row.model_writers,
    model_critics: row.model_critics,
  };
}

/** Rebuild a TeamMember[] from a saved cast, preserving seat-specific roles when available. */
export function castToTeam(
  cast: CastSelection,
  baseRole: string,
  writerRoles: string[] = [],
  criticRoles: string[] = []
): TeamMember[] {
  const writerRole = writerRoles[0]?.trim() || baseRole;
  const writer = {
    ...mkMember(cast.writer.name.toLowerCase(), cast.writer.name, cast.writer.avatar, cast.writer.model, "writer", writerRole),
    lockToBaseRole: !writerRoles[0]?.trim(),
  };
  const critics = cast.critics.map((c, index) => {
    const criticRole = criticRoles[index]?.trim() || baseRole;
    return {
      ...mkMember(c.name.toLowerCase(), c.name, c.avatar, c.model, "critic", criticRole),
      lockToBaseRole: !criticRoles[index]?.trim(),
    };
  });
  return [writer, ...critics];
}

export function buildRunSignature(team: TeamMember[], form: ConsultPayload): string {
  const seats = team.map((m) => `${m.id}:${m.duty}:${m.model}:${m.role}`).join("|");
  return `${seats}:${form.max_rounds}:${form.consensus_score}:${form.role}:${form.web_search_mode ?? "auto"}:${form.answer_mode ?? "balanced"}`;
}

export function buildFollowupContext(result: ConsultResult): {
  rootQuestion: string;
  parentPrompt: string;
  parentFinalAnswer: string;
  parentFinalScore: number;
} {
  const rootQuestion = result.root_question || result.source_prompt || result.question;
  const parentPrompt = result.is_followup
    ? (result.followup_instruction || result.base_question || result.question)
    : (result.source_prompt || result.question);
  return {
    rootQuestion,
    parentPrompt,
    parentFinalAnswer: result.final_answer || result.source_final_answer,
    parentFinalScore: result.final_score,
  };
}

/**
 * Synthetic in-progress follow-up result: lets the live run reuse the saved follow-up Question
 * card. Empty `final_answer` marks it in-progress (the hero is suppressed until the real result).
 */
export function buildInProgressFollowupResult(
  parent: ConsultResult,
  opts: { rootQuestion: string; parentPrompt: string; instruction: string; clarificationQuestion?: string; clarificationAnswer?: string }
): ConsultResult {
  return {
    ...parent,
    session_id: "",
    is_followup: true,
    parent_session_id: parent.session_id,
    thread_id: parent.thread_id || parent.session_id,
    root_question: opts.rootQuestion,
    source_prompt: opts.parentPrompt,
    source_final_answer: parent.final_answer,
    source_final_score: parent.final_score,
    followup_instruction: opts.instruction,
    final_answer: "",
    final_score: 0,
    full_discussion: [],
    status: "needs_clarification",
    needs_clarification: false,
    clarification_question: opts.clarificationQuestion ?? "",
    clarification_reason: "",
    clarification_response: opts.clarificationAnswer ?? "",
    // Follow-ups never re-run web research — clear the parent's research metadata.
    web_search_performed: false,
    web_search_query: "",
    web_search_sources: [],
    web_search_summary: "",
    web_search_warning: "",
    web_search_retrieved_at: "",
  };
}

/** One prior answer in a follow-up chain: its final answer + score, labelled by the prompt that produced it. */
export type AncestorAnswer = { sessionId: string; label: string; finalAnswer: string; finalScore: number };

// Follow-up ancestry (newest → oldest), display only. Level 1 comes from the result's `source_*`;
// deeper levels fetch via `getResult`. Walks to the root; `maxDepth` is a runaway safety cap.
export async function buildAncestorAnswers(
  result: ConsultResult,
  getResult: (id: string) => Promise<ConsultResult | null>,
  maxDepth = 25
): Promise<AncestorAnswer[]> {
  if (!result.is_followup || !result.parent_session_id) return [];
  const toEntry = (r: ConsultResult): AncestorAnswer => ({
    sessionId: r.parent_session_id,
    label: r.source_prompt || r.root_question || "",
    finalAnswer: r.source_final_answer || "",
    finalScore: r.source_final_score ?? 0,
  });
  const chain: AncestorAnswer[] = [toEntry(result)];
  let cursor = result;
  while (chain.length < maxDepth && cursor.parent_session_id) {
    const parent = await getResult(cursor.parent_session_id);
    if (!parent || !parent.is_followup || !parent.parent_session_id) break;
    chain.push(toEntry(parent));
    cursor = parent;
  }
  return chain;
}
