import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEAM_TEMPLATES, TEMPLATE_ICONS, roleSummaryFromText, type TeamTemplate } from "@/data/templates";

type Props = {
  activeTemplateId: string | null;
  onSelect: (template: TeamTemplate) => void;
};

function TeamChip({
  template,
  active,
  onSelect,
  Icon,
}: {
  template: TeamTemplate;
  active: boolean;
  onSelect: () => void;
  Icon?: LucideIcon;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={onSelect}
        onMouseEnter={() => {
          if (!window.matchMedia("(hover: hover)").matches) return;
          if (ref.current) {
            const r = ref.current.getBoundingClientRect();
            setPos({ x: r.left + r.width / 2, y: r.top });
          }
        }}
        onMouseLeave={() => setPos(null)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer",
          "shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0 active:shadow-sm",
          active
            ? "border-violet-500 bg-violet-500/20 text-violet-700 dark:text-violet-300 shadow-violet-200/60 dark:shadow-none"
            : "border-slate-200 bg-white text-slate-600 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:bg-violet-900/30 dark:hover:text-violet-300"
        )}
      >
        {Icon && <Icon className="h-3 w-3 shrink-0" strokeWidth={2} />}
        {template.name}
      </button>

      {pos &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: pos.x,
              top: pos.y,
              transform: "translate(-50%, calc(-100% - 10px))",
            }}
            className={cn(
              "pointer-events-none z-[9999] w-72 rounded-2xl p-3.5 shadow-xl text-left",
              "border border-gray-200 bg-white",
              "dark:border-white/10 dark:bg-gray-900 dark:shadow-2xl"
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-1.5 mb-2">
              {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-violet-500 dark:text-violet-400" strokeWidth={2} />}
              <span className="text-[0.72rem] font-semibold text-gray-800 dark:text-white leading-tight">{template.name}</span>
            </div>
            <p className="text-[0.65rem] text-gray-500 dark:text-gray-400 mb-2.5 leading-snug">
              {template.description}
            </p>
            {/* Members */}
            <div className="flex flex-col gap-1.5">
              {template.members.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <img
                    src={m.avatar}
                    alt=""
                    className="h-6 w-6 shrink-0 rounded-full object-cover border border-gray-200 dark:border-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[0.7rem] font-semibold text-gray-900 dark:text-white">{m.name}</span>
                    <span
                      className={cn(
                        "ml-1.5 text-[0.58rem] font-bold uppercase tracking-wide",
                        m.duty === "writer"
                          ? "text-violet-600 dark:text-violet-400"
                          : "text-sky-600 dark:text-sky-400"
                      )}
                    >
                      {m.duty === "writer" ? "Writer" : "Critic"}
                    </span>
                    <p className="text-[0.62rem] text-gray-500 dark:text-gray-400 leading-snug truncate">
                      {roleSummaryFromText(m.role) ?? m.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export function TemplateShortcutRow({ activeTemplateId, onSelect }: Props) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5 items-center">
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground self-center mr-1.5 whitespace-nowrap">
        Pick a team:
      </span>
      {TEAM_TEMPLATES.map((t) => (
        <TeamChip
          key={t.id}
          template={t}
          active={activeTemplateId === t.id}
          onSelect={() => onSelect(t)}
          Icon={TEMPLATE_ICONS[t.id]}
        />
      ))}
    </div>
  );
}
