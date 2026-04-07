import { ConsultPayload } from "../types";
import { TeamMember } from "../data/experts";
import { CollapsiblePanel } from "./CollapsiblePanel";
import { DebateSettings } from "./DebateSettings";
import { InfoTip } from "./InfoTip";
import { Button } from "@/components/ui/button";

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
  return (
    <CollapsiblePanel
      defaultOpen
      leading={
        <span className="h-5 w-5 shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-400 shadow-[0_0_0_3px_rgba(79,125,215,0.2)]" />
      }
      title="Your Team of Experts"
      titleEnd={
        <InfoTip tipAlign="center">
          Assign a writer and one or more critics, pick an OpenRouter model per seat, and tune how many debate rounds
          run before wrap-up.
        </InfoTip>
      }
    >
      <div className="grid gap-3">
        <DebateSettings value={value} team={team} onChange={onChange} onTeamChange={onTeamChange} />
        <Button
          size="lg"
          className="mt-1 h-14 w-full text-base tracking-wide"
          disabled={loading || !canSubmit}
          onClick={onSubmit}
        >
          {loading ? "Huddle in progress..." : "Ask Team"}
        </Button>
      </div>
    </CollapsiblePanel>
  );
}
