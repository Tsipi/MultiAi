import { InfoTip } from "./InfoTip";
import { cn } from "@/lib/utils";

type Props = { label: string; tip: React.ReactNode; id?: string; compact?: boolean };

/** Label text with trailing info tooltip (field control goes below). */
export function FieldLabelWithTip({ label, tip, id, compact }: Props) {
  return (
    <div className="flex w-full min-w-0 flex-wrap items-center gap-1.5">
      <span
        id={id}
        className={cn(
          "text-foreground/85",
          compact ? "text-[0.72rem] font-medium leading-tight" : "text-sm font-semibold"
        )}
      >
        {label}
      </span>
      <InfoTip>{tip}</InfoTip>
    </div>
  );
}
