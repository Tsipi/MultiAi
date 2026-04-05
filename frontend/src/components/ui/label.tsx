import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "flex flex-col gap-1.5 text-sm font-semibold text-foreground/85",
        className
      )}
      {...props}
    />
  );
}
