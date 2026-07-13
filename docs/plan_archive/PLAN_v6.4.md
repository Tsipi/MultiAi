# Version 6.4 - Markdown Table Rendering (App + PDF Export)

**Scope:** Render GFM-style Markdown tables properly wherever LLM output is displayed, instead of showing raw pipe/dash syntax as garbled text. Covers the live app and the PDF export.
**Status:** Not started — planning only.
**Depends on:** none. Independent of `PLAN_v6.3.md`.

---

## Why this happens

Pipe-style Markdown tables are a GitHub-flavored (GFM) extension, not standard CommonMark. `react-markdown` (used in `MarkdownView.tsx` and `ChatPanel.tsx`'s Full Debate section) only renders them with the `remark-gfm` plugin, which isn't installed — so table syntax falls through as garbled paragraph text.

The PDF export is a separate problem: `pdfMarkdown.ts` hand-parses Markdown line-by-line for jsPDF and has no concept of a table block at all, so table rows get drawn as plain wrapped text too.

Tables will only ever appear where the model actually emits table syntax — both fixes are passive parsers, not something that needs new prompt logic.

---

## Phase 6.4.1 - Live App: Render Markdown Tables

**Goal:** "Final Answer", "Previous Answer", and "Full Debate" render an actual styled `<table>`.

### Tasks

- [ ] Add `remark-gfm`; pass `remarkPlugins={[remarkGfm]}` to all four `<ReactMarkdown>` usages
- [ ] Styled `table`/`thead`/`tbody`/`tr`/`th`/`td` overrides matching the existing prose styling
- [ ] Wrap tables in `overflow-x-auto` so wide tables scroll on mobile instead of overflowing
- [ ] Verify: non-table answers unaffected; a table request renders correctly on desktop, mobile, and dark mode

---

## Phase 6.4.2 - PDF Export: Render Markdown Tables

**Goal:** The "Answer" and "Full Debate" PDF sections render an actual bordered table with a header row.

### Open decision

`jspdf-autotable` (recommended, ~45–60 min — handles column sizing, cell wrapping, and page-break header repeat for free) vs. hand-rolling table drawing in `pdfMarkdown.ts` (~2–3 hrs, no new dependency).

### Tasks

- [ ] Decide: `jspdf-autotable` vs. hand-rolled
- [ ] Detect a Markdown table block (header + separator + data rows) in `renderMarkdown()`'s line loop
- [ ] Draw it styled to match the existing PDF theme, with header-row repeat across page breaks
- [ ] Verify: a table export renders as a real bordered table; non-table exports unaffected

**Note:** The `.md` export needs no changes — it already writes raw Markdown, which any GFM-aware viewer renders correctly today.
