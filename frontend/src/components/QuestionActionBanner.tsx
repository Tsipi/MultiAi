import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConsultResult } from "@/types";

type Props = {
  result: ConsultResult;
  onAskFollowup: () => void;
  onStartNew: () => void;
};

export function QuestionActionBanner({ result, onAskFollowup, onStartNew }: Props) {
  return (
    <section className={cn("rounded-3xl border border-violet-200/60 bg-[var(--v2-surface)] p-4 shadow-sm", "animate-in fade-in duration-300")}> 
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
            Viewing saved answer
          </p>
          <p className="mt-2 text-base font-semibold leading-snug text-foreground line-clamp-2">
            {result.question}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This answer is from a previous run. Start a fresh question or continue the thread with a follow-up.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <Button type="button" onClick={onAskFollowup} className="w-full sm:w-auto">
            Ask follow-up
          </Button>
          <Button type="button" variant="outline" onClick={onStartNew} className="w-full sm:w-auto">
            Start new question
          </Button>
        </div>
      </div>
    </section>
  );
}
