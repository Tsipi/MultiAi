import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onNewRun: () => void;
  dark: boolean;
  onToggleDark: () => void;
};

export function TopNav({ onNewRun, dark, onToggleDark }: Props) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-card/75 backdrop-blur-xl">
      <div className="flex h-14 w-full max-w-[1600px] mx-auto items-center justify-between px-5">
        <span className="bg-gradient-to-br from-blue-500 to-emerald-400 bg-clip-text text-transparent font-bold text-lg tracking-tight select-none">
          MultiAi
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onToggleDark} aria-label="Toggle dark mode">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={onNewRun}>
            New Run
          </Button>
        </div>
      </div>
    </header>
  );
}
