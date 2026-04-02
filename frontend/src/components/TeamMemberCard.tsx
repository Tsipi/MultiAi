import { MODEL_OPTIONS } from "../data/models";
import { FACE_OPTIONS, TeamMember, findFaceByName } from "../data/experts";

type Props = {
  member: TeamMember;
  baseRole: string;
  canRemove: boolean;
  onUpdate: (next: TeamMember) => void;
  onRemove: () => void;
};

export function TeamMemberCard({ member, baseRole, canRemove, onUpdate, onRemove }: Props) {
  const profile = findFaceByName(member.name);

  const chooseMember = (name: string) => {
    const face = findFaceByName(name);
    onUpdate({ ...member, name: face.name, avatar: face.avatar });
  };

  return (
    <article className="member-card">
      <div className="member-head">
        <img src={member.avatar} className="team-avatar" alt={member.name} />
        <div className="member-head-fields">
          <label title="Choose a team persona for this seat.">
            Team member
            <select value={member.name} onChange={(e) => chooseMember(e.target.value)}>
              {FACE_OPTIONS.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
          </label>
          <p className="member-tag">{profile.expertiseTag}</p>
          <p className="member-fun-fact">{profile.funFact}</p>
        </div>
      </div>
      <div className="member-main">
        <label title="Writer drafts and refines the answer. Critics challenge and improve it.">
          Seat
          <select value={member.duty} onChange={(e) => onUpdate({ ...member, duty: e.target.value as "writer" | "critic" })}>
            <option value="writer">Writer</option>
            <option value="critic">Critic</option>
          </select>
        </label>
        <label title="The AI model powering this team member.">
          LLM
          <select value={member.model} onChange={(e) => onUpdate({ ...member, model: e.target.value })}>
            {MODEL_OPTIONS.map((m) => <option key={m.id} value={m.id}>{m.label} ({m.cost})</option>)}
          </select>
        </label>
      </div>
      <label title="Describe what this expert specialises in. Leave blank to use the main expert role.">
        What this team member is great at
        <input
          value={member.role}
          placeholder={baseRole || "e.g. You are an expert in growth strategy for B2B SaaS."}
          onChange={(e) => onUpdate({ ...member, role: e.target.value, lockToBaseRole: false })}
        />
      </label>
      <div className="member-actions">
        <button type="button" className="ghost-btn sync-btn" onClick={() => onUpdate({ ...member, role: baseRole, lockToBaseRole: true })}>
          Adopt main expert style
        </button>
        <button type="button" className="ghost-btn danger" disabled={!canRemove} onClick={onRemove}>
          Remove
        </button>
      </div>
    </article>
  );
}
