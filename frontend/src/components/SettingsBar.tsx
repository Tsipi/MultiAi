import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { MODEL_OPTIONS, ROUND_OPTIONS, SCORE_OPTIONS } from "../data/models";
import { ConsultPayload } from "../types";
import { FACE_OPTIONS, TeamMember, mkMember } from "../data/experts";
import { TeamMemberCard } from "./TeamMemberCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Props = {
  value: ConsultPayload;
  team: TeamMember[];
  loading: boolean;
  canSubmit: boolean;
  onChange: (next: ConsultPayload) => void;
  onTeamChange: (next: TeamMember[]) => void;
  onSubmit: () => void;
};

export function SettingsBar({ value, team, loading, canSubmit, onChange, onTeamChange, onSubmit }: Props) {
  const [open, setOpen] = useState(true);

  const set = <K extends keyof ConsultPayload>(key: K, val: ConsultPayload[K]) =>
    onChange({ ...value, [key]: val });

  const updateMember = (idx: number, next: TeamMember) =>
    onTeamChange(team.map((m, i) => (i === idx ? next : m)));

  const addMember = () => {
    const face = FACE_OPTIONS[team.length % FACE_OPTIONS.length];
    onTeamChange([
      ...team,
      mkMember(`expert-${Date.now()}`, face.name, face.avatar, MODEL_OPTIONS[0].id, "critic", value.role),
    ]);
  };

  const removeMember = (idx: number) => onTeamChange(team.filter((_, i) => i !== idx));

  return (
    <section className="glass-panel glass-panel-cheer glass-panel-hover p-4">
      {/* Collapsible header */}
      <button
        className="w-full flex items-center justify-between bg-transparent border-0 shadow-none cursor-pointer p-0 mb-0"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <h2 className="flex items-center gap-2.5 text-[1.06rem] font-semibold tracking-tight m-0">
          <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-400 flex-shrink-0 shadow-[0_0_0_3px_rgba(79,125,215,0.22)]" />
          Your Team of Experts
        </h2>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-150 flex-shrink-0",
            open ? "rotate-0" : "-rotate-90"
          )}
        />
      </button>

      {open && (
        <div className="mt-4 grid gap-3">
          {/* Team member cards */}
          <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {team.map((member, idx) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                baseRole={value.role}
                canRemove={team.length > 1}
                onUpdate={(next) => updateMember(idx, next)}
                onRemove={() => removeMember(idx)}
              />
            ))}
          </div>

          <Button variant="outline" size="sm" className="w-fit" onClick={addMember}>
            + Add another team member
          </Button>

          {/* Debate settings */}
          <div className="grid grid-cols-2 gap-2.5 max-w-[480px]">
            <NumSelect
              label="Debate passes"
              icon="rounds"
              value={value.max_rounds}
              list={ROUND_OPTIONS}
              onChange={(v) => set("max_rounds", v)}
            />
            <NumSelect
              label="Agreement score"
              icon="consensus"
              value={value.consensus_score}
              list={SCORE_OPTIONS}
              onChange={(v) => set("consensus_score", v)}
            />
          </div>

          <div className="grid gap-0.5">
            <p className="text-[0.9rem] text-muted-foreground m-0">
              Debate passes = critique-and-rewrite loops before wrapping up.
            </p>
            <p className="text-[0.9rem] text-muted-foreground m-0">
              Agreement score = how aligned writer and critics must be before stopping.
            </p>
            <p className="text-[0.9rem] text-muted-foreground m-0">
              Scorer + Summarizer always use Deepseek v3.2 behind the scenes.
            </p>
          </div>

          <Button
            size="lg"
            className="w-full h-14 text-base tracking-wide mt-1"
            disabled={loading || !canSubmit}
            onClick={onSubmit}
          >
            {loading ? "Huddle in progress..." : "Ask Team"}
          </Button>
        </div>
      )}
    </section>
  );
}

function NumSelect({
  label,
  icon,
  value,
  list,
  onChange,
}: {
  label: string;
  icon: "rounds" | "consensus";
  value: number;
  list: number[];
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 p-2 border border-border rounded-md bg-card/90 text-sm font-semibold">
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "w-3.5 h-3.5 inline-block flex-shrink-0",
            icon === "rounds"
              ? "rounded bg-gradient-to-br from-blue-300 to-indigo-300"
              : "rounded-full bg-gradient-to-br from-amber-300 to-green-300"
          )}
        />
        {label}
      </span>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {list.map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
