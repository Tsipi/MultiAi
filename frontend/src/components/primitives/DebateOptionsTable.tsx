import { ROUND_OPTIONS, SCORE_OPTIONS } from "../../data/models";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  maxRounds: number;
  consensusScore: number;
  onMaxRounds: (n: number) => void;
  onConsensusScore: (n: number) => void;
};

export function DebateOptionsTable({
  maxRounds,
  consensusScore,
  onMaxRounds,
  onConsensusScore,
}: Props) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/55">
      <table className="w-full border-collapse text-sm">
        <tbody>
          <tr className="border-b border-border/55">
            <th scope="row" className="px-3 py-2.5 align-top text-left">
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-foreground/85">
                Debate passes
              </p>
              <p className="m-0 mt-1 text-[0.78rem] font-normal leading-snug text-muted-foreground">
                Max critique-and-rewrite rounds before wrap-up. More passes are slower but more reviewed.
              </p>
            </th>
            <td className="w-[140px] px-3 py-2 align-middle">
              <Select value={String(maxRounds)} onValueChange={(v) => onMaxRounds(Number(v))}>
                <SelectTrigger className="h-9 w-full min-w-[92px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[240]">
                  {ROUND_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </td>
          </tr>
          <tr>
            <th scope="row" className="px-3 py-2.5 align-top text-left">
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-foreground/85">
                Agreement score
              </p>
              <p className="m-0 mt-1 text-[0.78rem] font-normal leading-snug text-muted-foreground">
                Minimum alignment from scorer before stopping.
              </p>
            </th>
            <td className="w-[140px] px-3 py-2 align-middle">
              <Select value={String(consensusScore)} onValueChange={(v) => onConsensusScore(Number(v))}>
                <SelectTrigger className="h-9 w-full min-w-[92px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[240]">
                  {SCORE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
