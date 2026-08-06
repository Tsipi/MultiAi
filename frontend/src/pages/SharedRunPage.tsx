import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSharedRun } from "@/services/api";
import { MarkdownView } from "@/components/primitives/MarkdownView";
import { TeamStoaIcon } from "@/components/layout/TeamStoaIcon";
import { SessionAttachmentList } from "@/components/session/SessionAttachmentList";
import { sharedPromptView } from "@/lib/sharedPromptView";
import type { ConsultResult } from "@/types";

function SharedQuestionCard({ result }: { result: ConsultResult }) {
  const { rootQuestion, instruction, attachments } = sharedPromptView(result);
  if (!instruction && attachments.length === 0) return null;
  return (
    <div className="rounded-xl border border-border/55 bg-card/90 px-5 py-4">
      <div className="text-[0.68rem] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-2">
        Question <span className="text-violet-500/70 dark:text-violet-400/70">- Shared run</span>
      </div>
      {instruction && (
        <p className="m-0 whitespace-pre-wrap text-base font-semibold leading-snug text-foreground">
          {instruction}
        </p>
      )}
      {rootQuestion && (
        <p className="m-0 mt-2 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide">Follow-up to:</span>{" "}
          <span className="whitespace-pre-wrap">{rootQuestion}</span>
        </p>
      )}
      <SessionAttachmentList files={attachments} />
    </div>
  );
}

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
    <div className="min-h-dvh flex flex-col bg-[var(--bg)]">
      <header className="border-b border-border px-4 pb-4 pt-8 pt-safe sm:pt-10">
        <div className="mx-auto flex w-full max-w-[880px] items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 transition hover:opacity-80">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-700 to-violet-400 shadow-md">
              <TeamStoaIcon className="h-8 w-8" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-base tracking-tight text-foreground">
                Team<span className="font-display text-violet-700">Stoa</span>
              </div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Your AI decision council
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => navigate("/register")}
            className="min-h-[36px] shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            Try for free
          </button>
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
              <SharedQuestionCard result={result} />

              <div className="flex items-center justify-between gap-3 px-1">
                <div className="text-[0.68rem] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                  Final Answer
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full px-2 py-0.5 text-[0.65rem] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    Score {result.final_score.toFixed(1)} / 10
                  </span>
                  {result.full_discussion.length > 0 && (
                    <span>
                      {result.full_discussion.length} round{result.full_discussion.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              <MarkdownView content={result.final_answer} />
            </>
          )}

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => navigate("/app/new")}
              className="min-h-[44px] rounded-lg bg-violet-600 hover:bg-violet-700 px-6 py-3 text-sm font-semibold text-white transition shadow-sm"
            >
              Try TeamStoa
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t border-border px-4 pt-8 pb-[calc(env(safe-area-inset-bottom,0px)+2.5rem)] text-center text-xs text-muted-foreground/60">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span>© {new Date().getFullYear()} TeamStoa</span>
          <Link to="/about" className="underline hover:text-muted-foreground transition">About</Link>
          <Link to="/privacy" className="underline hover:text-muted-foreground transition">Privacy</Link>
          <Link to="/terms" className="underline hover:text-muted-foreground transition">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
