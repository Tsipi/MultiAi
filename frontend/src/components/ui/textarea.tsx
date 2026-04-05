import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground leading-relaxed",
        "placeholder:text-muted-foreground placeholder:italic",
        "outline-none transition-colors resize-vertical min-h-[118px]",
        "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}
