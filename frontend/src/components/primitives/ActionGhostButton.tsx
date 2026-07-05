import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

/** Shared light-purple action button used across advanced/main controls. */
export function ActionGhostButton({ children, icon, disabled, onClick, className }: Props) {
  return (
    <Button    
      type="button"
      size="sm"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "border bg-violet-500/12 font-display text-violet-700 shadow-none min-h-[44px]",
        "hover:bg-violet-500/20 hover:text-violet-800 dark:text-violet-200",
        className
      )}
    >
      {icon ? <span className="mr-1.5 inline-flex">{icon}</span> : null}
      {children}
    </Button>
  );
}
