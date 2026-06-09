import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Tooltip position under the icon; `start` keeps copy under the label row. */
  tipAlign?: "start" | "center" | "end";
};

export function InfoTip({ children, className, tipAlign = "start" }: Props) {
  const tipPos =
    tipAlign === "center"
      ? "left-1/2 top-full mt-1.5 -translate-x-1/2"
      : tipAlign === "end"
        ? "right-0 top-full mt-1.5 translate-x-0"
        : "left-0 top-full mt-1.5 translate-x-0";
  return (
    <span
      className={cn("relative inline-flex shrink-0 group/tip align-middle", className)}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        tabIndex={0}
        className={cn(
          "rounded-full p-0.5 text-muted-foreground hover:text-foreground",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        )}
        aria-label="More information"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-[200]",
          tipPos,
          "w-max max-w-[min(288px,calc(100vw-2rem))]",
          "rounded-md border border-border/80 bg-card px-2.5 py-2 text-xs leading-snug text-foreground shadow-lg",
          "opacity-0 transition-opacity duration-150",
          "group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
        )}
      >
        {children}
      </span>
    </span>
  );
}
