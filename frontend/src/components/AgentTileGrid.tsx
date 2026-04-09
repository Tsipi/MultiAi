import { useState } from "react";
import type { TeamMember } from "@/data/experts";
import { ConsultResult } from "@/types";
import { cn } from "@/lib/utils";
import { selectEngineMembers } from "@/lib/consultHelpers";
import { detectActiveAgent, type AgentSlot } from "@/lib/detectActiveAgent";
import { snippetFor, skeletonLine, tileBody, tileHot } from "@/lib/agentTileSnippets";
import { AgentTileModal } from "./AgentTileModal";
import { ModelProviderIcon } from "./ModelProviderIcon";
import { V2SectionHeader } from "./V2SectionHeader";

const TILE_RING = [
  "border-teal-400/35 shadow-[0_0_20px_rgba(45,212,191,0.12)]",
  "border-amber-400/35 shadow-[0_0_20px_rgba(251,191,36,0.1)]",
  "border-rose-400/35 shadow-[0_0_20px_rgba(251,113,133,0.1)]",
] as const;

type Props = {
  team: TeamMember[];
  loading: boolean;
  activity: string[];
  result: ConsultResult | null;
};

export function AgentTileGrid({ team, loading, activity, result }: Props) {
  const { writer, criticA, criticB } = selectEngineMembers(team);
  const slots = [
    { key: "w" as const, m: writer, label: "Writer" },
    { key: "a" as const, m: criticA, label: "Critic A" },
    { key: "b" as const, m: criticB, label: "Critic B" },
  ];
  const lastLine = activity[activity.length - 1];
  const pulse: AgentSlot = loading ? detectActiveAgent(lastLine) : "bench";
  const [open, setOpen] = useState<{ title: string; body: string } | null>(null);

  return (
    <>
      <section className="w-full">
        <V2SectionHeader
          eyebrow="Live debate board"
          subtitle="Three cards mirror the Writer and both Critics. During a run they show the latest progress line for that seat; when idle, the last round from history or a short preview. Open a card for the full snippet."
          tip="This is not three separate LLM apps—it is one debate loop: the same backend feeds these cards from stream messages and saved rounds."
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {slots.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() =>
                setOpen({
                  title: `${s.m.name} · ${s.label}`,
                  body: tileBody(s.key, activity, loading, result),
                })
              }
              className={cn(
                "text-left rounded-2xl border bg-[var(--v2-surface)] p-4 transition-colors",
                TILE_RING[i],
                tileHot(s.key, pulse, loading) && "ring-1 ring-violet-500/50"
              )}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <img src={s.m.avatar} alt="" className="h-9 w-9 rounded-full object-cover border border-[#ffffff10]" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-semibold truncate m-0">{s.m.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <ModelProviderIcon modelId={s.m.model} title={s.m.model} />
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground truncate m-0">
                      {s.label} · {s.m.model.split("/").slice(-1)[0]}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-[13px] leading-snug text-muted-foreground m-0 line-clamp-6 whitespace-pre-wrap">
                {loading && !snippetFor(s.key, activity, result)
                  ? skeletonLine(s.key, pulse, loading)
                  : snippetFor(s.key, activity, result)}
              </p>
            </button>
          ))}
        </div>
      </section>
      {open && <AgentTileModal title={open.title} body={open.body} onClose={() => setOpen(null)} />}
    </>
  );
}
