type Props = {
  open: boolean;
  instruction: string;
  constraints: string;
  loading: boolean;
  changedSinceOpen: boolean;
  sourcePrompt: string;
  sourceAnswer: string;
  onOpen: () => void;
  onInstructionChange: (value: string) => void;
  onConstraintsChange: (value: string) => void;
  onAdjustTeam: () => void;
  onSubmit: () => void;
  onStartFresh: () => void;
};

export function FollowupComposer(props: Props) {
  if (!props.open) {
    return (
      <section className="followup-entry">
        <div>
          <p className="followup-entry-badge">Continue Thread</p>
          <h3 className="section-title">Want to continue this thread?</h3>
          <p className="muted">Ask a follow-up using the original prompt and the latest final answer.</p>
        </div>
        <button className="followup-cta-btn" onClick={props.onOpen}>Ask Follow-up</button>
      </section>
    );
  }
  const canSubmit = Boolean(props.instruction.trim()) && !props.loading;
  return (
    <section className="followup-box">
      <h3 className="section-title">Continue with a follow-up</h3>
      <p className="muted">We will reuse your original prompt and latest final answer as context.</p>
      <label>
        Follow-up task or question
        <textarea value={props.instruction} rows={4} onChange={(e) => props.onInstructionChange(e.target.value)} />
      </label>
      <label>
        Extra constraints (optional)
        <textarea value={props.constraints} rows={3} onChange={(e) => props.onConstraintsChange(e.target.value)} />
      </label>
      <div className="followup-chip">Using original prompt + latest final answer</div>
      <details>
        <summary>Context used</summary>
        <div className="followup-context">
          <p><b>Original prompt</b></p>
          <p className="muted clamp-3">{props.sourcePrompt || "Not available"}</p>
          <p><b>Previous final answer</b></p>
          <p className="muted clamp-3">{props.sourceAnswer || "Not available"}</p>
          <p><b>Follow-up instruction</b></p>
          <p className="muted">{props.instruction || "Not provided yet"}</p>
        </div>
      </details>
      {props.changedSinceOpen && (
        <p className="followup-warning">Team/settings updated. This follow-up will use the latest configuration.</p>
      )}
      <div className="followup-actions">
        <button onClick={props.onSubmit} disabled={!canSubmit}>
          {props.loading ? "Asking follow-up..." : props.changedSinceOpen ? "Ask Follow-up with Changes" : "Ask Follow-up"}
        </button>
        <button type="button" className="ghost-btn" onClick={props.onAdjustTeam}>Adjust team for this follow-up</button>
        <button type="button" className="ghost-btn" onClick={props.onStartFresh}>Start fresh</button>
      </div>
    </section>
  );
}
