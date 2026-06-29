import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { UserProfile } from "@/hooks/useAuth";

type Props = {
  userProfile: UserProfile;
  onUpdateProfile: (fields: { display_name?: string }) => Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onLogout: () => void;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-[var(--app-surface)] p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4 last:mb-0">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

export function SettingsPage({ userProfile, onUpdateProfile, onChangePassword, onLogout }: Props) {
  const navigate = useNavigate();

  // — Account section
  const [displayName, setDisplayName] = useState(userProfile.display_name ?? "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState("");

  // — Password section
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  const saveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameLoading(true);
    setNameMsg("");
    try {
      await onUpdateProfile({ display_name: displayName.trim() || null as unknown as string });
      setNameMsg("Name saved.");
    } catch {
      setNameMsg("Failed to save.");
    } finally {
      setNameLoading(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwMsg("");
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    if (newPw.length < 8) { setPwError("Password must be at least 8 characters."); return; }
    setPwLoading(true);
    try {
      await onChangePassword(currentPw, newPw);
      setPwMsg("Password changed.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  };

  const quota = userProfile.runs_quota;
  const runsUsed = userProfile.runs_this_month;
  const quotaPct = quota ? Math.min(100, Math.round((runsUsed / quota) * 100)) : 0;

  const joinedDate = userProfile.created_at
    ? new Date(userProfile.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-[var(--app-surface)]/92 backdrop-blur-xl">
        <div className="flex h-14 max-w-2xl mx-auto items-center gap-3 px-4">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground transition text-sm"
          >
            ← Back
          </button>
          <span className="font-semibold text-foreground">Settings</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-5">

        {/* Account */}
        <Section title="Account">
          <Field label="Email">
            <p className="text-sm text-foreground py-2">{userProfile.email}</p>
          </Field>
          {joinedDate && (
            <Field label="Member since">
              <p className="text-sm text-foreground py-2">{joinedDate}</p>
            </Field>
          )}
          <form onSubmit={(e) => { void saveDisplayName(e); }}>
            <Field label="Display name">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={64}
                className="rounded-lg border border-input bg-[var(--bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
              />
            </Field>
            {nameMsg && (
              <p className="text-xs text-violet-400 mb-3">{nameMsg}</p>
            )}
            <button
              type="submit"
              disabled={nameLoading}
              className="rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white transition"
            >
              {nameLoading ? "Saving…" : "Save name"}
            </button>
          </form>
        </Section>

        {/* Usage */}
        {quota !== null && (
          <Section title="Usage">
            <div className="flex items-end justify-between mb-2">
              <p className="text-sm text-foreground">
                <span className="font-semibold">{runsUsed}</span>
                <span className="text-muted-foreground"> / {quota} runs this month</span>
              </p>
              <span className="text-xs text-muted-foreground">{quotaPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-600 transition-all"
                style={{ width: `${quotaPct}%` }}
              />
            </div>
            {runsUsed >= quota && (
              <p className="mt-3 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                Monthly limit reached. Upgrade to Pro for unlimited runs.
              </p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              All-time runs: <span className="text-foreground font-medium">{userProfile.total_runs}</span>
            </p>
          </Section>
        )}

        {/* Change password */}
        <Section title="Security">
          <form onSubmit={(e) => { void savePassword(e); }} className="flex flex-col gap-4">
            <Field label="Current password">
              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="••••••••"
                className="rounded-lg border border-input bg-[var(--bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
              />
            </Field>
            <Field label="New password">
              <input
                type="password"
                required
                autoComplete="new-password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="••••••••"
                className="rounded-lg border border-input bg-[var(--bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
              />
            </Field>
            <Field label="Confirm new password">
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="••••••••"
                className="rounded-lg border border-input bg-[var(--bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
              />
            </Field>
            {pwError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {pwError}
              </p>
            )}
            {pwMsg && <p className="text-xs text-violet-400">{pwMsg}</p>}
            <button
              type="submit"
              disabled={pwLoading}
              className="rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white transition w-fit"
            >
              {pwLoading ? "Saving…" : "Change password"}
            </button>
          </form>
        </Section>

        {/* Sign out */}
        <Section title="Session">
          <p className="text-sm text-muted-foreground mb-4">
            Signed in as <span className="text-foreground">{userProfile.email}</span>
          </p>
          <button
            onClick={onLogout}
            className="rounded-lg border border-border hover:border-red-500/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-red-400 transition"
          >
            Sign out
          </button>
        </Section>

      </div>
    </div>
  );
}
