import type { AttachmentFileRef } from "../types";
import { AttachmentFileLinks } from "./AttachmentFileLinks";

type Props = {
  role: string;
  prompt: string;
  files: AttachmentFileRef[];
};

const th =
  "align-top w-[min(30%,152px)] px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-foreground/85 border-r border-border/55 bg-muted/30";
const td = "px-3 py-2.5 text-foreground leading-relaxed min-w-0";

/**
 * Two-column table: field labels vs content for role, prompt, and attachments.
 */
export function PromptContextTable({ role, prompt, files }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/65 bg-card/40">
      <table className="w-full text-sm border-collapse">
        <tbody>
          <tr className="border-b border-border/55">
            <th scope="row" className={th}>
              Role
            </th>
            <td className={td}>{role.trim() || "Not provided"}</td>
          </tr>
          <tr className="border-b border-border/55">
            <th scope="row" className={th}>
              Prompt
            </th>
            <td className={`${td} whitespace-pre-wrap break-words`}>
              {prompt.trim() || "Not provided"}
            </td>
          </tr>
          <tr>
            <th scope="row" className={th}>
              Attached files
            </th>
            <td className={`${td} align-top`}>
              {files.length > 0 ? (
                <AttachmentFileLinks files={files} variant="embedded" />
              ) : (
                <span className="text-muted-foreground">None</span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
