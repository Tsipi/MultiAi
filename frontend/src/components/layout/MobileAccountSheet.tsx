import { LogOut, Moon, Settings, Shield, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import type { UserProfile } from "@/hooks/useAuth";

type Props = {
  userProfile: UserProfile;
  dark: boolean;
  isAdmin: boolean;
  onToggleDark: () => void;
  onLogout: () => void;
  onClose: () => void;
};

export function MobileAccountSheet({
  userProfile,
  dark,
  isAdmin,
  onToggleDark,
  onLogout,
  onClose,
}: Props) {
  const navigate = useNavigate();
  const initial = (userProfile.display_name ?? userProfile.email).charAt(0).toUpperCase();
  const displayName = userProfile.display_name ?? userProfile.email.split("@")[0];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const goTo = (path: string) => {
    onClose();
    navigate(path);
  };

  const usagePct =
    userProfile.runs_quota
      ? Math.min(100, (userProfile.runs_this_month / userProfile.runs_quota) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-[200] md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-[var(--app-surface)] shadow-2xl pb-safe"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Identity */}
        <div className="flex items-center gap-3 border-b border-border px-4 pb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-700 text-base font-bold text-white shadow-sm">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="font-display m-0 text-sm font-semibold text-foreground truncate">
              {displayName}
            </p>
            <p className="m-0 text-xs text-muted-foreground truncate">{userProfile.email}</p>
          </div>
        </div>

        {/* Usage quota */}
        {userProfile.runs_quota !== null && (
          <div className="border-b border-border px-4 py-3">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Runs this month</span>
              <span className="font-medium text-foreground">
                {userProfile.runs_this_month} / {userProfile.runs_quota}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-violet-600 transition-all"
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col py-2">
          <button
            type="button"
            onClick={() => goTo("/settings")}
            className="flex min-h-[44px] items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted/40 transition-colors"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            Settings
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => goTo("/admin")}
              className="flex min-h-[44px] items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted/40 transition-colors"
            >
              <Shield className="h-4 w-4 text-violet-400" />
              Admin
            </button>
          )}

          <button
            type="button"
            onClick={onToggleDark}
            className="flex min-h-[44px] items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted/40 transition-colors"
          >
            {dark ? (
              <Sun className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground" />
            )}
            {dark ? "Switch to light mode" : "Switch to dark mode"}
          </button>

          <div className="mx-4 border-t border-border" />

          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="flex min-h-[44px] items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
