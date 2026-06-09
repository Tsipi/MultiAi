import { InfoTip } from "./InfoTip";

type Props = {
  eyebrow: string;
  subtitle: string;
  tip?: string;
};

export function V2SectionHeader({ eyebrow, subtitle, tip }: Props) {
  return (
    <header className="mb-3 flex flex-wrap items-start gap-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground m-0">
            {eyebrow}
          </p>
          {tip ? (
            <InfoTip tipAlign="start">
              <span className="text-left">{tip}</span>
            </InfoTip>
          ) : null}
        </div>
        <p className="text-[13px] leading-snug text-foreground/85 m-0 mt-1.5 max-w-3xl">{subtitle}</p>
      </div>
    </header>
  );
}
