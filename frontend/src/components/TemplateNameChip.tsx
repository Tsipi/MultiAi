import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen, Briefcase, Code2, Layers, Megaphone,
  Network, Plane, Rocket, TrendingUp, Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TEAM_TEMPLATES } from "@/data/templates";

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  "programmer":         Code2,
  "research-writing":   BookOpen,
  "tourist-planner":    Plane,
  "ux-product":         Layers,
  "startup-gtm":        Rocket,
  "marketing-campaign": Megaphone,
  "investment-debate":  TrendingUp,
  "resume-career":      Briefcase,
  "tech-architecture":  Network,
};

function roleTitle(role: string): string {
  return role.split(" — ")[0].split(" - ")[0].trim();
}

type Props = { name: string; className?: string };

export function TemplateNameChip({ name, className }: Props) {
  const template = TEAM_TEMPLATES.find((t) => t.name === name);
  const Icon: LucideIcon = template ? (TEMPLATE_ICONS[template.id] ?? Users) : Users;
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={() => {
          if (ref.current) {
            const r = ref.current.getBoundingClientRect();
            setPos({ x: r.left, y: r.bottom });
          }
        }}
        onMouseLeave={() => setPos(null)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full",
          "bg-violet-100/70 dark:bg-violet-900/30",
          "border border-violet-300/40 dark:border-violet-700/40",
          "px-2 py-0.5 text-[0.6rem] font-medium",
          "text-violet-600 dark:text-violet-400 whitespace-nowrap cursor-default",
          className
        )}
      >
        <Icon className="h-2.5 w-2.5 shrink-0" strokeWidth={2.5} />
        {name}
      </span>

      {pos && template &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: pos.x,
              top: pos.y + 8,
            }}
            className={cn(
              "pointer-events-none z-[9999] w-72 rounded-2xl p-3.5 shadow-xl text-left",
              "border border-gray-200 bg-white",
              "dark:border-white/10 dark:bg-gray-900 dark:shadow-2xl"
            )}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Icon className="h-3.5 w-3.5 shrink-0 text-violet-500 dark:text-violet-400" strokeWidth={2} />
              <span className="text-[0.72rem] font-semibold text-gray-800 dark:text-white leading-tight">
                {template.name}
              </span>
            </div>
            <p className="text-[0.65rem] text-gray-500 dark:text-gray-400 mb-2.5 leading-snug">
              {template.description}
            </p>
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
                      {roleTitle(m.role)}
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
