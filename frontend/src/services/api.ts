import { AttachmentFileRef, ConsultPayload, ConsultResult, StreamHandlers } from "../types";
import { getApiBaseUrl } from "../lib/apiBaseUrl";
import { getAuthToken } from "../lib/authToken";

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers as Record<string, string>) },
  });
}

export async function consult(payload: ConsultPayload): Promise<ConsultResult> {
  const response = await apiFetch(`${getApiBaseUrl()}/api/consult`, {
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
  const response = await apiFetch(`${getApiBaseUrl()}/api/sessions`);
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
  const response = await apiFetch(`${getApiBaseUrl()}/api/sessions/${sessionId}`);
  if (!response.ok) {
    throw new Error("Could not load session.");
  }
  return normalizeResult(await response.json());
}

function titleFallback(question: string): string {
  const trimmed = question.trim().replace(/\s+/g, " ");
  const words = trimmed.split(" ").slice(0, 12);
  const title = words.join(" ");
  return (title.length < trimmed.length ? title + "…" : title) || "Consensus Export";
}

export async function generateTitle(question: string, role = ""): Promise<string> {
  try {
    const response = await apiFetch(`${getApiBaseUrl()}/api/title`, {
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
  const response = await apiFetch(`${getApiBaseUrl()}/api/sessions/${sessionId}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error("Could not delete session.");
  }
}

export async function shareSession(sessionId: string): Promise<string> {
  const response = await apiFetch(`${getApiBaseUrl()}/api/sessions/${sessionId}/share`, { method: "POST" });
  if (!response.ok) {
    throw new Error("Could not share session.");
  }
  const data = await response.json() as { public_slug: string };
  return data.public_slug;
}

export async function unshareSession(sessionId: string): Promise<void> {
  const response = await apiFetch(`${getApiBaseUrl()}/api/sessions/${sessionId}/unshare`, { method: "POST" });
  if (!response.ok) {
    throw new Error("Could not unshare session.");
  }
}

export async function getSharedRun(slug: string): Promise<ConsultResult> {
  const response = await apiFetch(`${getApiBaseUrl()}/api/shared/${slug}`);
  if (!response.ok) {
    throw new Error("Shared run not found.");
  }
  return normalizeResult(await response.json());
}

export async function consultStream(payload: ConsultPayload, handlers: StreamHandlers): Promise<void> {
  const response = await apiFetch(`${getApiBaseUrl()}/api/consult-stream`, {
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
    // ── Identity ────────────────────────────────────────────────────────
    session_id: String(raw.session_id ?? ""),

    // ── Input / question ────────────────────────────────────────────────
    question: String(raw.question ?? ""),
    role: String(raw.role ?? raw.domain ?? ""),
    base_question: String(raw.base_question ?? ""),
    attachment_files: normalizeAttachmentFiles(raw.attachment_files),
    web_search_mode: raw.web_search_mode === "off" || raw.web_search_mode === "on" ? raw.web_search_mode : "auto",
    answer_mode: normalizeAnswerMode(raw.answer_mode),
    web_search_performed: toBoolean(raw.web_search_performed),
    web_search_query: String(raw.web_search_query ?? ""),
    web_search_retrieved_at: String(raw.web_search_retrieved_at ?? ""),
    web_search_sources: normalizeWebSearchSources(raw.web_search_sources),
    web_search_summary: String(raw.web_search_summary ?? ""),
    web_search_warning: String(raw.web_search_warning ?? ""),

    // ── Team ────────────────────────────────────────────────────────────
    model_writers: Array.isArray(raw.model_writers) ? raw.model_writers.map(String) : [],
    model_critics: Array.isArray(raw.model_critics) ? raw.model_critics.map(String) : [],
    writer_names: Array.isArray(raw.writer_names) ? raw.writer_names.map(String) : [],
    critic_names: Array.isArray(raw.critic_names) ? raw.critic_names.map(String) : [],
    writer_roles: Array.isArray(raw.writer_roles) ? raw.writer_roles.map(String) : [],
    critic_roles: Array.isArray(raw.critic_roles) ? raw.critic_roles.map(String) : [],

    // ── Debate output ───────────────────────────────────────────────────
    final_answer: String(raw.final_answer ?? ""),
    final_score: Number(raw.final_score ?? 0),
    // full_discussion falls back to raw.rounds for old session JSON format
    full_discussion: Array.isArray(raw.full_discussion) ? raw.full_discussion : (Array.isArray(raw.rounds) ? raw.rounds : []),
    status: needsClarification ? "needs_clarification" : "completed",
    cost_hint: String(raw.cost_hint ?? "Displayed as estimated by selected model rates."),

    // ── Clarification flow ──────────────────────────────────────────────
    needs_clarification: needsClarification,
    clarification_question: String(raw.clarification_question ?? ""),
    clarification_reason: String(raw.clarification_reason ?? ""),
    clarification_options: Array.isArray(raw.clarification_options) ? raw.clarification_options.map((x) => String(x)) : [],
    clarification_response: String(raw.clarification_response ?? ""),

    // ── Follow-up chain ─────────────────────────────────────────────────
    is_followup: toBoolean(raw.is_followup),
    thread_id: String(raw.thread_id ?? raw.session_id ?? ""),
    parent_session_id: String(raw.parent_session_id ?? ""),
    root_question: String(raw.root_question ?? ""),
    source_prompt: String(raw.source_prompt ?? ""),
    source_final_answer: String(raw.source_final_answer ?? ""),
    source_final_score: Number(raw.source_final_score ?? 0),
    followup_instruction: String(raw.followup_instruction ?? ""),

    // ── Usage & cost ────────────────────────────────────────────────────
    model_costs: Array.isArray(raw.model_costs) ? raw.model_costs : [],
    total_cost_usd: Number(raw.total_cost_usd ?? 0),
    total_tokens: Number(raw.total_tokens ?? 0),
    total_duration_seconds: Number(raw.total_duration_seconds ?? 0),
    phase_timings: normalizePhaseTimings(raw.phase_timings),

    // ── Sharing ─────────────────────────────────────────────────────────
    visibility: raw.visibility === "public" ? "public" : "private",
    public_slug: raw.public_slug != null ? String(raw.public_slug) : null,
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

function normalizeWebSearchSources(raw: unknown): ConsultResult["web_search_sources"] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const source = item as Record<string, unknown>;
      const url = String(source.url ?? "").trim();
      if (!isSafeHttpUrl(url)) return [];
      return [{
        title: String(source.title ?? url),
        url,
        ...(source.content != null ? { content: String(source.content) } : {}),
      }];
    });
}

function normalizePhaseTimings(raw: unknown): ConsultResult["phase_timings"] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const phase = String(row.phase ?? "").trim();
    if (!phase) return [];
    return [{
      ...row,
      phase,
      duration_seconds: Number(row.duration_seconds ?? 0),
    }];
  });
}

function normalizeAnswerMode(value: unknown): ConsultResult["answer_mode"] {
  return value === "fast" || value === "deep" ? value : "balanced";
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
