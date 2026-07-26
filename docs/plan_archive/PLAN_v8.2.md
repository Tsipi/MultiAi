# v8.2 — Landing page — Planned (next up)

Part of v8.0 Marketing & Launch. Strategy context: `docs/local_only/PLAN_v8.0_marketing_suggestions.md`
(Sections 3, 9, 10, 11). Index: `PLAN_v8.0.md`.

**Goal:** Add a real public marketing surface at `/` that explains the product and routes visitors
into the app, closing the Section 10 #1 gap. Today an unauthenticated visit to `/` falls through to
`LoginPage` (see the public-route block at [App.tsx:563-572](frontend/src/App.tsx#L563-L572)); there
is no page that sells the product before login.

**Copy (honest, per suggestions doc Section 9 + 11):** hero on the debate mechanic, not grounded
data. **Launch hero (locked): "One AI's confident answer isn't a verified one."** Sub-copy leans on
the debate mechanic ("Rival AI models argue your question out until only the answer that survives is
left standing"). Differentiators: structured multi-model debate, optional web search with cited
sources, replayable transcripts (live token/cost + permalink replay already exist). No per-claim
confidence, no live market data, no "live debates feed."

## Prerequisite — persona-to-template mapping (no code of its own)
The persona spine (Section 11) reuses the **existing** templates — no change to `TEAM_TEMPLATES`
(user decision, 2026-07-26). Each persona card on the landing page points at an existing template by
its `id`:

| Persona (marketing) | Existing template (unchanged) | Template `id` |
|---|---|---|
| Investor | Investment Team | `investment-debate` |
| Researcher | Research & Writing Team | `research-writing` |
| Founder / Builder | Startup GTM Team | `startup-gtm` |
| Everyday | default team loaded on a fresh compose (`createDefaultTeam`) | *(no id — the default)* |

The template `id` is already honored by `pref_team_template` in
[App.tsx:556](frontend/src/App.tsx#L556) and the picker, so a persona CTA just needs to pre-select
its mapped `id` (Everyday = leave the default team). No data/wiring change required.

Note: the team role *wording* shown on these persona cards is refined later in `PLAN_v8.3.md` — this
phase ships with the current role text; sharpening it is not a blocker.

## Decisions (locked 2026-07-26)
- **Primary CTA / signup flow:** add explicit **`/register`** (opens signup mode) and **`/login`**
  (opens login mode) public routes. The landing "Start for free" CTA -> `/register`; a secondary
  "Sign in" -> `/login`. This requires an `initialMode` on `LoginPage` (today it always starts in
  `login` mode — [LoginPage.tsx:13](frontend/src/pages/LoginPage.tsx#L13)).
- **Logged-in user at `/`:** redirect to **`/app/new`** (returning users skip marketing).
- **Hero headline:** "One AI's confident answer isn't a verified one." (see Copy note above).
- **Pricing section:** a "Free while we launch — no credit card" note + the sign-up CTA. **No
  email-capture box** (billing deferred; `hello@teamstoa.com` has no inbound mail configured, so
  there is nothing to receive captured emails yet).

## Tasks (frontend)
- [ ] Create [LandingPage.tsx](frontend/src/pages/LandingPage.tsx) — a public, no-auth page. Sections
  per suggestions doc Section 3 / 11: Hero + CTA (hero line locked above), How it works (5 steps: pick
  team -> ask -> debate -> verdict -> follow-up), persona strip (the four personas mapped to existing
  templates per the table above), "Why not just ask one AI?", a Pricing note ("Free while we launch —
  no credit card", no email box), Footer reusing the existing About/Privacy/Terms links.
- [ ] Add an optional `initialMode?: "login" | "register"` prop to
  [LoginPage.tsx](frontend/src/pages/LoginPage.tsx) (default `"login"`); use it to seed the `mode`
  state.
- [ ] In the public-route block of [App.tsx:563-572](frontend/src/App.tsx#L563-L572), add — all
  **before** the `!isLoggedIn` fallback:
  - `/` -> `<LandingPage />` when logged out; when logged in, redirect to `/app/new`.
  - `/login` -> `<LoginPage initialMode="login" ... />`.
  - `/register` -> `<LoginPage initialMode="register" ... />`.
- [ ] Wire the landing CTAs with `useNavigate`: "Start for free" -> `/register`; "Sign in" -> `/login`.
- [ ] Persona card CTAs pre-select the mapped template `id` (per the table above) then route to
  `/register` (Everyday = default team, no pre-select).
- [ ] Reuse existing UI primitives ([components/ui/](frontend/src/components/ui/)) and the brand-violet
  theme; keep it responsive (mobile matters for Product Hunt — Section 9) and dark-mode aware
  (`.dark` class model).
- [ ] Optional: a 15-20s debate GIF/screenshot placeholder slot (Section 3) — leave an `<img>` with a
  TODO source if the asset isn't ready; do not block the phase on it.

## Verify (user runs these)
- In your terminal: `cd frontend && npm run dev`.
- To confirm the landing page: open http://localhost:5173/ in a logged-out browser (or incognito) —
  you should see the marketing page (hero "One AI's confident answer isn't a verified one."), not the
  login form.
- To confirm the CTA: click "Start for free" -> you should land on the signup form (`/register`, "Create
  your account"). Click "Sign in" -> the login form (`/login`, "Welcome back").
- To confirm the persona mapping: a persona card CTA (e.g. Investor) should land on signup and, after
  you sign in, the compose screen should have that team (Investment Team) pre-selected.
- To confirm logged-in behavior: log in, visit `/` -> you should be redirected to `/app/new`.
- To confirm pricing: the pricing area shows the "free, no card" note and has **no** email box.
- Edge cases: check mobile width (Section 9 — no horizontal scroll) and dark mode.
- Confirm the existing public pages still work: `/about`, `/privacy`, `/terms` unchanged, and
  `/forgot-password` still reachable from the login form.
- `cd frontend && npx tsc --noEmit` clean.

## Deploy (Railway)
Frontend-only (`LandingPage.tsx`, `LoginPage.tsx`, `App.tsx`). Push; only the **Frontend** service
rebuilds (if Watch Paths set). No new deps unless you add a form/animation library — if so, name it
and commit `package.json` + `package-lock.json`. No env vars, no dashboard change.
