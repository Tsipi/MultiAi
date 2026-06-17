import { Gauge } from "lucide-react";
import type { AnswerMode } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InfoTip } from "./InfoTip";

type Props = {
  value: AnswerMode;
  onChange: (value: AnswerMode) => void;
};

const OPTIONS: Array<{ value: AnswerMode; label: string; description: string }> = [
  { value: "balanced", label: "Balanced", description: "Starts with 2 debate passes for a quality and speed tradeoff." },
  { value: "fast", label: "Fast", description: "Starts with 1 debate pass for the shortest useful path." },
  { value: "deep", label: "Deep", description: "Starts with 3 debate passes when quality matters most." },
];

export function AnswerModeControl({ value, onChange }: Props) {
  const selected = OPTIONS.find((option) => option.value === value) ?? OPTIONS[0];

  return (
    <section className="grid gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Gauge className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
        Answer mode
        <InfoTip tipAlign="end">Changing mode sets a starting number of debate passes. You can still override it below.</InfoTip>
      </div>
      <div className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-center">
        <p className="m-0 text-[0.78rem] leading-snug text-muted-foreground">{selected.description}</p>
        <Select value={value} onValueChange={(next) => onChange(next as AnswerMode)}>
          <SelectTrigger className="h-9 w-full border-emerald-500/25 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[240]">
            {OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
