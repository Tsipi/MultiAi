import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { panelHeadingClass } from "@/lib/panelStyles";

type Props = {
  title: string;
  leading?: React.ReactNode;
  titleEnd?: React.ReactNode;
  /** When true (default), panel starts expanded. */
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
};

/**
 * Disclosure panel matching Session insights chrome: bordered, gradient fill, chevron.
 */
export function CollapsiblePanel({
  title,
  leading,
  titleEnd,
  defaultOpen = true,
  children,
  className,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className={cn(
        "group rounded-xl overflow-hidden",
        "border border-border/70 bg-gradient-to-br from-muted/45 via-card/95 to-muted/25",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
        "dark:from-muted/15 dark:via-card/90 dark:to-muted/10",
        className
      )}
    >
      <summary
        className={cn(
          "cursor-pointer list-none flex items-center justify-between gap-2 px-3.5 py-2.5",
          "hover:bg-muted/35 transition-colors",
          "[&::-webkit-details-marker]:hidden"
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {leading}
          <span className={cn(panelHeadingClass, "min-w-0 shrink truncate leading-snug")}>{title}</span>
          {titleEnd}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-border/55 px-3.5 pb-3.5 pt-3">{children}</div>
    </details>
  );
}
