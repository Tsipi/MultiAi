export type ModelOption = {
  id: string;
  label: string;
  cost: string;
};

export type ConsultPayload = {
  writer: string;
  critic_a: string;
  critic_b: string;
  max_rounds: number;
  consensus_score: number;
  role: string;
  question: string;
  clarification?: string;
  attachments?: AttachmentInput[];
  is_followup?: boolean;
  parent_session_id?: string;
  thread_id?: string;
  source_prompt?: string;
  source_final_answer?: string;
  followup_instruction?: string;
};

export type AttachmentInput = {
  kind: "text" | "pdf" | "image";
  name: string;
  mime_type: string;
  data: string;
};

export type ConsultResult = {
  session_id: string;
  question: string;
  role: string;
  final_answer: string;
  final_score: number;
  cost_hint: string;
  full_discussion: Array<Record<string, unknown>>;
  status: "completed" | "needs_clarification";
  needs_clarification: boolean;
  clarification_question: string;
  clarification_reason: string;
  clarification_options: string[];
  model_costs: Array<Record<string, unknown>>;
  total_cost_usd: number;
  total_tokens: number;
  thread_id: string;
  parent_session_id: string;
  is_followup: boolean;
  source_prompt: string;
  source_final_answer: string;
  followup_instruction: string;
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
