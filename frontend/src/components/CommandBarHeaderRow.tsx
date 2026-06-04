import type { TeamMember } from "@/data/experts";
import { CommandBarTeamAvatars } from "./CommandBarTeamAvatars";

type Props = {
  greetingName: string;
  team: TeamMember[];
  busy: boolean;
  showRoles?: boolean;
  onAddTeamMember: () => void;
  onOpenAdvanced: () => void;
};

/** Left-aligned greeting with roster avatars on the right. */
export function CommandBarHeaderRow({
  greetingName,
  team,
  busy,
  showRoles,
  onAddTeamMember,
  onOpenAdvanced,
}: Props) {
  const who = greetingName.trim() || "there";
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <h2 className="font-display m-0 text-left text-xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
          Hey, {who}. Ready to Dive in?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground/70">
          Drop a question and your squad will brainstorm, challenge weak ideas, and ship a cleaner answer.
        </p>
      </div>
      <CommandBarTeamAvatars
        team={team}
        disabled={busy}
        showRoles={showRoles}
        onAddTeamMember={onAddTeamMember}
        onOpenAdvanced={onOpenAdvanced}
      />
    </div>
  );
}
