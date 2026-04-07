import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DebatePerson = { name: string; avatar: string };

export type DebateSpeakerId = "john" | "christy" | "mark" | "system";

export function DebateChatBubble({
  id,
  label,
  avatar,
  tag,
  children,
}: {
  id: DebateSpeakerId;
  label: string;
  avatar: string;
  tag: string;
  children: ReactNode;
}) {
  return (
    <li className={cn("flex gap-2 items-end", id === "john" && "flex-row-reverse")}>
      <img
        className="h-8 w-8 shrink-0 rounded-full border border-border object-cover"
        src={avatar}
        alt={label}
      />
      <div
        className={cn(
          "max-w-[min(92%,900px)] rounded-xl border border-border/35 px-2.5 py-2 shadow-sm",
          `bubble-${id}`
        )}
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[0.75rem] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
          <span className="rounded-full bg-muted/50 px-1.5 py-0.5 text-[0.67rem] text-muted-foreground">{tag}</span>
        </div>
        <div className="disc-prose text-sm leading-snug">{children}</div>
      </div>
    </li>
  );
}

export const DEBATE_SYSTEM_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' rx='32' fill='%23758cae'/%3E%3Ctext x='32' y='41' font-size='28' text-anchor='middle' fill='white' font-family='Arial'%3ES%3C/text%3E%3C/svg%3E";
