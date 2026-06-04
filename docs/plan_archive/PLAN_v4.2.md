# Version 4.2 — Public Sharing & Export

**Scope:** Let users share a run publicly via a URL. Add full debate export.  
**Depends on:** v4.1 complete (DB and auth must exist before public slugs work)  
**Next:** v5.0 (Next.js migration + SEO)

---

## Out of scope for v4.2

* SEO landing pages, template pages, SSR/SSG → **v5.0**

---

## Phase 4 — Public Sharing

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

### Subtasks

**1. Backend — share / unshare endpoints**
- [ ] `POST /api/runs/:id/share` — generate a slug (kebab-case from title + short random suffix), set `visibility = public`, return `{ slug }`
- [ ] `POST /api/runs/:id/unshare` — set `visibility = private`, clear `public_slug`
- [ ] `GET /api/shared/:slug` — return run + output if `visibility = public`, else 404

**2. Frontend — share action**
- [ ] Add "Share publicly" button to `SessionViewActions.tsx` (or `SessionPromptActions.tsx`)
- [ ] On click — call `POST /api/runs/:id/share`, show the resulting URL in a copy-to-clipboard toast
- [ ] Add "Unshare" button when run is already public

**3. Frontend — public view page**
- [ ] Fill in the `/shared/:slug` route stubbed in v4.0
- [ ] New component `SharedRunPage.tsx` — fetches `GET /api/shared/:slug`, renders read-only final answer + debate
- [ ] No sidebar, no compose bar — stripped-down layout
- [ ] Shows a "Try MultiAi" CTA at the bottom

---

## Phase 4b — Full Debate Export (deferred from v3.2.5)

**Goal:** PDF and markdown export optionally includes the full Director's Cut (all rounds, critiques, summaries).

### Subtasks

**1. Extend ExportData type**
- [ ] `frontend/src/services/exporter.ts` — add optional `debateRounds` field to `ExportData`

**2. Markdown export**
- [ ] `downloadMarkdown` — if `debateRounds` present, append a `## Full Debate` section with each round

**3. PDF export**
- [ ] `downloadPdf` — if `debateRounds` present, render each round after the final answer section

**4. Export UI**
- [ ] `SessionPromptDownloads.tsx` — add a checkbox "Include full debate"
- [ ] Pass the choice down to `downloadMarkdown` / `downloadPdf`
