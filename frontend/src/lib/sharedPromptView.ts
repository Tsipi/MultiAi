import type { AttachmentFileRef, ConsultResult } from "@/types";
import { attachmentListForDisplay, promptTextForDisplay, stripAttachmentBlock } from "./promptDisplay";
import { capitaliseFirst } from "./textCase";

export type SharedPromptView = {
  isFollowup: boolean;
  /** Root question of the thread, shown as a small "Follow-up to" line. Empty for plain runs. */
  rootQuestion: string;
  /** The question to display prominently, first letter capitalised. */
  instruction: string;
  attachments: AttachmentFileRef[];
};

/**
 * Builds the public shared-run Question card from structured session fields.
 * `result.question` is never used: on a follow-up it holds the composed packet
 * (root question + parent answer + instruction), and on a plain run it holds
 * inlined attachment text.
 */
export function sharedPromptView(result: ConsultResult): SharedPromptView {
  const attachments = attachmentListForDisplay(result);

  if (!result.is_followup) {
    return {
      isFollowup: false,
      rootQuestion: "",
      instruction: capitaliseFirst(promptTextForDisplay(result).trim()),
      attachments,
    };
  }

  const rootQuestion = stripAttachmentBlock(result.root_question || result.source_prompt || "").trim();
  const instruction = stripAttachmentBlock(result.followup_instruction || "").trim();

  if (!instruction) {
    return { isFollowup: true, rootQuestion: "", instruction: capitaliseFirst(rootQuestion), attachments };
  }

  return { isFollowup: true, rootQuestion, instruction: capitaliseFirst(instruction), attachments };
}
