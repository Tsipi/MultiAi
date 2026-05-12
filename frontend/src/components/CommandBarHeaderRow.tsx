import type { TeamMember } from "@/data/experts";
import { CommandBarTeamAvatars } from "./CommandBarTeamAvatars";

type Props = {
  greetingName: string;
  team: TeamMember[];
  busy: boolean;
  onAddTeamMember: () => void;
  onOpenAdvanced: () => void;
};

/** Left-aligned greeting with roster avatars on the right. */
export function CommandBarHeaderRow({
  greetingName,
  team,
  busy,
  onAddTeamMember,
  onOpenAdvanced,
}: Props) {
  const who = greetingName.trim() || "there";
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <h2 className="font-display m-0 min-w-0 flex-1 text-left text-xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
        Hey, {who}. Ready to Dive in?
      </h2>
      <CommandBarTeamAvatars
        team={team}
        disabled={busy}
        onAddTeamMember={onAddTeamMember}
        onOpenAdvanced={onOpenAdvanced}
      />
    </div>
  );
}
