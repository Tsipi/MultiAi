import bidiFactory from "bidi-js";

const bidi = bidiFactory();

// Codepoint comparisons rather than regex character classes: a literal precomposed Hebrew
// character can be stored as a base + combining mark pair, which silently turns a class
// like [A-B] into a far wider range. Numbers cannot be mangled that way.
const HEBREW_START = 0x0590;
const HEBREW_END = 0x05ff;
const HEBREW_PRESENTATION_START = 0xfb1d;
const HEBREW_PRESENTATION_END = 0xfb4f;

const LATIN_UPPER_START = 0x41;
const LATIN_UPPER_END = 0x5a;
const LATIN_LOWER_START = 0x61;
const LATIN_LOWER_END = 0x7a;

function isHebrew(code: number): boolean {
  return (
    (code >= HEBREW_START && code <= HEBREW_END) ||
    (code >= HEBREW_PRESENTATION_START && code <= HEBREW_PRESENTATION_END)
  );
}

function isLatinLetter(code: number): boolean {
  return (
    (code >= LATIN_UPPER_START && code <= LATIN_UPPER_END) ||
    (code >= LATIN_LOWER_START && code <= LATIN_LOWER_END)
  );
}

/** True when the text needs the embedded Unicode font — jsPDF's Helvetica cannot render it. */
export function hasNonLatinScript(text: string): boolean {
  for (let i = 0; i < text.length; i += 1) {
    if (isHebrew(text.charCodeAt(i))) return true;
  }
  return false;
}

/** True when any field of the document needs the embedded font. */
export function documentNeedsUnicodeFont(parts: (string | undefined)[]): boolean {
  return parts.some((part) => Boolean(part) && hasNonLatinScript(part as string));
}

/**
 * Reorders one already-wrapped line from logical order into the visual order a PDF draws in.
 * Must run *after* line wrapping, which operates on logical order.
 *
 * jsPDF ships its own bidi engine, but it is applied only when its `isInputVisual` option is
 * left at its default. Callers pass `isInputVisual: false` alongside this so the text is
 * converted exactly once, here, by a full UAX#9 implementation.
 */
export function toVisualOrder(text: string): string {
  if (!text || !hasNonLatinScript(text)) return text;
  return bidi.getReorderedString(text, bidi.getEmbeddingLevels(text));
}

/**
 * True when the paragraph's base direction is right-to-left, so it should be right-aligned.
 * Uses the first strongly-directional character — the UAX#9 P2/P3 rule for the common case,
 * and enough to choose an alignment.
 */
export function isRtlParagraph(text: string): boolean {
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (isHebrew(code)) return true;
    if (isLatinLetter(code)) return false;
  }
  return false;
}
