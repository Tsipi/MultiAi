import { useState } from "react";
import type { UserPreferences, UserProfile } from "@/hooks/useAuth";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { TEAM_TEMPLATES } from "@/data/templates";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type Props = {
  userProfile: UserProfile;
  token: string;
  onUpdateProfile: (fields: { display_name?: string }) => Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onSavePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
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

const inputCls = "rounded-lg border border-input bg-[var(--bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition";

export function SettingsPage({ userProfile, token, onUpdateProfile, onChangePassword, onSavePreferences, onLogout }: Props) {
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

  // — Preferences section
  const [prefAnswerMode, setPrefAnswerMode] = useState(userProfile.pref_answer_mode ?? "none");
  const [prefWebResearch, setPrefWebResearch] = useState(userProfile.pref_web_research_mode ?? "none");
  const [prefTemplate, setPrefTemplate] = useState(userProfile.pref_team_template ?? "none");
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState("");

  // — Export / delete section
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // — Derived
  const quota = userProfile.runs_quota;
  const runsUsed = userProfile.runs_this_month;
  const quotaPct = quota ? Math.min(100, Math.round((runsUsed / quota) * 100)) : 0;
  const joinedDate = userProfile.created_at
    ? new Date(userProfile.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

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

  const savePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrefsLoading(true);
    setPrefsMsg("");
    try {
      await onSavePreferences({
        pref_answer_mode: prefAnswerMode === "none" ? null : prefAnswerMode,
        pref_web_research_mode: prefWebResearch === "none" ? null : prefWebResearch,
        pref_team_template: prefTemplate === "none" ? null : prefTemplate,
      });
      setPrefsMsg("Preferences saved.");
    } catch {
      setPrefsMsg("Failed to save.");
    } finally {
      setPrefsLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    setExportError("");
    try {
      const res = await fetch(`${BASE_URL}/api/account/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `teamstoa-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Export failed. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE") return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(`${BASE_URL}/api/account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed.");
      onLogout();
    } catch {
      setDeleteError("Failed to delete account. Please try again.");
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-5">
      <h1 className="text-xl font-bold text-foreground">Settings</h1>

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
              className={inputCls}
            />
          </Field>
          {nameMsg && <p className="text-xs text-violet-400 mb-3">{nameMsg}</p>}
          <button
            type="submit"
            disabled={nameLoading}
            className="rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white transition"
          >
            {nameLoading ? "Saving…" : "Save name"}
          </button>
        </form>
      </Section>

      {/* Preferences */}
      <Section title="Preferences">
        <form onSubmit={(e) => { void savePreferences(e); }} className="flex flex-col gap-4">
          <Field label="Default answer mode">
            <Select value={prefAnswerMode} onValueChange={setPrefAnswerMode}>
              <SelectTrigger>
                <span className="truncate">
                  {prefAnswerMode === "balanced" ? "Balanced" : prefAnswerMode === "concise" ? "Concise" : prefAnswerMode === "detailed" ? "Detailed" : "No preference"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No preference</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Default web research">
            <Select value={prefWebResearch} onValueChange={setPrefWebResearch}>
              <SelectTrigger>
                <span className="truncate">
                  {prefWebResearch === "auto" ? "Auto" : prefWebResearch === "on" ? "Always on" : prefWebResearch === "off" ? "Always off" : "No preference"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No preference</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="on">Always on</SelectItem>
                <SelectItem value="off">Always off</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Default team template">
            <Select value={prefTemplate} onValueChange={setPrefTemplate}>
              <SelectTrigger>
                <span className="truncate">
                  {TEAM_TEMPLATES.find((t) => t.id === prefTemplate)?.name ?? "No preference"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No preference</SelectItem>
                {TEAM_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {prefsMsg && <p className="text-xs text-violet-400">{prefsMsg}</p>}
          <button
            type="submit"
            disabled={prefsLoading}
            className="rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white transition w-fit"
          >
            {prefsLoading ? "Saving…" : "Save preferences"}
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
            <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${quotaPct}%` }} />
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

      {/* Security */}
      <Section title="Security">
        <form onSubmit={(e) => { void savePassword(e); }} className="flex flex-col gap-4">
          <Field label="Current password">
            <PasswordInput
              required
              autoComplete="current-password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Enter current password"
              className={`${inputCls} w-full`}
            />
          </Field>
          <Field label="New password">
            <PasswordInput
              required
              autoComplete="new-password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Enter new password"
              className={`${inputCls} w-full`}
            />
          </Field>
          <Field label="Confirm new password">
            <PasswordInput
              required
              autoComplete="new-password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Confirm new password"
              className={`${inputCls} w-full`}
            />
          </Field>
          {pwError && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{pwError}</p>
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

      {/* Data */}
      <Section title="Data">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Download all your sessions and account data as a JSON file.
            </p>
            {exportError && <p className="text-xs text-red-400 mb-2">{exportError}</p>}
            <button
              onClick={() => { void handleExport(); }}
              disabled={exportLoading}
              className="rounded-lg border border-border hover:border-violet-500/40 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-violet-400 transition disabled:opacity-60"
            >
              {exportLoading ? "Exporting…" : "Export my data"}
            </button>
          </div>

          <div className="border-t border-border pt-5">
            <p className="text-sm font-semibold text-red-400 mb-1">Danger zone</p>
            <p className="text-sm text-muted-foreground mb-3">
              Permanently delete your account and all associated sessions. This cannot be undone.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition"
              >
                Delete my account
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  placeholder="DELETE"
                  className={`${inputCls} max-w-[200px]`}
                />
                {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => { void handleDeleteAccount(); }}
                    disabled={deleteText !== "DELETE" || deleteLoading}
                    className="rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition"
                  >
                    {deleteLoading ? "Deleting…" : "Confirm deletion"}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteText(""); setDeleteError(""); }}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Session */}
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
  );
}
