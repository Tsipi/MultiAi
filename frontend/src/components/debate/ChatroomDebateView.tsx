import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { parseActivityMessages, extractScoreFromMessage } from "@/lib/parseActivityMessages";
import type { AgentId } from "@/lib/parseActivityMessages";
import type { TeamMember } from "@/data/experts";
import { TEAM_TEMPLATES } from "@/data/templates";
import { DEBATE_SYSTEM_AVATAR } from "./DebateActivityPrimitives";
import { ChannelHeader } from "./ChannelHeader";
import { RoundDivider } from "./RoundDivider";
import { ScoreBadge } from "../primitives/ScoreBadge";
import { ChatMessage, SystemMessage, SkeletonMessage } from "./ChatMessage";
import { TypingRow } from "./TypingRow";
import { ConsensusReachedBanner } from "./ConsensusReachedBanner";

type Person = { name: string; avatar: string; model?: string };
type Cast = { writer: Person; critics: Person[] };

type Props = {
  activity: string[];
  cast: Cast;
  team: TeamMember[];
  loading: boolean;
  maxRounds: number;
  consensusThreshold: number;
  teamTemplateName?: string;
  /** Taller scroll area when used as the primary live panel */
  prominent?: boolean;
};

function speakerAlign(_speaker: AgentId): "left" | "right" {
  return "left";
}

function resolvePerson(
  speaker: AgentId,
  cast: Cast,
  activeTemplate: ReturnType<typeof TEAM_TEMPLATES.find> | null
): { name: string; avatar: string; role: string; model?: string; sublabel: string } {
  if (speaker === "scorer") {
    return { name: "Scorer", avatar: DEBATE_SYSTEM_AVATAR, role: "Bench", sublabel: "Scorer" };
  }

  let base: { name: string; avatar: string; role: string; model?: string };

  if (speaker === "writer") {
    base = { ...cast.writer, role: "Writer", model: cast.writer.model };
  } else {
    const m = speaker.match(/^critic(\d+)$/);
    if (m) {
      const idx = parseInt(m[1], 10) - 1;
      const member = cast.critics[idx];
      base = member
        ? { name: member.name, avatar: member.avatar, role: "Critic", model: member.model }
        : { name: `Critic ${idx + 1}`, avatar: DEBATE_SYSTEM_AVATAR, role: "Critic" };
    } else {
      base = { name: "System", avatar: DEBATE_SYSTEM_AVATAR, role: "System" };
    }
  }

  const templateMember = activeTemplate?.members.find((m) => m.name === base.name);
  const roleTitle = templateMember ? templateMember.role.split(" — ")[0].split(" - ")[0].trim() : "";
  const sublabel = roleTitle ? `${base.role} · ${roleTitle}` : base.role;

  return { ...base, sublabel };
}

function resolveTypingPerson(speaker: AgentId | null, cast: Cast): Person | null {
  if (!speaker) return null;
  if (speaker === "writer") return cast.writer;
  const m = speaker.match(/^critic(\d+)$/);
  if (m) return cast.critics[parseInt(m[1], 10) - 1] ?? null;
  return null;
}

export function ChatroomDebateView({
  activity,
  cast,
  team,
  loading,
  maxRounds,
  consensusThreshold: _consensusThreshold,
  teamTemplateName,
  prominent,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const prevLenRef = useRef(0);

  const state = useMemo(() => parseActivityMessages(activity), [activity]);

  // Auto-scroll on new messages unless user has scrolled up
  useEffect(() => {
    if (activity.length === prevLenRef.current) return;
    prevLenRef.current = activity.length;
    if (!userScrolled) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [activity.length, userScrolled]);

  const handleScroll = () => {
    const el = feedRef.current;
    if (!el) return;
    setUserScrolled(el.scrollHeight - el.scrollTop - el.clientHeight > 60);
  };

  // Group messages by round
  const byRound = useMemo(() => {
    const map = new Map<number, typeof state.messages>();
    for (const msg of state.messages) {
      const r = msg.round;
      if (!map.has(r)) map.set(r, []);
      map.get(r)!.push(msg);
    }
    return map;
  }, [state.messages]);

  const rounds = useMemo(
    () => Array.from(byRound.keys()).sort((a, b) => a - b),
    [byRound]
  );

  const activeTemplate = useMemo(
    () => teamTemplateName ? TEAM_TEMPLATES.find((t) => t.name === teamTemplateName) ?? null : null,
    [teamTemplateName]
  );

  const typingPerson = loading ? resolveTypingPerson(state.activeSpeaker, cast) : null;
  const newThreshold = Math.max(0, state.messages.length - 3);

  return (
    <div className="relative">
      {/* Comet border animation while live */}
      {loading && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full z-10 overflow-visible"
          style={{ filter: "drop-shadow(0 0 4px rgba(139,92,246,0.5))" }}
        >
          <rect
            x="1.5" y="1.5"
            width="calc(100% - 3px)" height="calc(100% - 3px)"
            rx="10.5" ry="10.5"
            fill="none"
            stroke="rgba(167,139,250,0.35)"
            strokeWidth="1.5"
            pathLength="1000"
            strokeDasharray="920 80"
            strokeLinecap="round"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="-1000" dur="4s" repeatCount="indefinite" />
          </rect>
        </svg>
      )}

      <div className="flex flex-col rounded-xl border border-border/50 bg-card/80 shadow-sm overflow-hidden">
        <ChannelHeader
          currentRound={state.currentRound}
          maxRounds={maxRounds}
          score={state.latestScore}
          previousScore={state.previousScore}
          loading={loading}
          team={team}
          teamTemplateName={teamTemplateName}
        />

        <div
          ref={feedRef}
          onScroll={handleScroll}
          className={cn(
            "flex-1 overflow-y-auto px-2 py-2 space-y-0.5",
            prominent ? "max-h-[min(56vh,560px)]" : "max-h-[min(48vh,480px)]",
            "min-h-[120px]"
          )}
        >
          {state.messages.length === 0 && loading && (
            <div className="flex flex-col gap-1 pt-2 pb-1">
              <SkeletonMessage lines={["w-4/5", "w-3/5", "w-2/3"]} delay="0ms" />
              <SkeletonMessage lines={["w-3/5", "w-4/5"]}            delay="180ms" />
              <SkeletonMessage lines={["w-2/3", "w-1/2"]}            delay="360ms" />
            </div>
          )}

          {(() => {
            let accumulatedScore: number | null = null;
            return rounds.map((roundNum) => {
              const msgs = byRound.get(roundNum)!;
              return (
                <div key={roundNum}>
                  {roundNum > 0 && <RoundDivider round={roundNum} maxRounds={maxRounds} />}
                  {msgs.map((msg) => {
                    const isNew = msg.id >= newThreshold;
                    if (msg.type === "score_announcement") {
                      const prevScore = accumulatedScore;
                      const extracted = extractScoreFromMessage(msg.text);
                      if (extracted) accumulatedScore = extracted.consensus;
                      return <ScoreBadge key={msg.id} text={msg.text} previousScore={prevScore} />;
                    }
                    if (msg.type === "system") {
                      return <SystemMessage key={msg.id} text={msg.text} isNew={isNew} />;
                    }
                    const person = resolvePerson(msg.speaker, cast, activeTemplate);
                    return (
                      <ChatMessage
                        key={msg.id}
                        speaker={msg.speaker}
                        name={person.name}
                        sublabel={person.sublabel}
                        avatar={person.avatar}
                        text={msg.text}
                        modelId={person.model}
                        isNew={isNew}
                        align={speakerAlign(msg.speaker)}
                      />
                    );
                  })}
                </div>
              );
            });
          })()}

          {state.consensusReached && state.consensusRound !== null && (
            <ConsensusReachedBanner round={state.consensusRound} score={state.latestScore} />
          )}

          {typingPerson && <TypingRow label={typingPerson.name} avatar={typingPerson.avatar} />}
          {typingPerson && <SkeletonMessage lines={["w-3/5", "w-2/5"]} delay="0ms" />}

          <div ref={bottomRef} className="h-px w-full shrink-0" aria-hidden />
        </div>

        {userScrolled && loading && (
          <div className="flex justify-center py-1.5 border-t border-border/40">
            <button
              type="button"
              onClick={() => {
                setUserScrolled(false);
                bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
              }}
              className="text-[0.7rem] font-medium px-3 py-1 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400 hover:bg-violet-500/25 transition-colors"
            >
              Jump to live
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
