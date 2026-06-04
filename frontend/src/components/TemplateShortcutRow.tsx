import { cn } from "@/lib/utils";
import { TEAM_TEMPLATES, type TeamTemplate } from "@/data/templates";

type Props = {
  activeTemplateId: string | null;
  onSelect: (template: TeamTemplate) => void;
};

export function TemplateShortcutRow({ activeTemplateId, onSelect }: Props) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/60 self-center mr-1">
        Start from:
      </span>
      {TEAM_TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            activeTemplateId === t.id
              ? "border-violet-500/60 bg-violet-500/15 text-violet-300"
              : "border-[#ffffff12] bg-[var(--v2-elevated)] text-muted-foreground hover:border-violet-500/40 hover:text-foreground"
          )}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
