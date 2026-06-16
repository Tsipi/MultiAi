export type ModelOption = {
  id: string;
  label: string;
  cost: string;
};

export type AttachmentInput = {
  kind: "text" | "pdf" | "image";
  name: string;
  mime_type: string;
  data: string;
};

export type WebSearchMode = "off" | "auto" | "on";

export type WebSearchSource = {
  title: string;
  url: string;
  content?: string;
};

/** Serialized attachment reference returned with a session (data URL for display). */
export type AttachmentFileRef = {
  name: string;
  mime_type: string;
  kind: string;
  data: string;
};

/** Payload sent to the backend to start a run. */
export type ConsultPayload = {
  // ── Input / question ──────────────────────────────────────────────────
  question: string;
  role: string;
  attachments?: AttachmentInput[];
  web_search_mode?: WebSearchMode;

  // ── Team ──────────────────────────────────────────────────────────────
  // Preferred: full lists (what the backend actually reads)
  writers?: string[];
  critics?: string[];
  writer_names?: string[];
  critic_names?: string[];
  writer_roles?: string[];
  critic_roles?: string[];
  // Legacy single-model fields — kept for backward compat; backend coerces into the lists above
  writer: string;
  critic_a: string;
  critic_b: string;

  // ── Debate settings ───────────────────────────────────────────────────
  max_rounds: number;
  consensus_score: number;

  // ── Clarification flow ────────────────────────────────────────────────
  clarification?: string;
  clarification_question?: string;

  // ── Follow-up chain ───────────────────────────────────────────────────
  is_followup?: boolean;
  thread_id?: string;
  parent_session_id?: string;
  root_question?: string;
  source_prompt?: string;
  source_final_answer?: string;
  followup_instruction?: string;
};

/** Result returned from the backend after a completed run. */
export type ConsultResult = {
  // ── Identity ──────────────────────────────────────────────────────────
  session_id: string;

  // ── Input / question ──────────────────────────────────────────────────
  question: string;
  role: string;
  base_question: string;
  attachment_files: AttachmentFileRef[];
  web_search_mode: WebSearchMode;
  web_search_performed: boolean;
  web_search_query: string;
  web_search_retrieved_at: string;
  web_search_sources: WebSearchSource[];
  web_search_summary: string;
  web_search_warning: string;

  // ── Team ──────────────────────────────────────────────────────────────
  model_writers: string[];   // OpenRouter model IDs — which LLMs ran
  model_critics: string[];
  writer_names: string[];    // display names shown in the UI
  critic_names: string[];
  writer_roles: string[];    // seat-specific prompt roles
  critic_roles: string[];

  // ── Debate output ─────────────────────────────────────────────────────
  final_answer: string;
  final_score: number;
  full_discussion: Array<Record<string, unknown>>;
  status: "completed" | "needs_clarification";
  cost_hint: string;

  // ── Clarification flow ────────────────────────────────────────────────
  needs_clarification: boolean;
  clarification_question: string;
  clarification_reason: string;
  clarification_options: string[];
  clarification_response: string;

  // ── Follow-up chain ───────────────────────────────────────────────────
  is_followup: boolean;
  thread_id: string;
  parent_session_id: string;
  root_question: string;
  source_prompt: string;
  source_final_answer: string;
  followup_instruction: string;

  // ── Usage & cost ──────────────────────────────────────────────────────
  model_costs: Array<Record<string, unknown>>;
  total_cost_usd: number;
  total_tokens: number;

  // ── Sharing ───────────────────────────────────────────────────────────
  visibility?: "private" | "public";
  public_slug?: string | null;
};

export type StreamHandlers = {
  onActivity: (message: string) => void;
  onFinal: (result: ConsultResult) => void;
};

export type SessionPreview = {
  id: string;
  question: string;
  timestamp?: string;
  thread_id?: string;
  parent_session_id?: string;
  is_followup?: boolean;
  run_title?: string;
};
