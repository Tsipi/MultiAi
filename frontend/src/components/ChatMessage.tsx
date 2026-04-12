import { cn } from "@/lib/utils";
import type { AgentId } from "@/lib/parseActivityMessages";

type Props = {
  speaker: AgentId;
  name: string;
  role: string;
  avatar: string;
  text: string;
  isNew?: boolean;
};

const NAME_COLOR: Record<AgentId, string> = {
  writer:  "text-violet-600 dark:text-violet-400",
  criticA: "text-blue-600 dark:text-blue-400",
  criticB: "text-orange-600 dark:text-orange-400",
  scorer:  "text-emerald-600 dark:text-emerald-400",
  system:  "text-muted-foreground",
};

export function ChatMessage({ speaker, name, role, avatar, text, isNew }: Props) {
  return (
    <div
      className={cn(
        "flex gap-3 px-1 py-1 rounded-lg hover:bg-muted/30 transition-colors",
        isNew && "animate-in fade-in slide-in-from-bottom-1 duration-250"
      )}
    >
      <img
        src={avatar}
        alt={name}
        className="h-9 w-9 shrink-0 rounded-full border border-border object-cover mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
          <span className={cn("text-sm font-semibold leading-none", NAME_COLOR[speaker])}>
            {name}
          </span>
          <span className="rounded-full bg-muted/60 px-1.5 py-0.5 text-[0.62rem] font-medium uppercase tracking-wide text-muted-foreground/80">
            {role}
          </span>
        </div>
        <p className="m-0 text-sm leading-relaxed text-foreground/85">{text}</p>
      </div>
    </div>
  );
}

export function SystemMessage({ text, isNew }: { text: string; isNew?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center px-2 py-1",
        isNew && "animate-in fade-in duration-300"
      )}
    >
      <p className="m-0 text-[0.75rem] text-muted-foreground/70 italic text-center">{text}</p>
    </div>
  );
}
