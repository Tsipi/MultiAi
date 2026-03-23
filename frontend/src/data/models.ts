import { ModelOption } from "../types";

export const MODEL_OPTIONS: ModelOption[] = [
  { id: "deepseek/deepseek-chat-v3.2", label: "Deepseek v3.2", cost: "$0.2/$0.4" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", cost: "$0.3/$2.5" },
  { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6", cost: "$1/$15" },
  { id: "openai/gpt-5.4", label: "OpenAI 5.4", cost: "$0.9/$15" },
  { id: "google/gemini-3.1-pro", label: "Gemini 3.1 Pro", cost: "$1.15/$12" }
];

export const ROUND_OPTIONS = [1, 2, 3, 4, 5, 6];
export const SCORE_OPTIONS = [6, 7, 8, 9, 10];
