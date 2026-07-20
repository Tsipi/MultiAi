import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type Props = { content: string; className?: string };

function cleanMarkdown(raw: string): string {
  return raw
    .replace(/^[ \t]*[-*+][ \t]*$/gm, "")   // remove genuinely empty unordered bullet lines
    .replace(/\n{3,}/g, "\n\n")             // collapse excess blank lines
    .trim();
}

export function MarkdownView({ content, className }: Props) {
  const cleaned = cleanMarkdown(content);
  return (
    <div
      className={cn(
        "md-prose border border-border/55 rounded-lg px-5 py-4 max-w-[78ch] mx-auto bg-card/90 text-[0.95rem] leading-relaxed prose-headings:font-semibold prose-h2:text-base prose-h3:text-sm prose-strong:font-bold prose-strong:text-foreground prose-li:marker:text-muted-foreground",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{          h1: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-1.5 text-foreground">{children}</h2>,
          h2: ({ children }) => <h3 className="text-[0.95rem] font-semibold mt-2.5 mb-1 text-foreground">{children}</h3>,
          h3: ({ children }) => <h4 className="text-sm font-semibold mt-2 mb-0.5 text-foreground">{children}</h4>,
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
          ul: ({ children }) => <ul className="list-disc list-outside pl-5 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside pl-5 space-y-2">{children}</ol>,
          li: ({ children }) => <li className="text-sm leading-relaxed pl-1">{children}</li>,
          p: ({ children }) => <p className="mb-2 text-sm leading-relaxed">{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-border/55">{children}</tr>,
          th: ({ children }) => (
            <th className="border border-border/55 px-3 py-1.5 text-left font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border/55 px-3 py-1.5 align-top text-foreground/90">
              {children}
            </td>
          ),
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
