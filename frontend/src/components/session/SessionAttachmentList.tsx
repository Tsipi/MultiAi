import { FileText } from "lucide-react";
import type { AttachmentFileRef } from "@/types";

type Props = { files: AttachmentFileRef[] };

/** Distinct, clickable list of user-uploaded files under question bubble. */
export function SessionAttachmentList({ files }: Props) {
  if (!files.length) return null;
  return (
    <div className="mt-3 border-t border-violet-500/15 pt-3">
      <p className="font-display m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
        Additional files
      </p>
      <ul className="m-0 list-none space-y-1.5 p-0">
        {files.map((f, i) => (
          <li key={`${f.name}-${i}`}>
            <button
              type="button"
              onClick={() => f.data && window.open(f.data, "_blank", "noopener,noreferrer")}
              disabled={!f.data}
              className="inline-flex w-full items-center gap-2 rounded-lg border border-violet-400/25 bg-violet-500/[0.07] px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-violet-500/[0.12] disabled:cursor-default disabled:opacity-75"
              title={f.data ? `Open ${f.name}` : `${f.name} (no preview available)`}
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-violet-700 dark:text-violet-300" />
              <span className="shrink-0 font-semibold uppercase text-muted-foreground">{f.kind || "file"}</span>
              <span className="min-w-0 truncate underline decoration-violet-400/60 underline-offset-2">
                {f.name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
