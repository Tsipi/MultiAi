import { useEffect, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  runs_this_month: number;
  total_runs: number;
  created_at: string | null;
  runs_reset_at: string | null;
}

interface AdminStats {
  total_users: number;
  active_users: number;
  total_runs: number;
}

interface AdminSession {
  session_id: string;
  title: string;
  created_at: string;
  visibility: "private" | "public";
  is_followup: boolean;
}

type Props = { token: string };

function StatusBadge({ active, verified, superuser }: { active: boolean; verified: boolean; superuser: boolean }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {superuser && (
        <span className="rounded-full bg-violet-500/20 text-violet-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          Admin
        </span>
      )}
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
        {active ? "Active" : "Disabled"}
      </span>
      {!verified && (
        <span className="rounded-full bg-amber-500/15 text-amber-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          Unverified
        </span>
      )}
    </div>
  );
}

export function AdminPage({ token }: Props) {
  const authHeaders = { Authorization: `Bearer ${token}` };

  // ─── Users list state ──────────────────────────────────────────────────────
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ─── Sessions panel state ──────────────────────────────────────────────────
  const [sessionsView, setSessionsView] = useState<{ user: AdminUser; sessions: AdminSession[] } | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`, { headers: authHeaders }),
        fetch(`${BASE_URL}/api/admin/stats`, { headers: authHeaders }),
      ]);
      if (!usersRes.ok) throw new Error("Failed to load users.");
      setUsers(await usersRes.json() as AdminUser[]);
      if (statsRes.ok) setStats(await statsRes.json() as AdminStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleUser = async (user: AdminUser) => {
    setActionLoading(user.id + ":toggle");
    const action = user.is_active ? "disable" : "enable";
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/${user.id}/${action}`, {
        method: "PATCH",
        headers: authHeaders,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? "Action failed.");
      }
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const resendVerification = async (user: AdminUser) => {
    setActionLoading(user.id + ":verify");
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/${user.id}/resend-verification`, {
        method: "POST",
        headers: authHeaders,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? "Action failed.");
      }
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const sendResetPassword = async (user: AdminUser) => {
    setActionLoading(user.id + ":reset");
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/${user.id}/send-reset-password`, {
        method: "POST",
        headers: authHeaders,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? "Action failed.");
      }
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const viewSessions = async (user: AdminUser) => {
    setSessionsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/${user.id}/sessions`, { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to load sessions.");
      const sessions = await res.json() as AdminSession[];
      setSessionsView({ user, sessions });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions.");
    } finally {
      setSessionsLoading(false);
    }
  };

  // ─── Sessions panel ────────────────────────────────────────────────────────
  if (sessionsView) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSessionsView(null)}
            className="text-muted-foreground hover:text-foreground transition text-sm"
          >
            ← Back to users
          </button>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground">{sessionsView.user.email}</span>
        </div>

        <div className="rounded-2xl border border-border bg-[var(--app-surface)] overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              Sessions ({sessionsView.sessions.length})
            </h2>
          </div>
          {sessionsView.sessions.length === 0 ? (
            <div className="px-5 py-8 text-sm text-muted-foreground text-center">No sessions found.</div>
          ) : (
            <div className="divide-y divide-border">
              {sessionsView.sessions.map((s) => (
                <div key={s.session_id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{s.title || s.session_id}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(s.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                      {s.is_followup && <span className="ml-2 text-violet-400">follow-up</span>}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${s.visibility === "public" ? "bg-green-500/15 text-green-400" : "bg-muted/40 text-muted-foreground"}`}>
                    {s.visibility}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Users list ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">Admin</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total users", value: stats.total_users },
            { label: "Active users", value: stats.active_users },
            { label: "Total runs", value: stats.total_runs },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-border bg-[var(--app-surface)] p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{value.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* User list */}
      <div className="rounded-2xl border border-border bg-[var(--app-surface)] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex-1">Users</h2>
          <input
            type="text"
            placeholder="Search email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void fetchData(); }}
            className="rounded-lg border border-input bg-[var(--bg)] px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-violet-500 w-48 transition"
          />
          <button
            onClick={() => void fetchData()}
            className="rounded-lg bg-violet-600 hover:bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white transition"
          >
            Search
          </button>
        </div>

        {error && (
          <div className="px-5 py-3 text-sm text-red-400 bg-red-500/10 border-b border-border">{error}</div>
        )}

        {loading ? (
          <div className="px-5 py-8 text-sm text-muted-foreground text-center">Loading…</div>
        ) : users.length === 0 ? (
          <div className="px-5 py-8 text-sm text-muted-foreground text-center">No users found.</div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-5 py-3">
                {/* Avatar initial */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-violet-400 text-xs font-bold">
                  {user.email[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate">{user.email}</span>
                    {user.display_name && (
                      <span className="text-xs text-muted-foreground">({user.display_name})</span>
                    )}
                  </div>
                  <div className="mt-1">
                    <StatusBadge active={user.is_active} verified={user.is_verified} superuser={user.is_superuser} />
                  </div>
                </div>

                {/* Runs */}
                <div className="shrink-0 text-right hidden sm:block">
                  <div className="text-sm font-semibold text-foreground">{user.total_runs}</div>
                  <div className="text-[10px] text-muted-foreground">total runs</div>
                  <div className="text-[10px] text-muted-foreground/60">{user.runs_this_month} this mo.</div>
                </div>

                {/* Actions */}
                <div className="shrink-0 flex flex-col gap-1">
                  {!user.is_superuser && (
                    <button
                      onClick={() => void toggleUser(user)}
                      disabled={actionLoading === user.id + ":toggle"}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                        user.is_active
                          ? "border border-red-500/30 text-red-400 hover:bg-red-500/10"
                          : "border border-green-500/30 text-green-400 hover:bg-green-500/10"
                      }`}
                    >
                      {actionLoading === user.id + ":toggle" ? "…" : user.is_active ? "Disable" : "Enable"}
                    </button>
                  )}
                  {!user.is_superuser && !user.is_verified && (
                    <button
                      onClick={() => void resendVerification(user)}
                      disabled={actionLoading === user.id + ":verify"}
                      className="rounded-lg px-3 py-1 text-xs font-semibold border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition disabled:opacity-50"
                    >
                      {actionLoading === user.id + ":verify" ? "…" : "Resend verify"}
                    </button>
                  )}
                  {!user.is_superuser && (
                    <button
                      onClick={() => void sendResetPassword(user)}
                      disabled={actionLoading === user.id + ":reset"}
                      className="rounded-lg px-3 py-1 text-xs font-semibold border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition disabled:opacity-50"
                    >
                      {actionLoading === user.id + ":reset" ? "…" : "Reset pw"}
                    </button>
                  )}
                  <button
                    onClick={() => { void viewSessions(user); }}
                    disabled={sessionsLoading}
                    className="rounded-lg px-3 py-1 text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition disabled:opacity-50"
                  >
                    Sessions
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
