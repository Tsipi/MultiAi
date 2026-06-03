import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEAM_TEMPLATES, type TeamTemplate } from "@/data/templates";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  activeTemplateId: string | null;
  onSelect: (template: TeamTemplate) => void;
};

export function TemplateDrawer({ open, onClose, activeTemplateId, onSelect }: Props) {
  const handleSelect = (t: TeamTemplate) => {
    onSelect(t);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-[var(--v2-surface)] shadow-2xl transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="Team templates"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ffffff0a] px-4 py-3">
          <div>
            <p className="font-display text-sm font-bold text-foreground">Team Templates</p>
            <p className="text-[11px] text-muted-foreground">Pick a pre-built squad and run immediately.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close templates">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
          {TEAM_TEMPLATES.map((t) => {
            const isActive = activeTemplateId === t.id;
            const writers = t.members.filter((m) => m.duty === "writer");
            const critics = t.members.filter((m) => m.duty === "critic");
            return (
              <div
                key={t.id}
                className={cn(
                  "rounded-xl border p-3 transition-colors",
                  isActive
                    ? "border-violet-500/50 bg-violet-500/[0.08]"
                    : "border-[#ffffff0a] bg-[var(--v2-elevated)]/60 hover:border-violet-500/25"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold text-foreground leading-tight">{t.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{t.description}</p>
                  </div>
                  {isActive && (
                    <span className="shrink-0 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300">
                      Active
                    </span>
                  )}
                </div>

                {/* Members */}
                <div className="mt-2 flex flex-col gap-1">
                  {writers.map((m) => (
                    <MemberRow key={m.id} name={m.name} avatar={m.avatar} duty="Writer" role={m.role} />
                  ))}
                  {critics.map((m) => (
                    <MemberRow key={m.id} name={m.name} avatar={m.avatar} duty="Critic" role={m.role} />
                  ))}
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={isActive ? "outline" : "default"}
                  className={cn(
                    "mt-3 w-full text-xs font-semibold",
                    !isActive && "bg-violet-600 hover:bg-violet-700 text-white"
                  )}
                  onClick={() => handleSelect(t)}
                >
                  {isActive ? "Already active" : "Use this team"}
                </Button>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}

function MemberRow({
  name,
  avatar,
  duty,
  role,
}: {
  name: string;
  avatar: string;
  duty: string;
  role: string;
}) {
  const shortRole = role.split(" — ")[0] ?? role;
  return (
    <div className="flex items-center gap-2">
      <img src={avatar} alt={name} className="h-5 w-5 rounded-full object-cover shrink-0" />
      <span className="text-[11px] font-medium text-foreground/80 shrink-0">{name}</span>
      <span
        className={cn(
          "shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide",
          duty === "Writer"
            ? "bg-violet-500/20 text-violet-300"
            : "bg-sky-500/15 text-sky-300"
        )}
      >
        {duty}
      </span>
      <span className="min-w-0 truncate text-[11px] text-muted-foreground">{shortRole}</span>
    </div>
  );
}
