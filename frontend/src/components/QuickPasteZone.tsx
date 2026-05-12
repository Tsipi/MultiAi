import { forwardRef } from "react";

export const QuickPasteZone = forwardRef<HTMLDivElement>(function QuickPasteZone(_, ref) {
  return (
    <div
      ref={ref}
      role="textbox"
      aria-label="Paste attachments here"
      tabIndex={0}
      className="rounded-md border border-dashed border-border/80 bg-card/80 px-3 py-2.5 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/35"
    >
      <span className="leading-snug">
        <span className="font-medium text-foreground/80">Quick paste:</span> focus here, then Ctrl+V (or Cmd+V).
      </span>
    </div>
  );
});
