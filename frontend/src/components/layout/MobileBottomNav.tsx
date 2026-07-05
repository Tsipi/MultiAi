import { Clock, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/hooks/useAuth";

type Props = {
  activeSheet: "sessions" | "account" | null;
  onToggleSessions: () => void;
  onNewRun: () => void;
  onToggleAccount: () => void;
  userProfile: UserProfile | null;
};

export function MobileBottomNav({
  activeSheet,
  onToggleSessions,
  onNewRun,
  onToggleAccount,
  userProfile,
}: Props) {
  const initial = userProfile
    ? (userProfile.display_name ?? userProfile.email).charAt(0).toUpperCase()
    : null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] bg-[var(--app-surface)]/96 backdrop-blur-xl border-t border-border md:hidden"
      aria-label="Mobile navigation"
    >
      {/* Button row — always exactly h-16, never stretched by safe-area padding */}
      <div className="flex h-16 items-stretch">
      {/* Sessions tab */}
      <button
        type="button"
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-1 px-2 transition-colors",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-[-2px]",
          activeSheet === "sessions"
            ? "text-violet-600"
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={onToggleSessions}
        aria-label="View saved sessions"
        aria-pressed={activeSheet === "sessions"}
      >
        <Clock className="h-5 w-5" />
        <span className="text-[10px] font-medium tracking-wide">Sessions</span>
      </button>

      {/* New Run — center FAB lifted above the bar */}
      <div className="flex flex-1 items-center justify-center">
        <button
          type="button"
          className="relative -top-3 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[var(--app-surface)] bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-lg shadow-violet-600/35 transition-all hover:scale-105 hover:shadow-violet-600/50 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300 focus-visible:outline-offset-2"
          onClick={onNewRun}
          aria-label="Start a new run"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Account tab */}
      <button
        type="button"
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-1 px-2 transition-colors",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-[-2px]",
          activeSheet === "account"
            ? "text-violet-600"
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={onToggleAccount}
        aria-label="Account and settings"
        aria-pressed={activeSheet === "account"}
      >
        {initial ? (
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
              activeSheet === "account"
                ? "bg-violet-600 text-white"
                : "bg-muted text-foreground"
            )}
          >
            {initial}
          </div>
        ) : (
          <User className="h-5 w-5" />
        )}
        <span className="text-[10px] font-medium tracking-wide">Account</span>
      </button>
      </div>
      {/* Safe-area spacer — fills the gap on notched devices without stretching buttons */}
      <div className="h-safe-bottom" />
    </nav>
  );
}
