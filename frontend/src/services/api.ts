import { AttachmentFileRef, ConsultPayload, ConsultResult, StreamHandlers } from "../types";

const BASE_URL = "http://localhost:8000";

export async function consult(payload: ConsultPayload): Promise<ConsultResult> {
  const response = await fetch(`${BASE_URL}/api/consult`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error("Consult request failed.");
  }
  return normalizeResult(await response.json());
}

export async function listSessions(): Promise<Array<{
  session_id: string;
  question: string;
  timestamp?: string;
  thread_id?: string;
  parent_session_id?: string;
  is_followup?: boolean;
  run_title?: string;
}>> {
  const response = await fetch(`${BASE_URL}/api/sessions`);
  if (!response.ok) {
    throw new Error("Could not load sessions.");
  }
  return response.json() as Promise<Array<{
    session_id: string;
    question: string;
    timestamp?: string;
    thread_id?: string;
    parent_session_id?: string;
    is_followup?: boolean;
    run_title?: string;
  }>>;
}

export async function getSession(sessionId: string): Promise<ConsultResult> {
  const response = await fetch(`${BASE_URL}/api/sessions/${sessionId}`);
  if (!response.ok) {
    throw new Error("Could not load session.");
  }
  return normalizeResult(await response.json());
}

function titleFallback(question: string): string {
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 6);
  if (words.length >= 3) return words.join(" ");
  if (words.length > 0) return words.join(" ");
  return "consensus export";
}

export async function generateTitle(question: string, role = ""): Promise<string> {
  try {
    const response = await fetch(`${BASE_URL}/api/title`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, role })
    });
    if (!response.ok) return titleFallback(question);
    const data = await response.json() as { title: string };
    return (data.title && data.title.trim()) || titleFallback(question);
  } catch {
    return titleFallback(question);
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/sessions/${sessionId}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error("Could not delete session.");
  }
}

export async function consultStream(payload: ConsultPayload, handlers: StreamHandlers): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/consult-stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok || !response.body) {
    throw new Error("Consult stream request failed.");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }
      let event: { type: string; message?: string; data?: ConsultResult };
      try {
        event = JSON.parse(line) as { type: string; message?: string; data?: ConsultResult };
      } catch (error) {
        throw new Error(`Invalid stream event: ${String(error)} - ${line}`);
      }
      if (event.type === "activity" && event.message) {
        handlers.onActivity(event.message);
      }
      if (event.type === "final" && event.data) {
        handlers.onFinal(normalizeResult(event.data));
      }
    }
  }
}

function normalizeResult(raw: Partial<ConsultResult> & Record<string, unknown>): ConsultResult {
  const needsClarification = toBoolean(raw.needs_clarification);
  return {
    session_id: String(raw.session_id ?? ""),
    question: String(raw.question ?? ""),
    role: String(raw.role ?? raw.domain ?? ""),
    final_answer: String(raw.final_answer ?? ""),
    final_score: Number(raw.final_score ?? 0),
    cost_hint: String(raw.cost_hint ?? "Displayed as estimated by selected model rates."),
    full_discussion: Array.isArray(raw.full_discussion) ? raw.full_discussion : (Array.isArray(raw.rounds) ? raw.rounds : []),
    status: needsClarification ? "needs_clarification" : "completed",
    needs_clarification: needsClarification,
    clarification_question: String(raw.clarification_question ?? ""),
    clarification_reason: String(raw.clarification_reason ?? ""),
    clarification_options: Array.isArray(raw.clarification_options) ? raw.clarification_options.map((x) => String(x)) : [],
    model_costs: Array.isArray(raw.model_costs) ? raw.model_costs : [],
    total_cost_usd: Number(raw.total_cost_usd ?? 0),
    total_tokens: Number(raw.total_tokens ?? 0),
    thread_id: String(raw.thread_id ?? raw.session_id ?? ""),
    parent_session_id: String(raw.parent_session_id ?? ""),
    is_followup: toBoolean(raw.is_followup),
    source_prompt: String(raw.source_prompt ?? ""),
    source_final_answer: String(raw.source_final_answer ?? ""),
    followup_instruction: String(raw.followup_instruction ?? ""),
    base_question: String(raw.base_question ?? ""),
    attachment_files: normalizeAttachmentFiles(raw.attachment_files)
  };
}

function normalizeAttachmentFiles(raw: unknown): AttachmentFileRef[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const data = String(o.data ?? "");
      if (!data) return null;
      return {
        name: String(o.name ?? "Attachment"),
        mime_type: String(o.mime_type ?? ""),
        kind: String(o.kind ?? "file"),
        data
      };
    })
    .filter((x): x is AttachmentFileRef => x !== null);
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false" || normalized === "") {
      return false;
    }
  }
  return Boolean(value);
}
