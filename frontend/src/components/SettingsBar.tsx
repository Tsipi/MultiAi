import { MODEL_OPTIONS, ROUND_OPTIONS, SCORE_OPTIONS } from "../data/models";
import { ConsultPayload } from "../types";
import { FACE_OPTIONS, TeamMember, mkMember } from "../data/experts";
import { TeamMemberCard } from "./TeamMemberCard";

type Props = {
  value: ConsultPayload;
  team: TeamMember[];
  loading: boolean;
  canSubmit: boolean;
  onChange: (next: ConsultPayload) => void;
  onTeamChange: (next: TeamMember[]) => void;
  onSubmit: () => void;
  showSubmit?: boolean;
  submitLabel?: string;
};

export function SettingsBar({
  value, team, loading, canSubmit, onChange, onTeamChange, onSubmit, showSubmit = true, submitLabel
}: Props) {
  const set = <K extends keyof ConsultPayload>(key: K, val: ConsultPayload[K]) =>
    onChange({ ...value, [key]: val });
  const updateMember = (idx: number, next: TeamMember) => {
    onTeamChange(team.map((m, i) => (i === idx ? next : m)));
  };
  const addMember = () => {
    const face = FACE_OPTIONS[team.length % FACE_OPTIONS.length];
    onTeamChange([...team, mkMember(`expert-${Date.now()}`, face.name, face.avatar, MODEL_OPTIONS[0].id, "critic", value.role)]);
  };
  const removeMember = (idx: number) => onTeamChange(team.filter((_, i) => i !== idx));
  return (
    <section className="panel panel-cheer">
      <h2 className="section-title section-title-icon team-title">Your Team of Experts</h2>
      <div className="settings-main">
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
      <button type="button" className="ghost-btn add-expert-btn" onClick={addMember}>+ Add another team member</button>
      <div className="settings-secondary">
        <NumSelect label="Debate passes" iconClass="rounds" value={value.max_rounds} list={ROUND_OPTIONS} onChange={(v) => set("max_rounds", v)} />
        <NumSelect label="Agreement score" iconClass="consensus" value={value.consensus_score} list={SCORE_OPTIONS} onChange={(v) => set("consensus_score", v)} />
      </div>
      <small className="muted">Debate passes = how many critique-and-rewrite loops your team can run before wrapping.</small>
      <small className="muted">Agreement score = how aligned the writer and critics must be before the team stops.</small>
      <small className="muted">Scorer + Summarizer stay on Deepseek v3.2, the unshakeable backstage manager.</small>
      <small className="muted">Under the hood, one writer + two critics perform each run (first matching seats from your lineup).</small>
      {showSubmit && (
        <button className="ask-team-btn" disabled={loading || !canSubmit} onClick={onSubmit}>
          {loading ? "Huddle in progress..." : submitLabel ?? "Ask Team"}
        </button>
      )}
    </section>
  );
}

function NumSelect({
  label, iconClass, value, list, onChange
}: { label: string; iconClass: "rounds" | "consensus"; value: number; list: number[]; onChange: (v: number) => void }) {
  return (
    <label className="metric-label">
      <span className="label-icon-wrap"><span className={`label-icon ${iconClass}`} />{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {list.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </label>
  );
}
