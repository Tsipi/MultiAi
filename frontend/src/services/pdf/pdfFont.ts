import type { jsPDF } from "jspdf";
import notoRegularUrl from "@expo-google-fonts/noto-sans-hebrew/400Regular/NotoSansHebrew_400Regular.ttf?url";
import notoBoldUrl from "@expo-google-fonts/noto-sans-hebrew/700Bold/NotoSansHebrew_700Bold.ttf?url";
import { toVisualOrder } from "./pdfText";

const HELVETICA = "helvetica";
const UNICODE_FAMILY = "NotoSansHebrew";

/**
 * Font family for the document currently being drawn. Latin-only exports keep Helvetica
 * so their layout and appearance are unchanged; a document containing Hebrew switches
 * once, up front, and uses the embedded font throughout.
 */
let activeFamily: string = HELVETICA;

export function activeFontFamily(): string {
  return activeFamily;
}

export function resetFontFamily(): void {
  activeFamily = HELVETICA;
}

async function fetchAsBase64(url: string): Promise<string> {
  const buffer = await (await fetch(url)).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/**
 * Registers the embedded Hebrew/Latin font and tells jsPDF its text is in logical order.
 * Patching `doc.text` rather than each call site also covers text drawn internally by
 * jspdf-autotable, which the exporter never calls directly.
 */
export async function enableUnicodeFont(doc: jsPDF): Promise<void> {
  const [regular, bold] = await Promise.all([
    fetchAsBase64(notoRegularUrl),
    fetchAsBase64(notoBoldUrl),
  ]);

  doc.addFileToVFS(`${UNICODE_FAMILY}-Regular.ttf`, regular);
  doc.addFont(`${UNICODE_FAMILY}-Regular.ttf`, UNICODE_FAMILY, "normal");
  doc.addFileToVFS(`${UNICODE_FAMILY}-Bold.ttf`, bold);
  doc.addFont(`${UNICODE_FAMILY}-Bold.ttf`, UNICODE_FAMILY, "bold");
  // Noto Sans Hebrew ships no italic face; map it to regular so italic text still renders.
  doc.addFont(`${UNICODE_FAMILY}-Regular.ttf`, UNICODE_FAMILY, "italic");

  activeFamily = UNICODE_FAMILY;
  patchTextForLogicalInput(doc);
}

/**
 * Reorders text to visual order exactly once, then tells jsPDF to leave it alone.
 *
 * jsPDF runs its own bidi engine on every `text` call. Observed behaviour of its
 * `isInputVisual` option: the default `true` converts the string, `false` passes it through.
 * Reordering here while leaving the default converted twice, which reversed Latin words
 * inside Hebrew ("Highlands" -> "sdnalhgiH"); passing `false` without reordering converted
 * zero times, leaving Hebrew reversed. One pass by bidi-js, with jsPDF's disabled, is the
 * combination that is correct for both.
 *
 * Patching `doc.text` rather than each call site also covers text drawn internally by
 * jspdf-autotable, which the exporter never calls directly.
 */
function patchTextForLogicalInput(doc: jsPDF): void {
  const original = doc.text.bind(doc);
  const patched: typeof doc.text = (text, x, y, options, transform) => {
    const visual = Array.isArray(text)
      ? text.map((line) => toVisualOrder(String(line)))
      : toVisualOrder(String(text));
    return original(
      visual as string | string[],
      x,
      y,
      { ...(options ?? {}), isInputVisual: false },
      transform
    );
  };
  doc.text = patched;
}
