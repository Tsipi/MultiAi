# v8.0 — Marketing & Launch (Index)

**Status:** In Progress (v7.0 merged to `main`; on `PLAN_v8.0` branch). Launching **free** (billing
deferred). Pre-marketing rebrand and SEO foundation were done in v6.2.

**This file is the index only.** The v8.0 work is split across per-subphase docs (one file each, so
"implement the next one" is unambiguous) plus a strategy-reference doc:

| Doc | What it is |
|-----|-----------|
| `docs/local_only/PLAN_v8.0_marketing_suggestions.md` | Brand identity, positioning, pricing, SEO, launch sequence, colleague wireframe. **Reference/brainstorm — not a build checklist.** |
| `PLAN_v8.1.md` | Build subphase — Free-tier quota counter |
| `PLAN_v8.2.md` | Build subphase — Landing page (incl. persona-to-template mapping) |
| `PLAN_v8.3.md` | Build subphase — Team role refinements |
| `PLAN_v8.4.md` | Build subphase — Shared-run per-question OG (SSR) |

## Subphases — status and build order

| Subphase | Title | Status | Touches | Notes |
|----------|-------|--------|---------|-------|
| **v8.1** | Free-tier quota counter | **Done** | frontend + backend | 3 bugs fixed; user-confirmed |
| **v8.2** | Landing page | **Planned — NEXT** | frontend | The single biggest gap. Persona cards reuse existing templates (no `TEAM_TEMPLATES` change) |
| **v8.3** | Team role refinements | Planned | frontend (`templates.ts`) | Done after the landing page; user supplies refined role wording, Claude applies it |
| **v8.4** | Shared-run per-question OG | Planned (higher effort) | backend + infra | Needs SSR/edge for `/shared/:slug`; do after the landing page |

**When you say "implement," the next subphase is v8.2 (landing page).** It has one Open decision to
settle first (CTA target / logged-in redirect) — see `PLAN_v8.2.md`.

## Deferred / not in this build spec
- **Analytics (Plausible, Section 6)** — deferred by user decision (2026-07-26).
- **Billing / Pro tier (Section 5)** — launching free; Month-4 item.
- **Template SEO pages, content marketing, grounded-data sources** — part of v_SEO / later; see the
  suggestions doc Sections 4, 10, 11 and `docs/local_only/Plan_grounded_sources.md`.

## Done outside this version (context)
- Pre-marketing rebrand (suggestions Section 2) — Done from v6.2 (Railway service rename outstanding,
  cosmetic).
- SEO foundation (suggestions Section 7) — Done from v6.2 (per-shared-run OG is v8.4).
