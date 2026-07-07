import { Link } from "react-router-dom";
import { TeamStoaIcon } from "@/components/layout/TeamStoaIcon";

export function AboutPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg)]">
      <header className="border-b border-border px-4 py-3 pt-safe">
        <div className="mx-auto flex w-full max-w-[780px] items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-700 to-violet-400 shadow-md">
              <TeamStoaIcon className="h-5 w-5" />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              Team<span className="text-violet-700">Stoa</span>
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition">Privacy</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[780px] flex-1 px-4 py-10 pb-safe">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">About TeamStoa</h1>
        <p className="text-sm text-muted-foreground mb-8">Your AI decision council.</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-foreground">

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">The idea</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every AI model has blind spots. Ask the same question to GPT-4, Claude, and Gemini
              and you will get three different answers — each confidently stated. TeamStoa was built
              around a simple insight: <strong>structured disagreement produces better answers than
              any single model can</strong>.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              The name comes from the <em>Stoa</em> — the ancient Greek colonnaded meeting place
              where Stoic philosophers gathered to debate, challenge each other's reasoning, and
              arrive at understanding together. That is what your AI team does on your behalf.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">How it works</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When you pose a question, a team of AI models takes on distinct roles:
            </p>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1 mt-2">
              <li><strong>Writer</strong> — drafts the initial answer based on your question and role</li>
              <li><strong>Critics</strong> — independently challenge the answer, flag weaknesses, and propose improvements</li>
              <li><strong>Scorer</strong> — rates agreement between the writer's revised answer and the critics' suggestions on a 1–10 scale</li>
              <li><strong>Summarizer</strong> — compresses each round into a rolling context so later rounds build on earlier insights</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              The debate continues until the team reaches consensus (score ≥ threshold) or the
              maximum number of rounds is reached. A final synthesis pass produces the answer you see.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Team templates</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              TeamStoa ships with pre-configured expert teams for common decision types —
              programming, research, travel planning, investment analysis, marketing, and more.
              Each template assigns a specialist role to every team member so the debate is
              grounded in domain knowledge from the first round.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Built by</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              TeamStoa is an independent product. It is not affiliated with OpenAI, Anthropic,
              Google, or any AI model provider. AI models are accessed via OpenRouter.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Feedback, questions, or partnership enquiries:{" "}
              <a href="mailto:hello@teamstoa.com" className="text-violet-600 dark:text-violet-400 underline hover:opacity-80 transition">
                hello@teamstoa.com
              </a>
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground/60">
        <div className="flex items-center justify-center gap-4">
          <span>© {new Date().getFullYear()} TeamStoa</span>
          <Link to="/terms" className="underline hover:text-muted-foreground transition">Terms</Link>
          <Link to="/privacy" className="underline hover:text-muted-foreground transition">Privacy</Link>
          <Link to="/about" className="underline hover:text-muted-foreground transition">About</Link>
        </div>
      </footer>
    </div>
  );
}
