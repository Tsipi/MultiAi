import { Globe2 } from "lucide-react";
import type { WebSearchMode } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InfoTip } from "./InfoTip";

type Props = {
  value: WebSearchMode;
  onChange: (value: WebSearchMode) => void;
};

const OPTIONS: Array<{ value: WebSearchMode; label: string; description: string }> = [
  { value: "auto", label: "Auto", description: "Searches for explicit web requests and clearly current questions." },
  { value: "on", label: "Search web", description: "Always retrieves live sources before the debate." },
  { value: "off", label: "No web", description: "Runs only with model knowledge and supplied files." },
];

export function WebResearchControl({ value, onChange }: Props) {
  const selected = OPTIONS.find((option) => option.value === value) ?? OPTIONS[0];

  return (
    <section className="grid gap-2.5 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Globe2 className="h-4 w-4 text-violet-600 dark:text-violet-300" />
        Web research
        <InfoTip tipAlign="end">Live research uses OpenRouter search and adds a small extra cost.</InfoTip>
      </div>
      <div className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-center">
        <p className="m-0 text-[0.78rem] leading-snug text-muted-foreground">{selected.description}</p>
        <Select value={value} onValueChange={(next) => onChange(next as WebSearchMode)}>
          <SelectTrigger className="h-9 w-full border-violet-500/25 bg-card">
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
