import { TeamStoaIcon } from "@/components/layout/TeamStoaIcon";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show success — never reveal whether the email exists
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-700 to-violet-400 font-display text-[13px] font-bold text-white shadow-md select-none" aria-hidden>
            <TeamStoaIcon className="h-8 w-8" />            
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight text-foreground">Team<span className="font-display font-bold text-base sm:text-lg tracking-tight text-foreground text-violet-700">Stoa</span></div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Your AI decision council</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-[var(--app-surface)] p-6 shadow-xl">
          {sent ? (
            <div className="text-center py-2">
              <div className="text-3xl mb-3">✉️</div>
              <h1 className="text-lg font-semibold text-foreground mb-2">Check your email</h1>
              <p className="text-sm text-muted-foreground mb-6">
                If <span className="text-foreground font-medium">{email}</span> is registered, we sent
                a password reset link. It expires in 1 hour.
              </p>
              <button
                onClick={() => navigate("/")}
                className="text-sm text-violet-400 hover:text-violet-300 transition font-medium"
              >
                ← Back to sign in
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-foreground mb-1">Reset your password</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="rounded-lg border border-input bg-[var(--bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white transition shadow-sm"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button
                  onClick={() => navigate("/")}
                  className="text-sm text-muted-foreground hover:text-foreground transition"
                >
                  ← Back to sign in
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
