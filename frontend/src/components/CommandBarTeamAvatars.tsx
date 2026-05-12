import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ModelProviderIcon } from "./ModelProviderIcon";
import type { TeamMember } from "@/data/experts";

type Props = {
  team: TeamMember[];
  disabled?: boolean;
  onAddTeamMember: () => void;
  onOpenAdvanced: () => void;
};

/** Roster preview: avatars with model badges; double-click opens Advanced setup; + adds a critic. */
export function CommandBarTeamAvatars({ team, disabled, onAddTeamMember, onOpenAdvanced }: Props) {
  return (
    <div className="flex max-w-[min(100%,280px)] shrink-0 items-center justify-end gap-1.5 sm:max-w-none">
      <div
        className={cn(
          "flex max-w-[220px] items-center gap-1 overflow-x-auto rounded-xl border border-transparent py-0.5 pl-0.5 pr-1 sm:max-w-none",
          "hover:border-violet-400/35 hover:bg-violet-500/[0.06]",
          "cursor-pointer"
        )}
        role="group"
        tabIndex={0}
        title="Double-click to open Advanced setup"
        aria-label="Team roster. Double-click to open Advanced setup."
        onDoubleClick={(e) => {
          e.preventDefault();
          onOpenAdvanced();
        }}
      >
        {team.map((m) => (
          <div key={m.id} className="relative h-9 w-9 shrink-0 sm:h-10 sm:w-10">
            <img
              src={m.avatar}
              alt=""
              className="h-full w-full rounded-full border-2 border-violet-200/90 object-cover dark:border-violet-600/45"
            />
            <span className="absolute -bottom-0.5 -right-0.5 flex leading-none" aria-hidden>
              <ModelProviderIcon
                modelId={m.model}
                title={m.model}
                className="!h-[15px] !w-[15px] !min-h-0 !rounded-[4px] !text-[7px] sm:!h-[17px] sm:!w-[17px] sm:!text-[8px]"
              />
            </span>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled}
        className="h-8 w-8 shrink-0 rounded-full border-dashed border-violet-400/55 bg-violet-50/60 text-violet-700 shadow-none hover:bg-violet-100/80 dark:bg-violet-950/40 dark:hover:bg-violet-900/50 sm:h-9 sm:w-9"
        aria-label="Add team member"
        title="Add team member"
        onClick={(e) => {
          e.stopPropagation();
          onAddTeamMember();
        }}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
      </Button>
    </div>
  );
}
