import { useState } from "react";

type Props = {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string) => Promise<void>;
};

export function LoginPage({ onLogin, onRegister }: Props) {
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 font-bold text-white text-sm shadow-md">
            M
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight text-foreground">MultiAI</div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Command your AI team</div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#ffffff12] bg-[var(--app-surface)] p-6 shadow-xl">
          <h1 className="text-lg font-semibold text-foreground mb-1">
            {mode === "login" ? "Welcome back" : "Create account"}
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
                className="rounded-lg border border-[#ffffff18] bg-[var(--bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-lg border border-[#ffffff18] bg-[var(--bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
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
      </div>
    </div>
  );
}
