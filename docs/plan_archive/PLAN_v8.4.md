# v8.4 — Interim shared-run per-question OG — Planned (higher effort, SSR)

Part of v8.0 Marketing & Launch. Strategy context: `docs/local_only/PLAN_v8.0_marketing_suggestions.md` (Sections 2,
7, 10). Index: `PLAN_v8.0.md`.

**Goal:** Make shared answers preview on social with the actual question as the `og:title` instead of
the generic "TeamStoa" card — the main viral loop (suggestions doc Section 10 #3, Section 7).
Currently [SharedRunPage.tsx](frontend/src/pages/SharedRunPage.tsx) is a client-rendered SPA route, so
crawlers see only the static `index.html` OG tags.

**Why it's last / flagged:** this genuinely needs server-side rendering for the `/shared/:slug` route —
crawlers don't run JS. Options (pick before building; this is the architectural decision):
- **(A) Targeted SSR/edge function** for `/shared/:slug` (and later the landing/template pages) that
  fetches the run via [shared.py](backend/api/shared.py) and injects per-question `og:title`/
  `og:description`/canonical into the HTML head. Lighter than a full migration; Section 10 #3 endorses
  this interim path.
- **(B) Defer to the full v_SEO / Next.js migration.** Cleaner long-term, but months out — the viral
  value waits.

## Tasks (depend on A vs B — do not implement until the decision is made)
- [ ] (Option A) Add a server route/edge function that, for `/shared/:slug`, calls the public
  `/api/shared/:slug` data and returns HTML with per-run OG tags + canonical, falling back to the SPA
  for humans. Backend + infra change (this is the one phase that touches the **Backend** service and
  likely a Railway config/route change — call it out at implementation time).
- [ ] (Option B) Move this into the v_SEO plan (`PLAN_SEO.md`) and mark it deferred here.

## Verify (user runs these — option A)
- Deploy, then paste a `/shared/:slug` URL into a social preview debugger (e.g. the LinkedIn Post
  Inspector or the Twitter/X card validator) — the preview title should be the run's question, not
  "TeamStoa."
- To confirm humans are unaffected: open the same URL in a browser — the normal shared-run view should
  render as before.

## Deploy (Railway)
Option A touches the **Backend** service (and possibly a new route/edge config) — unlike v8.2/v8.3
this is not frontend-only. Detail the exact dashboard change (route, env, or start command) at
implementation time, once the SSR approach is chosen.
