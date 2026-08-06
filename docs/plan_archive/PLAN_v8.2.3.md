# v8.2.3 — PDF export mangles Hebrew and other non-Latin scripts — Done

Found 2026-08-06 while verifying v8.2.2 in production, on a Hebrew travel-planning run. Pre-existing
since the exporter was written; unrelated to v8.2.1/v8.2.2. Index: `PLAN_v8.0.md`.

**Scope:** Frontend only, `frontend/src/services/pdf/`. No backend, schema or API change. Affects
PDF export only — the app's own views render Hebrew correctly, because the browser supplies the font
and the bidi algorithm.

**Status:** Done. Font scope decided per document (2026-08-06). Hebrew rendering, ordering and
filename confirmed by the user against a real export; the final header/layout pass is implemented
but not yet eyeballed.

**Scope note:** started as font + bidi only, and grew during implementation into a PDF presentation
pass — brand lockup, export timestamp, section rules — plus one pre-existing page-break bug found
along the way (Tasks 5-7).

**Verified:** `npx tsc --noEmit` clean; `npm test` — 48 passed across 9 files; `npm run build`
succeeds and emits the two TTFs as separate ~48KB assets. User confirmed on real exports: Hebrew
readable, Latin runs inside Hebrew correctly ordered (`self-catering`, `Highlands`, `Lochs`), dates
unreversed, ASCII filename, and an English export byte-identical to its pre-change baseline.

---

## Symptom

Exporting a Hebrew run produces a document where every Hebrew string is mojibake and mixed-direction
text is reordered:

- Hebrew renders as Latin-1 garbage: `Þæèäê êÕÛàÙê ÜØÙÕÜ ÑáçÕØÜàÓ`
- Dates reverse: the question's `21.8.26` and `28.8.26` appear as `62.8.12` and `62.8.82`
- Affects the title, prompt, answer body, and the full-debate transcript alike

The same content displays correctly in the app, in the shared-run page, and in Markdown export. Only
the generated PDF is wrong.

---

## Root cause

Two independent defects that happen to surface together.

### 1. No font is embedded
There is no `addFont` or `addFileToVFS` call anywhere in `frontend/src/services/pdf/`, so jsPDF
(2.5.x) falls back to its built-in Helvetica. The PDF standard-14 fonts are WinAnsi/Latin-1 only,
so Hebrew codepoints are pushed through a Latin encoding table and emerge as unrelated glyphs.

This limitation is already acknowledged in the code — [pdfMarkdown.ts:507](frontend/src/services/pdf/pdfMarkdown.ts#L507)
carries the comment "jsPDF's built-in Helvetica cannot reliably measure/render these glyphs" — but
only arrows and non-breaking spaces were worked around, one character class at a time.

### 2. No bidi, and the direction marks are stripped
jsPDF implements no Unicode bidirectional algorithm; it draws the string in logical order. Worse,
`cleanInline` at [pdfMarkdown.ts:511](frontend/src/services/pdf/pdfMarkdown.ts#L511) deletes
`‎`, `‏`, `‪-‮` and `⁦-⁩` — precisely the marks that carry direction —
so even explicit hints in the source text are removed before drawing.

The reversed dates are the clean proof: `21.8.26` -> `62.8.12` is an ordering failure with no font
component at all. It would persist even after the font is fixed.

---

## Fix plan

### Task 1 — Embed a Unicode font — Done
- [x] **Decision 2026-08-06: per document.** Detect non-Latin text once at export time and pick the
      font for the whole document. A Latin-only export keeps Helvetica, so the common case cannot
      regress; a document containing any Hebrew uses the embedded font throughout.
- [x] Added [pdfFont.ts](frontend/src/services/pdf/pdfFont.ts): fetches the TTFs and registers them
      via `addFileToVFS`/`addFont` for regular, bold and italic. Noto Sans Hebrew ships no italic
      face, so italic maps to regular.
- [x] Font source is `@expo-google-fonts/noto-sans-hebrew`, which ships raw **TTF**.
      `@fontsource/noto-sans-hebrew` was tried first and rejected — it ships only WOFF/WOFF2, which
      jsPDF cannot parse. Verified the TTF covers Latin, digits, punctuation and Hebrew (464
      glyphs), so mixed documents render in one face. The package has no dependencies.
- [x] Lazy loading came free: the `?url` imports emit the TTFs as separate ~48KB assets that are
      fetched only when a Hebrew export runs, so the main bundle is unaffected.
- [x] The font family is read through `activeFontFamily()` in
      [pdfUtils.ts](frontend/src/services/pdf/pdfUtils.ts) and by the autotable style — the only two
      places that named the font, which made the swap far smaller than the 38 call sites implied.

### Task 2 — Real bidi, not string reversal — Done
- [x] `bidi-js` reorders each already-wrapped line via `toVisualOrder` in
      [pdfText.ts](frontend/src/services/pdf/pdfText.ts). Naive reversal was never viable — it is
      what produces `62.8.12`.
- [x] **jsPDF runs its own bidi engine on every `text` call**, which the plan did not anticipate.
      Its `isInputVisual` option defaults to `true` (convert); `false` passes through. Two failed
      attempts pinned the semantics: reordering while leaving the default converted twice and
      reversed Latin runs inside Hebrew (`Highlands` -> `sdnalhgiH`); passing `false` without
      reordering converted zero times and left Hebrew reversed. Correct combination is one bidi-js
      pass **plus** `isInputVisual: false`.
- [x] Applied by patching `doc.text` on the instance rather than at each call site — the only way to
      also cover text drawn internally by `jspdf-autotable`, which the exporter never calls directly.
- [x] `cleanInline` keeps bidi control characters when the text contains Hebrew, and still strips
      them from Latin-only text so that path stays byte-identical.
- [x] RTL paragraphs right-align in `writeLines`. **Partial:** lines containing markdown links draw
      token-by-token with manual x-advance and stay left-aligned; table cells keep their existing
      alignment. Ordering is correct everywhere — only alignment is incomplete.

### Task 3 — Re-check every drawing path — Done
- [x] Autotable takes the font via `activeFontFamily()` in its style config.
- [x] Running page header verified via the user's real exports.
- [x] Script detection uses numeric codepoint comparisons, not regex character classes. A literal
      precomposed Hebrew character written as a base + combining-mark pair had silently widened a
      class into a U+05B4-U+FB4F range that swallowed the bidi control characters. A unit test
      caught it; numbers cannot be mangled that way.
### Task 4 — Tests and verification — Done

**Automated** — [pdfText.test.ts](frontend/src/services/pdf/pdfText.test.ts)
- [x] `21.8.26` stays unreversed inside Hebrew; `Highlands` stays unreversed in a mixed line.
- [x] The Hebrew run itself is still reordered, and Latin-only text passes through untouched.
- [x] Bidi control characters survive `cleanInline` with Hebrew present, and are still stripped
      without it.
- [x] Non-Latin detector, including a Latin document containing a single Hebrew character.
- [x] `exportTimestampLabel` formatting and the ASCII filename fallback.
- [x] `npx tsc --noEmit` clean; `npm test` — 48 passed.

**Manual — capture the baseline**
If the implementation has already landed uncommitted, the baseline is still recoverable: stash the
working tree, export the baselines against the unmodified exporter, then restore. The user runs the
git commands.

```
git stash            # exporter reverts to pre-change state
npm run dev          # export the baseline PDFs, keep the files
git stash pop        # restore the implementation
npm run dev          # export the same runs again and compare
```

Same run, same day, same "Include full debate" setting on both sides — a differing setting alone
changes the page count and invalidates the comparison.

**Manual — results**
- [x] English baseline vs post-change: user confirmed the two exports look **identical**, which is
      the pass criterion (a Latin-only export never loads the embedded font, so any visible
      difference would have been a regression rather than a judgement call).
- [x] Hebrew run (the Scotland itinerary): readable Hebrew; dates read `21.8.26`; Latin runs inside
      Hebrew correct (`self-catering`, `Highlands`, `Lochs`); RTL paragraphs right-aligned.
- [x] Filename falls back to `teamstoa_export_<date>.pdf` instead of `__<date>.pdf`.
- [ ] Not yet eyeballed: the final header/layout pass (Tasks 5-7) — section rules, label spacing,
      and body text at full size after a page break on a long English export.

### Task 5 — Brand header and export timestamp — Done
Not in the original plan; requested during implementation.
- [x] Replaced the mascot in the page header with the TeamStoa lockup — violet gradient tile, white
      node graph, `Team`/`Stoa` wordmark, `YOUR AI DECISION COUNCIL` tagline — matching the landing
      page. Redrawn as SVG in [pdfIcons.tsx](frontend/src/services/pdf/pdfIcons.tsx) because the
      React `TeamStoaIcon` renders only the white graph and relies on a CSS gradient for its tile.
      Falls back to the mascot if the SVG-to-canvas conversion fails.
- [x] The lockup is a PDF link annotation to `https://www.teamstoa.com`. Absolute by necessity — a
      PDF has no notion of a relative `/`, and exports are shared off-site. Deliberately different
      from the shared page's relative link.
- [x] Header stamp is now `Exported DD/MM/YYYY hh:mm`, aligned to the tagline baseline via a shared
      `brandTaglineBaseline()` so the two cannot drift apart.
- [x] Added `exportTimestampLabel()` separate from `exportDateLocal()`, which also feeds the
      filename and must stay filesystem-safe — slashes and colons are not valid there.
- [ ] Left alone: the mascot is still the faint centre-page watermark.

### Task 6 — Page-break font bug — Done
Pre-existing, found during this work; affected every multi-page export including English ones.

- [x] `ensurePageSpace` starts a new page by calling the page-header function, which draws in its
      own small bold face and never restored the caller's. The first line after **every** page break
      therefore inherited it, which is why only first lines looked shrunken.
- [x] Fixed inside `ensurePageSpace` — it now saves and restores font name, style, size and text
      colour around the header call, covering all seven call sites across `pdfMarkdown.ts` and
      `pdfParticipants.ts` at once rather than patching each.

### Task 7 — Page-one layout pass — Done
Not in the original plan; requested from annotated screenshots.

- [x] Purple `Prompt` / `Follow-up Prompt` label above the question, which stays bold and black.
- [x] Parent question moved up as a compact muted `Follow-up to:` line, mirroring the shared page,
      and the separate `Original Prompt` section removed as duplicative. `Previous Final Answer`
      stays — it appears nowhere else.
- [x] The duplicate lower `Prompt` block removed for plain runs; the heading carries the question.
- [x] Section rules above the team block, `Answer` / `Revised Answer`, and `Full Debate`, via one
      `sectionBreak()` helper so spacing is identical at all three and tunable in one place. It
      calls `ensurePageSpace` first, so a rule near a page boundary cannot orphan its heading.
- [x] Breathing room under the purple section labels.

---

## Related finding — the final answer ignores the question's language (backend, not PDF)

Raised 2026-08-06 alongside this subphase. **Not a PDF bug and not in this subphase's scope** —
recorded here so it is not lost, and to be moved to a backend subphase when picked up.

A Hebrew question ("האם יכול לסכם לי מסקנות ... בעברית?" — explicitly asking for Hebrew) produced a
Hebrew debate but an **English final answer**. The writer and critics answered in Hebrew; only the
synthesis switched language.

Cause: no prompt in [prompts.py](backend/consensus/prompts.py) mentions language at all. Writers and
critics mirror the question's language naturally, but `FINAL_SYNTHESIS` ends with "Structure your
answer exactly as follows:" and four **English** section headings (`The Bottom Line`,
`What the Team Agreed On`, ...). That explicit English scaffold pulls the whole synthesis into
English, overriding the mirroring the other roles do.

Options, in increasing intrusiveness:
- **Pass a language directive through an existing slot.** `synthesis_scope` already flows into
  `FINAL_SYNTHESIS`'s `{intent_scope}`, so appending something like "Answer in the language of the
  user's question" needs no template edit. Cheapest, and keeps `prompts.py` locked.
- **Detect the question's language explicitly** and name it in that directive, rather than relying
  on the model to infer it.
- **Edit `FINAL_SYNTHESIS`** to state the language rule directly. Requires explicit user approval —
  the templates are locked by CLAUDE.md.

Open question either way: should the four section headings translate too, or stay English as
structural markers? A Hebrew answer under English headings is inconsistent; fully translated
headings change what the parser and the PDF's heading detection see.

---

## Out of scope
- Markdown export, which is plain text and already correct.
- The app and shared-page views, which the browser renders correctly.
- Other scripts (Arabic, CJK). The same font-embedding mechanism would extend to them, but each
  needs its own glyph coverage and CJK fonts are far larger.

## Risk
Medium, and higher than it looks. The font swap touches every measurement in the exporter, so
Latin-only exports — the common case today — could regress in layout even though their content is
unchanged. The English baseline comparison in Task 4 is mandatory, not optional, and the baseline
must be captured before implementation starts.
