import ReactMarkdown from "react-markdown";

type Props = { content: string };

export function MarkdownView({ content }: Props) {
  return (
    <div className="md-prose border border-border rounded-lg px-5 py-4 max-w-[78ch] mx-auto bg-card/90 text-[0.95rem] leading-relaxed">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
