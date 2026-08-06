import { describe, expect, it } from "vitest";
import type { AttachmentFileRef } from "@/types";
import { attachmentToBlob } from "./openAttachment";

const ref = (over: Partial<AttachmentFileRef>): AttachmentFileRef => ({
  name: "f",
  mime_type: "",
  kind: "file",
  data: "",
  ...over,
});

describe("attachmentToBlob", () => {
  it("decodes a base64 pdf data URL to a blob of the right type", async () => {
    // "%PDF-1.4" base64-encoded
    const blob = attachmentToBlob(
      ref({ kind: "pdf", mime_type: "application/pdf", data: "data:application/pdf;base64,JVBERi0xLjQ=" })
    );

    expect(blob).not.toBeNull();
    expect(blob!.type).toBe("application/pdf");
    expect(await blob!.text()).toBe("%PDF-1.4");
  });

  it("wraps raw text attachments, which are not stored as data URLs", async () => {
    const blob = attachmentToBlob(ref({ kind: "text", mime_type: "text/plain", data: "notes line one" }));

    expect(blob!.type).toBe("text/plain");
    expect(await blob!.text()).toBe("notes line one");
  });

  it("returns null for an empty attachment rather than opening a blank tab", () => {
    expect(attachmentToBlob(ref({ data: "" }))).toBeNull();
  });

  it("returns null when the base64 payload is corrupt", () => {
    expect(attachmentToBlob(ref({ data: "data:application/pdf;base64,!!!not base64!!!" }))).toBeNull();
  });
});
