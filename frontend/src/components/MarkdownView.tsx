import ReactMarkdown from "react-markdown";

type Props = { content: string };

export function MarkdownView({ content }: Props) {
  return (
    <div className="md-view">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
