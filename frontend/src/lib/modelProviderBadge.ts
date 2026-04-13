/** Single-letter badge for roster avatars (DeepSeek, Gemini, etc.). */
export function modelProviderBadge(modelId: string): string {
  const m = modelId.toLowerCase();
  if (m.includes("deepseek")) return "D";
  if (m.includes("gemini")) return "G";
  if (m.includes("anthropic") || m.includes("claude")) return "A";
  if (m.includes("openai") || m.includes("gpt")) return "O";
  if (m.includes("meta") || m.includes("llama")) return "L";
  if (m.includes("mistral")) return "M";
  if (m.includes("cohere")) return "C";
  return modelId.replace(/^[^/]+\//, "").slice(0, 1).toUpperCase() || "?";
}
