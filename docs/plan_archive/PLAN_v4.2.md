# Version 4.2 — Public Sharing & Export

**Scope:** Let users share a run publicly via a URL. Add full debate export.  
**Depends on:** v4.1 complete (DB and auth must exist before public slugs work)  
**Next:** v5.0 (Next.js migration + SEO)

---

## Out of scope for v4.2

* SEO landing pages, template pages, SSR/SSG → **v5.0**

---

## Phase 4.2.1 — PDF Export Polish

**Reference:** session `20260609_150411` exported 2026-06-09 — 6 issues identified.  
**Files:** `frontend/src/services/exporter.ts`, `frontend/src/services/pdfMarkdown.ts`

### 4.2.1.1 Bug 1 — `---` horizontal rules print as literal dashes *(high priority)*

`pdfMarkdown.ts` has no case for `---`. The line falls through to `writeLineWithLinks` and renders
the string `---` verbatim. The final answer from Deepseek uses `---` heavily as section dividers.

**Fix — `pdfMarkdown.ts`:** Add before the bullet handler:
```ts
if (line === "---" || line === "***" || line === "___") {
  y += 4;
  doc.setDrawColor(220, 210, 240);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_X, y, doc.internal.pageSize.getWidth() - MARGIN_X, y);
  y += 8;
  continue;
}
```

- [ ] **4.2.1.1.1** `pdfMarkdown.ts` — add `---` → visual horizontal rule

### 4.2.1.2 Bug 2 — Watermark too prominent on pages 2+ *(high priority)*

`AgentStudioAssistant.png` at 5.5% opacity (`0.055`) and 55% page size is clearly visible as a
ghost image. On a 3-page export it dominates the mid-section of every page.

**Fix — `exporter.ts` lines 75 and 116–117:**
```ts
loadImageDataUrl(AgentStudioLogo, 0.03),    // opacity: 0.055 → 0.03
// ...
const wmSz = Math.min(pageW, pageH) * 0.40; // size: 0.55 → 0.40
```

- [ ] **4.2.1.2.1** `exporter.ts` — reduce watermark to opacity 0.03, size 0.40

### 4.2.1.3 Bug 3 — Pages 2+ have no header *(medium priority)*

When `ensurePageSpace` in `pdfMarkdown.ts` calls `doc.addPage()` the new page starts blank —
no logo, no "MultiAi Consensus" label, no divider. For multi-page exports this looks unbranded.

**Fix:** Extract `drawPageHeader(doc: jsPDF, title: string): void` in `exporter.ts` and call it on
page 1 (already done inline) and via a `headerFn` callback passed into `renderMarkdown`. Each
`addPage()` call should call `headerFn()` before returning the new `y` position.
The secondary-page header should be compact: logo 18 pt, title text 8 pt, light divider.

- [ ] **4.2.1.3.1** `exporter.ts` + `pdfMarkdown.ts` — `drawPageHeader()` + `headerFn` callback on each new page

### 4.2.1.4 Bug 4 — No page numbers *(medium priority)*

No "Page X / Y" footer on any page.

**Fix — `exporter.ts`:** After the watermark loop, add a second footer pass:
```ts
for (let p = 1; p <= totalPages; p++) {
  doc.setPage(p);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(160, 140, 200);
  doc.text(`${p} / ${totalPages}`, pageW - 48, pageH - 20, { align: "right" });
}
```

- [ ] **4.2.1.4.1** `exporter.ts` — page number footer loop after watermark pass

### 4.2.1.5 Bug 5 — Inline bold stripped to plain text *(medium priority)*

`cleanInline()` in `pdfMarkdown.ts` strips `**bold**` → plain text. Inline bold phrases inside
paragraphs (common in Deepseek answers) lose all weight.

**Fix — `pdfMarkdown.ts`:** Add `writeLineWithInlineBold()` that splits on `**` pairs and
alternates between `"normal"` and `"bold"` font weight for each segment on the same line.
Replace the plain `writeLines` fallback call in `renderMarkdown` with this function.

- [ ] **4.2.1.5.1** `pdfMarkdown.ts` — `writeLineWithInlineBold()` for paragraph text

### 4.2.1.6 Bug 6 — No consensus metadata *(low priority — nice to have)*

The export shows participants but omits final score, round count, and cost. Readers have no
context on how much deliberation produced the answer.

**Fix:** Extend `ExportData`:
```ts
consensusScore?: number;   // e.g. 8.5
roundCount?: number;       // e.g. 3
totalCostUsd?: number;     // e.g. 0.014
```
Render a compact one-line metadata block between the participants divider and the "Exported" date:
```
Score: 8.5 / 10  ·  3 rounds  ·  ~$0.014
```

- [ ] **4.2.1.6.1** `exporter.ts` — extend `ExportData`; render score/rounds/cost metadata line
- [ ] **4.2.1.6.2** `ChatPanel.tsx` — pass `final_score`, round count, `total_cost_usd` to `downloadPdf`

---

## Phase 4.2.2 — Public Sharing

**Goal:** Let users optionally publish a run so it can be shared via a link.  
The `/shared/:slug` route was stubbed in v4.0 — this phase fills it in.

### How it works

1. User clicks "Share publicly" on a saved run
2. Backend generates a unique slug and sets `visibility = public`
3. Anyone with the link `/shared/:slug` can view the run read-only — no login required
4. User can unshare at any time, which hides the page

### API routes

| Method | Route | Action |
|--------|-------|--------|
| `POST` | `/api/runs/:id/share` | Set `visibility = public`, generate `public_slug`, return slug |
| `POST` | `/api/runs/:id/unshare` | Set `visibility = private`, clear `public_slug` |
| `GET` | `/api/shared/:slug` | Public read-only — no auth required |

### 4.2.2.1 Backend — share / unshare endpoints

- [ ] **4.2.2.1.1** `POST /api/runs/:id/share` — generate a slug (kebab-case from title + short random suffix), set `visibility = public`, return `{ slug }`
- [ ] **4.2.2.1.2** `POST /api/runs/:id/unshare` — set `visibility = private`, clear `public_slug`
- [ ] **4.2.2.1.3** `GET /api/shared/:slug` — return run + output if `visibility = public`, else 404

### 4.2.2.2 Frontend — share action

- [ ] **4.2.2.2.1** Add "Share publicly" button to `SessionViewActions.tsx` (or `SessionPromptActions.tsx`)
- [ ] **4.2.2.2.2** On click — call `POST /api/runs/:id/share`, show the resulting URL in a copy-to-clipboard toast
- [ ] **4.2.2.2.3** Add "Unshare" button when run is already public

### 4.2.2.3 Frontend — public view page

- [ ] **4.2.2.3.1** Fill in the `/shared/:slug` route stubbed in v4.0
- [ ] **4.2.2.3.2** New component `SharedRunPage.tsx` — fetches `GET /api/shared/:slug`, renders read-only final answer + debate
- [ ] **4.2.2.3.3** No sidebar, no compose bar — stripped-down layout
- [ ] **4.2.2.3.4** Shows a "Try MultiAi" CTA at the bottom

---

## Phase 4.2.3 — Full Debate Export (deferred from v3.2.5)

**Goal:** PDF and markdown export optionally includes the full Director's Cut (all rounds, critiques, summaries).

### 4.2.3.1 Extend ExportData type

- [ ] **4.2.3.1.1** `frontend/src/services/exporter.ts` — add optional `debateRounds` field to `ExportData`

### 4.2.3.2 Markdown export

- [ ] **4.2.3.2.1** `downloadMarkdown` — if `debateRounds` present, append a `## Full Debate` section with each round

### 4.2.3.3 PDF export

- [ ] **4.2.3.3.1** `downloadPdf` — if `debateRounds` present, render each round after the final answer section

### 4.2.3.4 Export UI

- [ ] **4.2.3.4.1** `SessionPromptDownloads.tsx` — add a checkbox "Include full debate"
- [ ] **4.2.3.4.2** Pass the choice down to `downloadMarkdown` / `downloadPdf`

---

## Phase 4.2.4 - Per-Agent Writer and Critic Roles

**Goal:** Make each team member's "Expert focus" affect that specific agent's LLM prompt instead
of sending the writer's shared role to every writer and critic.

- [x] **4.2.4.1** Frontend payload includes position-aligned `writer_roles` and `critic_roles` arrays
- [x] **4.2.4.2** API request/response schemas and persisted sessions retain per-agent roles
- [x] **4.2.4.3** Each writer receives its own role for initial drafting; the primary writer role is reused for refinement and final synthesis
- [x] **4.2.4.4** Each critic receives its own role for critique prompts
- [x] **4.2.4.5** Missing role-array entries fall back to the existing shared `role` for old clients and sessions
- [x] **4.2.4.6** Add focused frontend and backend tests for role alignment and fallback behavior
- [x] **4.2.4.7** Preserve saved per-agent roles when reusing a session team or starting a follow-up

---

## Phase 4.2.5 - Live Web Research for Current Questions

**Status:** Implemented. Manual same-day freshness verification remains before commit.

**Goal:** When the user explicitly asks to search the web, browse, verify current information, or
answer a time-sensitive question, retrieve current source material before the debate and make that
same research context available to every Writer, Critic, refinement, and final-synthesis call.

### Why the app is not current today

MultiAi currently sends ordinary chat-completion requests to OpenRouter. The selected LLM receives
only the prompt, uploaded attachments, and debate context. `call_openrouter()` does not enable any
search tool or plugin, and the backend has no search-provider client that retrieves webpages.

The prompts mention using "live web research context when provided", but no code currently creates
or injects that context. Asking a model to "search the web" in plain prompt text does not grant it
internet access; it can only answer from its training data and may incorrectly imply that it searched.

### Recommended architecture

Run one controlled backend research step before the debate. Produce a dated, source-linked research
packet and inject the same packet into the question context used by all agents. Do not let every
agent independently browse: shared evidence is cheaper, more consistent, and easier to audit.

Support three request modes:

- `off`: never search.
- `auto`: search only when the request clearly asks for web/current/live/latest/today verification.
- `on`: always search for this run.

The UI should default to `auto`, while explicit wording such as "look on the web" must activate
search. A completed answer must clearly show whether live search was used, when it ran, and which
sources were supplied to the agents.

### 4.2.5.1 Search contract and provider boundary

- [x] **4.2.5.1.1** Add `web_search_mode: "off" | "auto" | "on"` to frontend and API request types
- [x] **4.2.5.1.2** Add `backend/consensus/web_research.py` returning structured results: title, URL, snippet/content, and retrieval timestamp
- [x] **4.2.5.1.3** Add OpenRouter web-plugin configuration to `backend/config.py`; keep search logic outside the debate engine
- [x] **4.2.5.1.4** Set strict limits for result count, cited content size, timeout, and total research context size
- [x] **4.2.5.1.5** Treat retrieved text as untrusted data and protect prompts against instructions embedded in webpages

### 4.2.5.2 Search activation and query generation

- [x] **4.2.5.2.1** Add deterministic detection for explicit search/currentness language; explicit user requests must always win
- [x] **4.2.5.2.2** In `auto` mode, search for clearly time-sensitive requests and skip stable/general questions
- [x] **4.2.5.2.3** Generate a bounded query from the raw user question without losing dates, locations, or named entities
- [x] **4.2.5.2.4** Emit stream activity events: search started, sources found, search skipped, or search failed
- [x] **4.2.5.2.5** On search failure, continue only with a visible freshness warning; never silently claim live verification

### 4.2.5.3 Debate integration and citations

- [x] **4.2.5.3.1** Retrieve research once after clarification checks and before debate execution; build a clearly delimited research packet
- [x] **4.2.5.3.2** Inject the same packet into Writer, Critic, refinement, validation, and final-synthesis context
- [x] **4.2.5.3.3** Require current factual claims to cite supplied source URLs and distinguish sourced facts from model inference
- [x] **4.2.5.3.4** Prevent the model from inventing citations or claiming it searched when no research packet exists
- [x] **4.2.5.3.5** Keep scorer and summarizer focused on debate evaluation; do not make them independently search

### 4.2.5.4 Persistence, API response, and UI evidence

- [x] **4.2.5.4.1** Persist search mode, whether search ran, retrieval timestamp, query, sources, summary, and any warning on `DebateSession`
- [x] **4.2.5.4.2** Return structured research metadata through `ConsultResponse` and frontend `ConsultResult`
- [x] **4.2.5.4.3** Add an Advanced Setup control for `Auto / Search web / No web`
- [x] **4.2.5.4.4** Show used, skipped, or failed status with retrieval time and clickable sources on completed runs
- [x] **4.2.5.4.5** Preserve research metadata in saved sessions, shared runs, follow-ups, PDF exports, and Markdown exports

### 4.2.5.5 Verification and deployment

- [x] **4.2.5.5.1** Unit-test activation rules, query generation, context formatting, limits, and prompt-injection delimiters
- [x] **4.2.5.5.2** Share one research packet through the common question context used by all debate agents
- [x] **4.2.5.5.3** Normalize API metadata and render explicit used, skipped, and failed UI states
- [ ] **4.2.5.5.4** Add a manual freshness test using a same-day news question and verify cited pages contain the reported facts
- [x] **4.2.5.5.5** Document Railway environment variables, provider quota/cost controls, and production timeout behavior

### Acceptance criteria

- An explicit "search/look on the web" request always triggers a real backend search unless it fails visibly.
- A general stable question does not automatically incur search cost.
- The answer displays retrieval time and clickable sources when live research was used.
- Saved/shared/exported results preserve source provenance.
- The app never labels an answer current or web-verified when no live search completed.
