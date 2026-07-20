# Version 6.4 - Markdown Table Rendering (App + PDF Export)

**Scope:** Render GFM-style Markdown tables properly wherever LLM output is displayed, instead of showing raw pipe/dash syntax as garbled text. Covers the live app and the PDF export. Broadened during implementation to also fix the live activity feed (which flattened table drafts into garbled pipe text) and the mobile horizontal-scroll layout trap on the Final/Previous Answer cards.
**Status:** Done (on branch; not yet deployed).
**Depends on:** none. Independent of `PLAN_v6.3.md`.
**Verified:** `npx tsc --noEmit` clean; `npm run build` succeeds; `uv run pytest tests/` 56 passed (1 pre-existing unrelated failure in `test_session_store.py`). User confirmed live: Final Answer, Full Debate, PDF, and Markdown tables all render correctly; mobile view no longer clips the content column and wide tables stay contained.

---

## Why this happens

Pipe-style Markdown tables are a GitHub-flavored (GFM) extension, not standard CommonMark. `react-markdown` (used in `MarkdownView.tsx` and `ChatPanel.tsx`'s Full Debate section) only renders them with the `remark-gfm` plugin, which isn't installed — so table syntax falls through as garbled paragraph text.

The PDF export is a separate problem: `pdfMarkdown.ts` hand-parses Markdown line-by-line for jsPDF and has no concept of a table block at all, so table rows get drawn as plain wrapped text too.

Tables will only ever appear where the model actually emits table syntax — both fixes are passive parsers, not something that needs new prompt logic.

---

## Phase 6.4.1 - Live App: Render Markdown Tables — Done

**Goal:** "Final Answer", "Previous Answer", and "Full Debate" render an actual styled `<table>`.

The four `<ReactMarkdown>` call sites are not uniform: [MarkdownView.tsx:22](../../frontend/src/components/primitives/MarkdownView.tsx#L22) already has a full `components={{…}}` style map (this backs Final/Previous Answer), while the three in [ChatPanel.tsx:445,472,483](../../frontend/src/components/debate/ChatPanel.tsx#L445) (Full Debate: answer, critique, summary) are bare with no overrides.

### Decision (chosen): Option A

Style tables only in `MarkdownView` (Final Answer, Previous Answer — where a user who asked for a table actually reads the result). The three bare `ChatPanel` usages (Full Debate transcript) keep react-markdown defaults — tables there render as plain unstyled `<table>`s, which is acceptable for the rarely-opened transcript. Less code, ships faster; polish lands where the user looks.

Rejected — Option B (give ChatPanel its own shared table-override map so Full Debate matches): more consistent but adds a `components` prop to three previously-bare call sites for a surface almost no one styles as a table.

### Tasks

- [x] Installed `remark-gfm@^4.0.1`; passed `remarkPlugins={[remarkGfm]}` to all four `<ReactMarkdown>` usages (`MarkdownView.tsx` + three in `ChatPanel.tsx`). `remark-gfm` also enables strikethrough/task-lists/autolinks — non-table output confirmed unchanged
- [x] Added styled `table`/`thead`/`tbody`/`tr`/`th`/`td` overrides to `MarkdownView`'s `components` map only, matching its prose styling. Per Option A the three bare `ChatPanel` usages were left unstyled (Full Debate tables use react-markdown defaults, confirmed acceptable)
- [x] Wrapped `<table>` in a `my-3 overflow-x-auto` container so wide tables scroll instead of overflowing
- [x] **Live activity feed fix** (`backend/consensus/activity_text.py`): a table-only writer draft had no numbered list items, so `writer_summary_sentence()` fell through to `first_sentence()` and dumped the flattened pipe rows into the live feed (looked like an error). Added `table_headers()` (summarizes a table draft as "Writer drafted a comparison table covering …") and `strip_table_lines()` safety net in `first_sentence()` so pipe rows can never leak into the feed (also covers critics/summaries)
- [x] **Mobile horizontal-scroll fix**: the wide table's intrinsic width propagated all the way up the flex/grid chain to the `consensus-shell` container, which `<main>` (`overflow-x-hidden`) then clipped — cutting off the whole content column (header, clarification, pills, answer), not just the table. `min-w-0` must sit on **every** flex/grid ancestor between `<main>` and the table's `overflow-x-auto` box; a single gap lets the width escape upward. Added `min-w-0` to the full chain: `App.tsx:601` (`consensus-shell`), `ChatPanel.tsx:283/285/315/316`, and `PinnedAnswer.tsx:51` (root, which also covers the Previous Answer grid path). Full Debate already had `min-w-0` on its containers — hence it never broke. `WebResearchStatus` was already contained (not the cause)
- [x] Verified: user-confirmed on mobile — content column no longer clipped, wide tables stay contained; tables render correctly in Final Answer, Full Debate (dark mode included), PDF, and Markdown export

---

## Phase 6.4.2 - PDF Export: Render Markdown Tables — Done

**Goal:** The "Answer" and "Full Debate" PDF sections render an actual bordered table with a header row.

### Decision (chosen): `jspdf-autotable`

Chose `jspdf-autotable@^5.0.8` over hand-rolling — it handles column sizing, cell wrapping, and page-break header repeat for free, and is compatible with the installed `jspdf@^2.5.2`.

### Tasks

- [x] Refactored `renderMarkdown()`'s loop in `pdfMarkdown.ts` from `for...of` to an indexed loop with lookahead; added `tryParseTable()` (detects a header row + `|---|---|` separator + contiguous data rows, normalizes ragged rows to the header's column count) dispatched before the line renderers
- [x] Rendered the block via `autoTable(doc, …)` with `startY`, `pdfTheme` colors (violet `#6D28D9` header, `dividerStrong` grid lines), and a `didDrawPage` hook that redraws the running page header on tables spanning page breaks (`pageNumber > 1`, using `COMPACT_HEADER_BOTTOM = 62` as `margin.top`); resumes `y` from `doc.lastAutoTable.finalY`
- [x] Verified: table export renders as a real bordered table and page-breaks cleanly with the header repeating (user-confirmed); non-table exports unaffected

**Note:** The `.md` export needs no changes — it already writes raw Markdown, which any GFM-aware viewer renders correctly today.
