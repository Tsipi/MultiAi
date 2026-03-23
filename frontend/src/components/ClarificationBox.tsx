type Props = {
  reason: string;
  question: string;
  options: string[];
  selected: string;
  otherText: string;
  loading: boolean;
  onSelect: (value: string) => void;
  onOtherTextChange: (value: string) => void;
  onSubmit: () => void;
};

export function ClarificationBox(props: Props) {
  const usingOther = props.selected === "Other";
  const canSubmit = props.selected && (!usingOther || props.otherText.trim());
  return (
    <div className="clarify-box">
      <h2 className="section-title">Clarification Needed</h2>
      <p className="muted">{props.reason}</p>
      <p>{props.question}</p>
      <div className="clarify-options">
        {props.options.map((opt) => (
          <button key={opt} className={props.selected === opt ? "opt active" : "opt"} onClick={() => props.onSelect(opt)}>
            {opt}
          </button>
        ))}
      </div>
      {usingOther && (
        <label>
          Other (please specify)
          <input
            value={props.otherText}
            onChange={(e) => props.onOtherTextChange(e.target.value)}
            placeholder="Type your clarification"
          />
        </label>
      )}
      <button onClick={props.onSubmit} disabled={props.loading || !canSubmit}>
        Continue with Clarification
      </button>
    </div>
  );
}
