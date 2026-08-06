import type { AttachmentFileRef } from "@/types";

const DATA_URL_PREFIX = /^data:([^;,]*)(;base64)?,/i;

/**
 * Converts a stored attachment into a Blob.
 * PDFs and images are stored as `data:` URLs; text attachments store raw text.
 */
export function attachmentToBlob(file: AttachmentFileRef): Blob | null {
  if (!file?.data) return null;
  const match = file.data.match(DATA_URL_PREFIX);
  if (!match) {
    return new Blob([file.data], { type: file.mime_type || "text/plain" });
  }
  const mime = match[1] || file.mime_type || "application/octet-stream";
  const payload = file.data.slice(match[0].length);
  if (!match[2]) {
    return new Blob([decodeURIComponent(payload)], { type: mime });
  }
  try {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

/**
 * Opens an attachment in a new tab via a blob: URL.
 * Browsers block top-level navigation to `data:` URLs, which showed a blank tab.
 */
export function openAttachment(file: AttachmentFileRef): boolean {
  const blob = attachmentToBlob(file);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}
