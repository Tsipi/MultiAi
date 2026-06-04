import { Moon, Plus, Sun, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  dark: boolean;
  onToggleDark: () => void;
  onNewRun: () => void;
  onOpenTemplates: () => void;
};

function BrandMark() {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 font-display text-[13px] font-bold text-white shadow-md"
      aria-hidden
    >
      M
    </div>
  );
}

export function TopNav({ dark, onToggleDark, onNewRun, onOpenTemplates }: Props) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#ffffff08] bg-[var(--v2-surface)]/92 backdrop-blur-xl">
      <div className="flex h-14 w-full max-w-[1600px] mx-auto items-center justify-between gap-3 px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <BrandMark />
          <div className="flex min-w-0 flex-col gap-0">
            <span className="font-display truncate font-bold text-base sm:text-lg tracking-tight text-foreground select-none">
              MultiAI
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:block truncate">
              Command your AI team
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onNewRun}
            className="gap-1.5 font-display text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
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
            className="gap-1.5 font-display text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Templates</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="font-display text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            About
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="font-display text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Contact us
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[#ffffff12] bg-transparent font-display text-xs font-semibold"
          >
            Login/Logout
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
        </div>
      </div>
    </header>
  );
}
