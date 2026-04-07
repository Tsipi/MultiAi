import { useEffect, useRef } from "react";
import { DebateChatBubble, DEBATE_SYSTEM_AVATAR, type DebatePerson, type DebateSpeakerId } from "./DebateActivityPrimitives";
import { cn } from "@/lib/utils";

type Cast = { writer: DebatePerson; criticA: DebatePerson; criticB: DebatePerson };

type Props = {
  title: string;
  subtitle?: string;
  activity: string[];
  cast: Cast;
  loading?: boolean;
  /** Taller, pinned-style panel for live runs */
  prominent?: boolean;
};

function detectSpeaker(message: string, cast: Cast): { id: DebateSpeakerId; label: string; avatar: string } {
  const text = message.toLowerCase();
  if (text.includes("critic a") || text.includes("christy"))
    return { id: "christy", label: cast.criticA.name, avatar: cast.criticA.avatar };
  if (text.includes("critic b") || text.includes("mark"))
    return { id: "mark", label: cast.criticB.name, avatar: cast.criticB.avatar };
  if (text.includes("writer") || text.includes("john"))
    return { id: "john", label: cast.writer.name, avatar: cast.writer.avatar };
  return { id: "system", label: "Bench", avatar: DEBATE_SYSTEM_AVATAR };
}

export function DebateActivityFeed({ title, subtitle, activity, cast, loading, prominent }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activity]);

  const roster = `${cast.writer.name}, ${cast.criticA.name} & ${cast.criticB.name}`;

  return (
    <div
      className={cn(
        "rounded-xl border border-ring/25 bg-gradient-to-b from-ring/8 to-muted/25 p-3.5 shadow-sm",
        prominent && "ring-1 ring-ring/20"
      )}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[1.06rem] font-semibold tracking-tight m-0">{title}</h2>
          <p className="mt-1 m-0 text-xs text-muted-foreground">
            {subtitle ?? `${roster} are debating your question in real time.`}
          </p>
        </div>
        {loading && (
          <span className="inline-flex items-center gap-2 rounded-full border border-ring/30 bg-card/80 px-2.5 py-1 text-[0.7rem] font-medium text-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        )}
      </div>
      <ol
        className={cn(
          "grid list-none gap-2 overflow-y-auto pr-1",
          prominent ? "max-h-[min(52vh,520px)]" : "max-h-[340px]"
        )}
      >
        {activity.map((item, i) => {
          const speaker = detectSpeaker(item, cast);
          return (
            <DebateChatBubble key={i} id={speaker.id} label={speaker.label} avatar={speaker.avatar} tag={`Step ${i + 1}`}>
              <p className="m-0 text-[0.92rem] not-italic leading-snug text-foreground/90">{item}</p>
            </DebateChatBubble>
          );
        })}
        <div ref={bottomRef} className="h-px w-full shrink-0" aria-hidden />
      </ol>
    </div>
  );
}
