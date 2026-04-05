import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type Props = { content: string; className?: string };

export function MarkdownView({ content, className }: Props) {
  return (
    <div
      className={cn(
        "md-prose border border-border/55 rounded-lg px-5 py-4 max-w-[78ch] mx-auto bg-card/90 text-[0.95rem] leading-relaxed",
        className
      )}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
