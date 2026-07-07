import { Link } from "react-router-dom";
import { TeamStoaIcon } from "@/components/layout/TeamStoaIcon";

export function PrivacyPage() {
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
            <Link to="/about" className="hover:text-foreground transition">About</Link>
            <Link to="/terms" className="hover:text-foreground transition">Terms</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[780px] flex-1 px-4 py-10 pb-safe">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-foreground">

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">What we collect</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When you create an account we store your <strong>email address</strong> and a
              securely hashed version of your <strong>password</strong> — the plain-text password
              is never stored. When you run a debate, we store the <strong>question you asked</strong>,
              the <strong>AI-generated responses</strong>, team configuration, and basic
              <strong> usage statistics</strong> (number of runs this month).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">How it is stored</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All data is stored in a PostgreSQL database hosted on Railway. Data is encrypted at
              rest and in transit. We do not store your data in any country other than the one
              Railway uses for your deployment region.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Third-party AI providers</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your questions and debate context are sent to AI model providers via
              <strong> OpenRouter</strong> in order to generate responses. This is the core function
              of the product. OpenRouter routes requests to providers such as OpenAI, Anthropic,
              Google, and DeepSeek. By using TeamStoa you acknowledge that your question text is
              transmitted to these providers. We do not send your email address or account details
              to AI providers.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Browser storage</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We store a <strong>JWT authentication token</strong> in your browser's localStorage
              so you stay logged in across sessions. We also store your dark/light mode preference
              and recent team cast selections locally in your browser. None of this data is sent
              to any third party.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Cookies and tracking</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We do not use advertising cookies, tracking pixels, or third-party analytics scripts.
              We do not track you across other websites. We do not sell your data to anyone.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Public sharing</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you choose to share a debate run, it becomes accessible to anyone with the link.
              Shared runs include the question, AI responses, and team configuration. You can
              unshare a run at any time from your session history, which immediately removes
              public access.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Your rights</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You can request deletion of your account and all associated data at any time by
              emailing us at the address below. We will process deletion requests within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Changes to this policy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may update this policy as the product evolves. We will update the date at the top
              of this page when changes are made. Continued use of TeamStoa after a policy update
              constitutes acceptance of the new policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Questions or data requests: <a href="mailto:hello@teamstoa.com" className="text-violet-600 dark:text-violet-400 underline hover:opacity-80 transition">hello@teamstoa.com</a>
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
