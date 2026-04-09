type Props = {
  title: string;
  body: string;
  onClose: () => void;
};

export function AgentTileModal({ title, body, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[80vh] overflow-auto rounded-2xl border border-[#ffffff12] bg-[var(--v2-elevated)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-base font-semibold m-0 mb-2">{title}</p>
        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap m-0">{body}</p>
        <button
          type="button"
          className="mt-4 text-sm font-medium text-violet-400 hover:text-violet-300 bg-transparent border-0 cursor-pointer p-0"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
