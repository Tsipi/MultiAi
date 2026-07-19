import { TeamStoaIcon } from "@/components/layout/TeamStoaIcon";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { getApiBaseUrl } from "@/lib/apiBaseUrl";
import { Check } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? "Reset failed. The link may have expired.");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-[var(--app-surface)] p-6 shadow-xl text-center">
          <p className="text-sm text-red-400 mb-4">Invalid or missing reset token.</p>
          <button onClick={() => navigate("/forgot-password")} className="text-sm text-violet-400 hover:text-violet-300">
            Request a new link
          </button>
        </div>
      </div>
    );
  }

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

        <div className="rounded-2xl border border-border bg-[var(--app-surface)] p-6 shadow-xl">
          {done ? (
            <div className="text-center py-2">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-700 to-violet-400 shadow-md">
                <Check className="h-7 w-7 text-white" strokeWidth={3} />
              </div>
              <h1 className="text-lg font-semibold text-foreground mb-2">Password updated</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Your password has been changed. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate("/")}
                className="rounded-lg bg-violet-600 hover:bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition shadow-sm"
              >
                Sign in
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-foreground mb-1">Choose a new password</h1>
              <p className="text-sm text-muted-foreground mb-6">Minimum 8 characters.</p>

              <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    New password
                  </label>
                  <PasswordInput
                    required
                    autoComplete="new-password"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="rounded-lg border border-input bg-[var(--bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Confirm password
                  </label>
                  <PasswordInput
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="rounded-lg border border-input bg-[var(--bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition w-full"
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
                  {loading ? "Saving…" : "Set new password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
