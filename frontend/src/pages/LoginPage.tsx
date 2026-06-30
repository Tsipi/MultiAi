import { TeamStoaIcon } from "@/components/layout/TeamStoaIcon";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string) => Promise<void>;
};

export function LoginPage({ onLogin, onRegister }: Props) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await onLogin(email, password);
      } else {
        await onRegister(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-700 to-violet-400 font-display text-[13px] font-bold text-white shadow-md select-none"
                aria-hidden
              >
                <TeamStoaIcon className="h-8 w-8" />
              </div>
          <div>
            <div className="font-bold text-lg tracking-tight text-foreground">Team<span className="font-display font-bold text-base sm:text-lg tracking-tight text-foreground text-violet-700">Stoa</span></div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Your AI decision council</div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-[var(--app-surface)] p-6 shadow-xl">
          <h1 className="text-lg font-semibold text-foreground mb-1">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "login"
              ? "Sign in to access your AI debate sessions."
              : "Register to start your first AI consensus run."}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-lg border border-input bg-[var(--bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Password
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-xs text-violet-400 hover:text-violet-300 transition"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                No account?{" "}
                <button
                  className="text-violet-400 hover:text-violet-300 font-medium transition"
                  onClick={() => { setMode("register"); setError(""); }}
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  className="text-violet-400 hover:text-violet-300 font-medium transition"
                  onClick={() => { setMode("login"); setError(""); }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} TeamStoa. All rights reserved.
        </p>
      </div>
    </div>
  );
}
