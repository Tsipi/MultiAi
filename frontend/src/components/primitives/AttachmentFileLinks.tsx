import type { AttachmentFileRef } from "../../types";

type Props = {
  files: AttachmentFileRef[];
  /** `embedded`: list only, for use inside a table cell (label is outside). */
  variant?: "default" | "embedded";
};

function kindLabel(kind: string) {
  if (kind === "pdf") return "PDF";
  if (kind === "image") return "Image";
  if (kind === "text") return "Text";
  if (kind === "file") return "File";
  return kind || "File";
}

/**
 * Lists attachments as bullets; links open data URLs in a new tab when stored.
 */
export function AttachmentFileLinks({ files, variant = "default" }: Props) {
  if (!files.length) return null;
  const anyLink = files.some((f) => Boolean(f.data?.trim()));
  const embedded = variant === "embedded";

  const list = (
    <ul
      className={
        embedded
          ? "list-disc list-outside pl-4 m-0 space-y-1 text-sm marker:text-primary"
          : "list-disc list-outside pl-5 m-0 space-y-1.5 text-sm marker:text-primary"
      }
    >
      {files.map((f, idx) => (
        <li key={`${f.name}-${idx}`} className="leading-snug pl-0.5">
          {f.data?.trim() ? (
            <a
              href={f.data}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold underline-offset-2 hover:underline"
            >
              {f.name || "Attachment"}
            </a>
          ) : (
            <span className="font-semibold text-foreground/90">{f.name || "Attachment"}</span>
          )}
          <span className="text-[0.72rem] text-muted-foreground font-normal"> ({kindLabel(f.kind)})</span>
        </li>
      ))}
    </ul>
  );

  if (embedded) {
    return (
      <div className="grid gap-1.5">
        {!anyLink && (
          <p className="text-[0.7rem] text-muted-foreground m-0 leading-snug">
            Names only for this saved run; new runs include open-in-tab links.
          </p>
        )}
        {list}
      </div>
    );
  }

  return (
    <div className="grid gap-2 pt-2">
      <span className="text-[0.72rem] font-semibold uppercase tracking-wider text-foreground/75">
        Attached files
      </span>
      {!anyLink && (
        <p className="text-[0.7rem] text-muted-foreground m-0 leading-snug">
          Names only for this saved run; new consultations include open-in-tab links.
        </p>
      )}
      {list}
    </div>
  );
}
