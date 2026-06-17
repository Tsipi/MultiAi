import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSharedRun } from "@/services/api";
import { MarkdownView } from "@/components/primitives/MarkdownView";
import type { ConsultResult } from "@/types";

type Props = {
  slug: string;
};

export function SharedRunPage({ slug }: Props) {
  const navigate = useNavigate();
  const [result, setResult] = useState<ConsultResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getSharedRun(slug)
      .then((data) => { if (!cancelled) setResult(data); })
      .catch(() => { if (!cancelled) setError("This shared run could not be found."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <header className="border-b border-[#ffffff12] px-4 py-3">
        <div className="mx-auto flex w-full max-w-[880px] items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 font-bold text-white text-sm shadow-md">
            M
          </div>
          <div className="font-bold text-base tracking-tight text-foreground">MultiAI</div>
          <span className="text-xs text-muted-foreground">Shared run</span>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto flex w-full max-w-[880px] flex-col gap-4">
          {loading && (
            <p className="text-sm text-muted-foreground">Loading shared run…</p>
          )}

          {!loading && error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {!loading && result && (
            <>
              <div className="rounded-xl border border-border/55 bg-card/90 px-5 py-4">
                <div className="text-[0.68rem] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-1">
                  Question
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{result.question}</p>
              </div>

              <div className="flex items-center gap-x-3 gap-y-1 flex-wrap px-1 text-xs text-muted-foreground">
                <span className="rounded-full px-2 py-0.5 text-[0.65rem] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  Score {result.final_score.toFixed(1)} / 10
                </span>
                {result.full_discussion.length > 0 && (
                  <span>
                    {result.full_discussion.length} round{result.full_discussion.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="text-[0.68rem] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 px-1">
                Final Answer
              </div>
              <MarkdownView content={result.final_answer} />
            </>
          )}

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => navigate("/app/new")}
              className="rounded-lg bg-violet-600 hover:bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white transition shadow-sm"
            >
              Try MultiAi
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
