import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Plus, Settings, Shield, Sun, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/hooks/useAuth";
import { TemplateShortcutRow } from "../team";
import { TeamStoaIcon } from "./TeamStoaIcon";

type Props = {
  dark: boolean;
  onToggleDark: () => void;
  onNewRun: () => void;
  onOpenTemplates: () => void;
  userProfile: UserProfile | null;
  onLogout: () => void;
};

function BrandMark() {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-700 to-violet-400 font-display text-[13px] font-bold text-white shadow-md select-none"
      aria-hidden
    >
      <TeamStoaIcon className="h-8 w-8" />
    </div>
  );
}

function UserMenu({ userProfile, onLogout }: { userProfile: UserProfile; onLogout: () => void }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const initial = (userProfile.display_name ?? userProfile.email).charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition shadow-sm"
        aria-label="Open user menu"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-border bg-[var(--app-surface)] shadow-2xl py-1 overflow-hidden">
          {/* Identity */}
          <div className="px-3 py-2.5 border-b border-border">
            <p className="text-xs font-medium text-foreground truncate">
              {userProfile.display_name ?? userProfile.email.split("@")[0]}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{userProfile.email}</p>
          </div>

          {/* Usage */}
          {userProfile.runs_quota !== null && (
            <div className="px-3 py-2 border-b border-border">
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                <span>Runs this month</span>
                <span>{userProfile.runs_this_month} / {userProfile.runs_quota}</span>
              </div>
              <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-600"
                  style={{ width: `${Math.min(100, (userProfile.runs_this_month / userProfile.runs_quota) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <button
            onClick={() => { setOpen(false); navigate("/settings"); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/40 transition"
          >
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            Settings
          </button>

          {userProfile.is_superuser && (
            <button
              onClick={() => { setOpen(false); navigate("/admin"); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/40 transition"
            >
              <Shield className="h-3.5 w-3.5 text-violet-400" />
              Admin
            </button>
          )}

          <div className="border-t border-border mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TopNav({ dark, onToggleDark, onNewRun, onOpenTemplates, userProfile, onLogout }: Props) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#ffffff08] bg-[var(--app-surface)]/92 backdrop-blur-xl pt-safe">
      <div className="flex h-14 w-full max-w-[1600px] mx-auto items-center justify-between gap-3 px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <BrandMark />
          <div className="flex min-w-0 flex-col gap-0">
            <span className="font-display truncate font-bold text-base sm:text-lg tracking-tight text-foreground select-none">
              Team<span className="font-display font-bold text-base sm:text-lg tracking-tight text-foreground text-violet-700">Stoa</span>
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:block truncate">
              Your AI decision council
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onNewRun}
            className="hidden md:inline-flex gap-1.5 font-display text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
            aria-label="Start a new run"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Run</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onOpenTemplates}
            className="hidden md:inline-flex gap-1.5 font-display text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Templates</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleDark}
            aria-label="Toggle theme"
            className="text-muted-foreground hover:text-foreground"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {userProfile && (
            <div className="hidden md:block">
              <UserMenu userProfile={userProfile} onLogout={onLogout} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
