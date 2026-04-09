import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "v2-field-focus w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground font-normal",
        "placeholder:text-muted-foreground placeholder:italic",
        "outline-none transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}
