import type { ReactNode } from "react";
import { Copy, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModelProviderIcon } from "./ModelProviderIcon";

export type DebatePerson = { name: string; avatar: string };

export type DebateSpeakerId = "john" | "christy" | "mark" | "system";

export function DebateChatBubble({
  id,
  label,
  avatar,
  modelId,
  tag,
  rawText,
  children,
}: {
  id: DebateSpeakerId;
  label: string;
  avatar: string;
  modelId?: string;
  tag?: string;
  rawText?: string;
  children: ReactNode;
}) {
  const copyText = async () => {
    const text = (rawText ?? "").trim();
    if (!text) return;
    await navigator.clipboard.writeText(text);
  };

  const shareText = async () => {
    const text = (rawText ?? "").trim();
    if (!text) return;
    if (navigator.share) {
      await navigator.share({ title: `${label} · ${tag}`, text });
      return;
    }
    await navigator.clipboard.writeText(text);
  };

  return (
    <li className={cn("flex gap-2 items-end", id === "john" && "flex-row-reverse")}>
      <div
        className={cn(
          "max-w-[min(92%,900px)] rounded-xl border border-border/35 px-2.5 py-2 shadow-sm",
          `bubble-${id}`
        )}
      >
        <div className="mb-1 flex items-center gap-1.5">
          <div className="relative h-6 w-6 shrink-0">
            <img
              className="h-6 w-6 rounded-full border border-border object-cover"
              src={avatar}
              alt={label}
            />
            {modelId && modelId !== "system" ? (
              <span className="absolute -bottom-0.5 -right-0.5 leading-none" aria-hidden>
                <ModelProviderIcon modelId={modelId} title={modelId} className="!h-[11px] !w-[11px] !rounded-[3px] !text-[6px]" />
              </span>
            ) : null}
          </div>
          <span className="text-[0.75rem] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
        </div>
        <div className="disc-prose text-sm leading-snug">{children}</div>
        {rawText ? (
          <div className="mt-2 flex justify-end gap-1">
            <Button type="button" size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => void copyText()} aria-label="Copy answer text">
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => void shareText()} aria-label="Share answer text">
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

export const DEBATE_SYSTEM_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' rx='32' fill='%23758cae'/%3E%3Ctext x='32' y='41' font-size='28' text-anchor='middle' fill='white' font-family='Arial'%3ES%3C/text%3E%3C/svg%3E";
