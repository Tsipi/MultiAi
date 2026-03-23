import { AttachmentInput } from "../types";

const SUPPORTED_TYPES = "text/*,.md,.txt,.csv,.json,.pdf,image/*";

export function supportedUploadTypes(): string {
  return SUPPORTED_TYPES;
}

export async function readAttachments(files: FileList | null): Promise<AttachmentInput[]> {
  if (!files?.length) {
    return [];
  }
  const out: AttachmentInput[] = [];
  for (const file of Array.from(files)) {
    if (file.type.startsWith("image/")) {
      out.push({ kind: "image", name: file.name, mime_type: file.type, data: await asDataUrl(file) });
      continue;
    }
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      out.push({ kind: "pdf", name: file.name, mime_type: "application/pdf", data: await asDataUrl(file) });
      continue;
    }
    out.push({ kind: "text", name: file.name, mime_type: file.type || "text/plain", data: await file.text() });
  }
  return out;
}

export async function readClipboardItems(items: DataTransferItemList): Promise<AttachmentInput[]> {
  const out: AttachmentInput[] = [];
  for (const item of Array.from(items)) {
    if (item.kind === "file") {
      const file = item.getAsFile();
      if (!file) {
        continue;
      }
      if (file.type.startsWith("image/")) {
        out.push({ kind: "image", name: file.name || "pasted-image.png", mime_type: file.type, data: await asDataUrl(file) });
        continue;
      }
      if (file.type === "application/pdf") {
        out.push({ kind: "pdf", name: file.name || "pasted-file.pdf", mime_type: "application/pdf", data: await asDataUrl(file) });
      }
      continue;
    }
    if (item.kind === "string" && item.type === "text/plain") {
      const text = await itemAsString(item);
      if (text.trim()) {
        out.push({ kind: "text", name: "pasted-text.txt", mime_type: "text/plain", data: text });
      }
    }
  }
  return out;
}

export async function readClipboardFromBrowser(): Promise<AttachmentInput[]> {
  if (!("clipboard" in navigator) || !navigator.clipboard.read) {
    return [];
  }
  const out: AttachmentInput[] = [];
  const entries = await navigator.clipboard.read();
  for (const entry of entries) {
    for (const type of entry.types) {
      if (type.startsWith("image/")) {
        const blob = await entry.getType(type);
        out.push({
          kind: "image",
          name: `clipboard-image.${type.split("/")[1] || "png"}`,
          mime_type: type,
          data: await asDataUrl(new File([blob], "clipboard-image", { type }))
        });
      } else if (type === "application/pdf") {
        const blob = await entry.getType(type);
        out.push({
          kind: "pdf",
          name: "clipboard-file.pdf",
          mime_type: type,
          data: await asDataUrl(new File([blob], "clipboard-file.pdf", { type }))
        });
      } else if (type === "text/plain") {
        const blob = await entry.getType(type);
        const text = await blob.text();
        if (text.trim()) {
          out.push({ kind: "text", name: "clipboard-text.txt", mime_type: type, data: text });
        }
      }
    }
  }
  return out;
}

function asDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Could not read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function itemAsString(item: DataTransferItem): Promise<string> {
  return new Promise((resolve) => item.getAsString((value) => resolve(value || "")));
}
