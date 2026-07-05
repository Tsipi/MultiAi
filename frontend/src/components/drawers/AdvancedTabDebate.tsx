import type { ConsultPayload } from "@/types";
import { AnswerModeControl } from "@/components/primitives/AnswerModeControl";
import { DebateOptionsTable } from "@/components/primitives/DebateOptionsTable";
import { recommendedRoundsForAnswerMode } from "@/lib/answerMode";

type Props = {
  form: ConsultPayload;
  onFormChange: (next: ConsultPayload) => void;
};

export function AdvancedTabDebate({ form, onFormChange }: Props) {
  const set = <K extends keyof ConsultPayload>(key: K, val: ConsultPayload[K]) =>
    onFormChange({ ...form, [key]: val });

  const setAnswerMode = (mode: NonNullable<ConsultPayload["answer_mode"]>) =>
    onFormChange({ ...form, answer_mode: mode, max_rounds: recommendedRoundsForAnswerMode(mode) });

  return (
    <div className="grid gap-4">
      <AnswerModeControl value={form.answer_mode ?? "balanced"} onChange={setAnswerMode} />
      <DebateOptionsTable
        maxRounds={form.max_rounds}
        consensusScore={form.consensus_score}
        onMaxRounds={(n) => set("max_rounds", n)}
        onConsensusScore={(n) => set("consensus_score", n)}
      />
    </div>
  );
}
