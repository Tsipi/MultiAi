import { describe, expect, it } from "vitest";
import { exportFileStem, exportTimestampLabel } from "./exporter";
import { cleanInline } from "./pdfMarkdown";
import { documentNeedsUnicodeFont, hasNonLatinScript, isRtlParagraph, toVisualOrder } from "./pdfText";

const HEBREW = "מצרפת תוכנית לטיול בסקוטלנד";

describe("hasNonLatinScript", () => {
  it("detects a single Hebrew character in an otherwise Latin document", () => {
    expect(hasNonLatinScript("Compare the top 10 stocks")).toBe(false);
    expect(hasNonLatinScript("Compare the top 10 stocks א")).toBe(true);
  });

  it("scans every supplied document field", () => {
    expect(documentNeedsUnicodeFont(["Title", "Prompt", undefined])).toBe(false);
    expect(documentNeedsUnicodeFont(["Title", undefined, HEBREW])).toBe(true);
  });
});

describe("isRtlParagraph", () => {
  it("uses the first strongly-directional character", () => {
    expect(isRtlParagraph(HEBREW)).toBe(true);
    expect(isRtlParagraph("Compare the top 10 stocks")).toBe(false);
  });

  it("treats a Hebrew sentence opening with digits or punctuation as RTL", () => {
    expect(isRtlParagraph("• טירת סטירלינג")).toBe(true);
    expect(isRtlParagraph("2026 טירת סטירלינג")).toBe(true);
  });

  it("treats a Latin sentence containing Hebrew as LTR", () => {
    expect(isRtlParagraph("Stirling Castle — טירת סטירלינג")).toBe(false);
  });
});

describe("toVisualOrder", () => {
  it("keeps Latin words unreversed inside a Hebrew sentence", () => {
    const out = toVisualOrder(`ה-Highlands — ${HEBREW}`);

    expect(out).toContain("Highlands");
    expect(out).not.toContain("sdnalhgiH");
  });

  it("keeps a date unreversed inside Hebrew text", () => {
    const out = toVisualOrder(`${HEBREW} 21.8.26`);

    expect(out).toContain("21.8.26");
    expect(out).not.toContain("62.8.12");
  });

  it("reverses the Hebrew run itself into visual order", () => {
    expect(toVisualOrder(HEBREW)).not.toBe(HEBREW);
  });

  it("leaves Latin-only text untouched", () => {
    const latin = "The Bottom Line: ETFs beat single stocks.";
    expect(toVisualOrder(latin)).toBe(latin);
  });
});

describe("cleanInline", () => {
  it("preserves bidi control characters when the text contains Hebrew", () => {
    const out = cleanInline(`‫${HEBREW}‬ ‏Wizz Air‎`);

    expect(out).toContain("‫");
    expect(out).toContain("‏");
  });

  it("still strips bidi marks from Latin-only text, so its output is unchanged", () => {
    expect(cleanInline("‎Latin only‏")).toBe("Latin only");
  });

  it("still strips zero-width characters and the BOM", () => {
    expect(cleanInline("a​b﻿c")).toBe("abc");
  });
});

describe("exportTimestampLabel", () => {
  it("formats the header stamp as DD/MM/YYYY hh:mm with zero padding", () => {
    expect(exportTimestampLabel(new Date(2026, 7, 6, 9, 5))).toBe("06/08/2026 09:05");
    expect(exportTimestampLabel(new Date(2026, 11, 25, 18, 42))).toBe("25/12/2026 18:42");
  });
});

describe("exportFileStem", () => {
  it("falls back to an ASCII stem when the title is entirely Hebrew", () => {
    expect(exportFileStem(HEBREW, "2026-08-06")).toBe("teamstoa_export_2026-08-06");
  });

  it("keeps a normal Latin title", () => {
    expect(exportFileStem("Compare the top 10 stocks", "2026-08-06")).toBe(
      "compare_the_top_10_stocks_2026-08-06"
    );
  });
});
