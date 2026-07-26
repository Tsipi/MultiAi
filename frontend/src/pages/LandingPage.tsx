import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2, Columns2, MessageSquare, RefreshCw, Scale, Search,
  Share2, Users, type LucideIcon,
} from "lucide-react";
import { TeamStoaIcon } from "@/components/layout/TeamStoaIcon";
import { Button } from "@/components/ui/button";
import { TEAM_TEMPLATES, TEMPLATE_ICONS } from "@/data/templates";

const PENDING_TEMPLATE_KEY = "pending_team_template";

type Persona = {
  title: string;
  label: string;
  quote: string;
  templateId: string | null; // null = Everyday (default team, no pre-select)
};

const PERSONAS: Persona[] = [
  {
    title: "Investor",
    label: "Investor",
    quote: "Don't bet your portfolio on one model's opinion.",
    templateId: "investment-debate",
  },
  {
    title: "Researcher",
    label: "Researcher",
    quote: "Don't let one hallucination reach your MD or your client.",
    templateId: "research-writing",
  },
  {
    title: "Founder",
    label: "Founder",
    quote: "Get a second opinion before your investors do.",
    templateId: "startup-gtm",
  },
  {
    title: "Everyday",
    label: "Everyday",
    quote: "Cross-check anything — travel, taxes, big purchases.",
    templateId: null,
  },
];

type Step = { icon: LucideIcon; actor: string; title: string; body: string };

const STEPS: Step[] = [
  { icon: Users, actor: "You", title: "Pick a team", body: "Choose a preset of AI specialists or build your own." },
  { icon: MessageSquare, actor: "You", title: "Ask", body: "Pose your question — attach files or turn on web search." },
  { icon: Scale, actor: "Your AI team", title: "They debate", body: "The models critique and refine each other's answers, round after round, in a live feed." },
  { icon: CheckCircle2, actor: "Your AI team", title: "You get the answer", body: "A synthesized final answer, pinned once the models reach consensus." },
];

export function LandingPage() {
  const navigate = useNavigate();

  const goRegister = () => navigate("/register");
  const goLogin = () => navigate("/login");

  // Stash the chosen team so it's pre-selected after signup, then route to register.
  const startWithTemplate = (templateId: string | null) => {
    if (templateId) {
      localStorage.setItem(PENDING_TEMPLATE_KEY, templateId);
    } else {
      localStorage.removeItem(PENDING_TEMPLATE_KEY);
    }
    navigate("/register");
  };

  const startWithPersona = (persona: Persona) => startWithTemplate(persona.templateId);

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="border-b border-border px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] sm:pt-[calc(env(safe-area-inset-top,0px)+2rem)]">
        <div className="mx-auto flex w-full max-w-[1080px] items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-700 to-violet-400 shadow-md">
              <TeamStoaIcon className="h-5 w-5" />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              Team<span className="text-violet-700">Stoa</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={goLogin}
              className="text-sm text-muted-foreground hover:text-foreground transition px-2"
            >
              Sign in
            </button>
            <Button onClick={goRegister} className="bg-violet-600 hover:bg-violet-700 text-white">
              Start for free
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-[1080px] px-4 pt-16 pb-14 sm:pt-24 sm:pb-20 text-center">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-gradient-to-r from-violet-500/10 via-violet-500/[0.06] to-fuchsia-500/10 py-1.5 pl-1.5 pr-3.5 text-xs font-semibold tracking-wide text-violet-700 shadow-sm shadow-violet-500/10 dark:text-violet-200">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-400 text-white shadow-sm">
              <TeamStoaIcon className="h-3.5 w-3.5" />
            </span>
            Frontier models from OpenAI, Anthropic &amp; Google
          </p>
          <h1 className="font-display mx-auto max-w-[820px] text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            One AI's confident answer isn't a verified one.
          </h1>
          <p className="mx-auto mt-5 max-w-[620px] text-base leading-relaxed text-muted-foreground sm:text-lg">
            Independent AI models argue your question out until only the answer that survives is left
            standing. You watch the debate happen — then keep the answer that holds up.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              onClick={goRegister}
              size="lg"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white sm:w-auto"
            >
              Start for free
            </Button>
            <Button onClick={goLogin} size="lg" variant="secondary" className="w-full sm:w-auto">
              Sign in
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground/70">Free while we launch — no credit card.</p>

          {/* Debate preview placeholder (Section 3) */}
          <div className="mx-auto mt-12 max-w-[860px] overflow-hidden rounded-2xl border border-border bg-[var(--app-surface)] shadow-xl">
            {/* TODO: replace with a 15–20s debate GIF / screenshot once the asset is ready */}
            <img
              src="/landing-debate-preview.png"
              alt="A live TeamStoa debate: AI agents posting critiques into a chatroom feed"
              className="w-full"
              onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
            />
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border bg-gradient-to-b from-violet-500/[0.04] to-transparent">
          <div className="mx-auto w-full max-w-[1080px] px-4 py-20">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-300">
              How it works
            </p>
            <h2 className="mt-2 text-center font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Four steps to an answer that holds up.
            </h2>

            <ol className="relative mt-14 grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-4">
              {/* Connector line (desktop) */}
              <div
                className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent lg:block"
                aria-hidden
              />
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <li key={step.title} className="relative flex flex-col items-center text-center lg:px-2">
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-violet-400 text-white shadow-lg shadow-violet-500/25 ring-4 ring-[var(--bg)]">
                      <Icon className="h-6 w-6" />
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--app-surface)] text-[11px] font-bold text-violet-600 ring-1 ring-violet-400/50 dark:text-violet-300">
                        {i + 1}
                      </span>
                    </div>
                    <span className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-violet-500/70 dark:text-violet-300/70">
                      {step.actor}
                    </span>
                    <h3 className="mt-0.5 text-base font-bold text-foreground">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                  </li>
                );
              })}
            </ol>

            {/* Follow-up & share — the optional loop after you have the answer */}
            <div className="mt-14 flex justify-center">
              <div className="w-full max-w-[560px] rounded-2xl border border-violet-400/40 bg-violet-500/5 px-6 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-300">
                  Then, anytime
                </p>
                <ul className="mt-3 space-y-3">
                  <li className="flex items-start gap-3">
                    <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
                    <span className="text-sm leading-relaxed text-muted-foreground">
                      <strong className="text-foreground">Follow up with the same team</strong> — ask more
                      around the question and the full debate context carries over.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Share2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
                    <span className="text-sm leading-relaxed text-muted-foreground">
                      <strong className="text-foreground">Share the result</strong> — every run gets a
                      permalink anyone can open and replay.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Persona strip */}
        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-[1080px] px-4 py-16 sm:py-20">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Built for the moment you can't afford to be wrong.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Pick where you're starting from.</p>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PERSONAS.map((persona) => (
              <button
                key={persona.title}
                onClick={() => startWithPersona(persona)}
                className="group flex flex-col rounded-2xl border border-border bg-[var(--app-surface)] p-5 text-left shadow-sm transition hover:border-violet-400/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
              >
                <span className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-300">
                  {persona.label}
                </span>
                <p className="mt-3 flex-1 text-base font-medium leading-relaxed text-foreground">
                  &ldquo;{persona.quote}&rdquo;
                </p>
                <span className="mt-4 self-end text-[11px] font-semibold text-violet-500/70 transition group-hover:text-violet-600 dark:text-violet-300/70 dark:group-hover:text-violet-300">
                  Start here →
                </span>
              </button>
            ))}
          </div>

          {/* All ready-made teams */}
          <div className="mt-10 rounded-2xl border border-border bg-[var(--app-surface)]/60 p-5 sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-violet-600 dark:text-violet-300">
              Or pick a team
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TEAM_TEMPLATES.map((t) => {
                const Icon = TEMPLATE_ICONS[t.id];
                return (
                  <button
                    key={t.id}
                    onClick={() => startWithTemplate(t.id)}
                    title={t.description}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[var(--bg)] px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition hover:-translate-y-px hover:border-violet-400 hover:text-violet-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:hover:text-violet-300"
                  >
                    {Icon && <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />}
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
          </div>
        </section>

        {/* Why not just ask one AI? */}
        <section className="border-y border-border bg-[var(--app-surface)]/40">
          <div className="mx-auto w-full max-w-[1080px] px-4 py-16">
            <h2 className="text-center font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Why not just ask one AI?
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2">
              <div className="flex gap-3">
                <Columns2 className="mt-1 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-300" />
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">Comparing isn't checking.</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Most "AI comparison" tools put chatbots side by side and leave the synthesis to
                    you. TeamStoa's models read each other's reasoning, attack the weak points, and
                    defend the strong ones.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Search className="mt-1 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-300" />
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">Most "AI debates" still argue from memory.</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Turn on web search and the team debates over dated, source-linked evidence — not
                    stale training data. Every claim traces back to a source you can open.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <MessageSquare className="mt-1 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-300" />
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">One guess, stated with total confidence.</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    A single model gives you its first answer and moves on. TeamStoa keeps other
                    models challenging it until the weak parts are argued away.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Share2 className="mt-1 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-300" />
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">The whole debate is on the record.</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Every run shows live token and cost usage and gets a permalink, so you can replay
                    exactly how the answer was reached — or share it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing banner */}
        <section className="bg-violet-600">
          <div className="mx-auto w-full max-w-[1080px] px-4 py-14 sm:py-16">
            <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
              Try a debate with frontier models — free.
            </h2>
            <p className="mt-3 text-sm text-violet-100 sm:text-base">
              Sign up and start debating in seconds — free while we launch, no card required.
            </p>
            <Button
              onClick={goRegister}
              size="lg"
              className="mt-6 rounded-full bg-white text-violet-700 hover:bg-violet-50"
            >
              Create free account
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
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
