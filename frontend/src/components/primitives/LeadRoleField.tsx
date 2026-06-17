import { Input } from "@/components/ui/input";
import { FieldLabelWithTip } from "./FieldLabelWithTip";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function LeadRoleField({ value, onChange, disabled }: Props) {
  return (
    <div className="grid w-full gap-1.5">
      <FieldLabelWithTip
        label="Lead expert role"
        tip="Persona and guardrails shared across models unless a seat overrides it in Advanced setup."
      />
      <div className="rounded-2xl border border-border bg-[var(--app-surface)] p-1.5 sm:p-2">
        <Input
          value={value}
          maxLength={255}
          disabled={disabled}
          placeholder="e.g. You are a creative website app designer."
          onChange={(e) => onChange(e.target.value)}
          className="h-12 rounded-xl border border-transparent bg-[var(--app-elevated)] px-4 text-[17px] font-display font-semibold text-foreground placeholder:text-muted-foreground/55"
        />
      </div>
    </div>
  );
}
