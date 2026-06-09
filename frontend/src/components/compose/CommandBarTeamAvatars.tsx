import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ModelProviderIcon } from "../primitives/ModelProviderIcon";
import type { TeamMember } from "@/data/experts";

type Props = {
  team: TeamMember[];
  disabled?: boolean;
  showRoles?: boolean;
  onAddTeamMember: () => void;
  onOpenAdvanced: () => void;
};

function shortRole(role: string): string {
  return role.split(" —")[0].split(" - ")[0].trim();
}

/** Roster preview: avatars with model badges; double-click opens Advanced setup; + adds a critic. */
export function CommandBarTeamAvatars({ team, disabled, showRoles, onAddTeamMember, onOpenAdvanced }: Props) {
  return (
    <div className="flex max-w-[min(100%,320px)] shrink-0 items-center justify-end gap-1.5 sm:max-w-none">
      <div
        className="min-w-0">
        <div
          className={cn(
            "flex overflow-x-auto scrollbar-hide rounded-xl border border-transparent",
            showRoles ? "gap-2 py-1 pl-1 pr-1 items-start" : "items-center gap-1 py-0.5 pl-0.5 pr-1",
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
            <div key={m.id} className={cn("shrink-0", showRoles ? "flex flex-col items-center gap-0.5 w-14" : "relative h-9 w-9 sm:h-10 sm:w-10")}>
              <div className="relative h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                <img
                  src={m.avatar}
                  alt=""
                  className="h-full w-full rounded-full border-2 border-violet-200/90 object-cover block dark:border-violet-600/45"
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex leading-none" aria-hidden>
                  <ModelProviderIcon
                    modelId={m.model}
                    title={m.model}
                    className="!h-[15px] !w-[15px] !min-h-0 !rounded-[4px] !text-[7px] sm:!h-[17px] sm:!w-[17px] sm:!text-[8px]"
                  />
                </span>
              </div>
              {showRoles && (
                <div className="flex flex-col items-center gap-0 w-full">
                  <span className="text-[0.62rem] font-semibold leading-tight text-foreground/80 text-center truncate w-full">
                    {m.name}
                  </span>
                  <span className="text-[0.56rem] leading-tight text-muted-foreground/70 text-center line-clamp-2 w-full">
                    {shortRole(m.role)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className="h-8 shrink-0 gap-1 rounded-full border-dashed border-violet-400/55 bg-violet-50/60 px-2.5 text-xs font-medium text-violet-700 shadow-none hover:bg-violet-100/80 dark:bg-violet-950/40 dark:text-violet-400 dark:hover:bg-violet-900/50 sm:h-9 sm:px-3"
        aria-label="Add team member"
        onClick={(e) => {
          e.stopPropagation();
          onAddTeamMember();
        }}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        <span>Add member</span>
      </Button>
    </div>
  );
}
