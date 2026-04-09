import { Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  modelId: string;
  className?: string;
  title?: string;
};

/** Small provider badge from OpenRouter-style model id (no official logos; letter + brand-like colors). */
export function ModelProviderIcon({ modelId, className, title }: Props) {
  const id = modelId.toLowerCase();
  const cfg = resolveProvider(id);
  if (cfg.kind === "letter") {
    return (
      <span
        title={title ?? modelId}
        className={cn(
          "inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] text-[9px] font-bold text-white shadow-sm",
          cfg.bg,
          className
        )}
        aria-hidden
      >
        {cfg.letter}
      </span>
    );
  }
  return (
    <span title={title ?? modelId} className={cn("inline-flex text-muted-foreground", className)} aria-hidden>
      <Cpu className="h-[18px] w-[18px]" strokeWidth={2} />
    </span>
  );
}

function resolveProvider(
  id: string
): { kind: "letter"; letter: string; bg: string } | { kind: "icon" } {
  if (id.includes("google/") || id.includes("gemini")) return { kind: "letter", letter: "G", bg: "bg-gradient-to-br from-blue-500 to-emerald-500" };
  if (id.includes("openai/") || id.includes("gpt")) return { kind: "letter", letter: "O", bg: "bg-emerald-600" };
  if (id.includes("anthropic/") || id.includes("claude")) return { kind: "letter", letter: "A", bg: "bg-amber-700" };
  if (id.includes("deepseek")) return { kind: "letter", letter: "D", bg: "bg-blue-600" };
  if (id.includes("meta-llama") || id.includes("llama")) return { kind: "letter", letter: "L", bg: "bg-indigo-600" };
  if (id.includes("mistral")) return { kind: "letter", letter: "M", bg: "bg-orange-600" };
  if (id.includes("x-ai/") || id.includes("grok")) return { kind: "letter", letter: "X", bg: "bg-zinc-700" };
  return { kind: "icon" };
}
