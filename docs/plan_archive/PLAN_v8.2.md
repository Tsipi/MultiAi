# v8.2 — Landing page — Done

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
- [x] Create [LandingPage.tsx](frontend/src/pages/LandingPage.tsx) — a public, no-auth page. Sections:
  Hero + CTA (hero line locked above), How it works, persona strip (the four personas mapped to existing
  templates per the table above), "Why not just ask one AI?", a Pricing note ("Free while we launch —
  no credit card", no email box), Footer reusing the existing About/Privacy/Terms links.
- [x] Add an optional `initialMode?: "login" | "register"` prop to
  [LoginPage.tsx](frontend/src/pages/LoginPage.tsx) (default `"login"`); seeds the `mode` state.
- [x] In the public-route block of [App.tsx](frontend/src/App.tsx), added — all **before** the
  `!isLoggedIn` fallback:
  - `/` -> `<LandingPage />` when logged out; when logged in, redirect to `/app/new`.
  - `/login` -> `<LoginPage initialMode="login" ... />`; redirect to `/app/new` when logged in.
  - `/register` -> `<LoginPage initialMode="register" ... />`; redirect to `/app/new` when logged in.
- [x] Wire the landing CTAs with `useNavigate`: "Start for free" -> `/register`; "Sign in" -> `/login`.
- [x] Persona card CTAs pre-select the mapped template `id` (per the table above) then route to
  `/register` (Everyday = default team, no pre-select). Carried through signup/login via a
  `pending_team_template` localStorage key consumed by the prefs effect in `App.tsx`.
- [x] Reuse existing UI primitives ([components/ui/](frontend/src/components/ui/)) and the brand-violet
  theme; responsive and dark-mode aware (`.dark` class model).
- [x] Debate preview placeholder slot — `<img>` pointing at `/landing-debate-preview.png` with a TODO
  source; self-hides on 404 until the real asset lands. (Asset not yet shipped — see Known follow-up.)

### Refinements added during build (beyond the original spec)
- [x] **How it works redesign** — reworked from a flat 5-step row into a connected numbered stepper
  (4 steps: Pick a team -> Ask -> They debate -> You get the answer), with a per-step **actor tag**
  ("You" / "Your AI team") so visitors can't read "Debate" as something they do. Follow-up pulled out
  of the step sequence into a separate loop callout below the stepper (follow-up icon + share icon,
  bulleted): follow up with the same team (context carried over) or share the result via permalink.
- [x] **Copy** — removed the word "rival" everywhere ("independent"/"other" models); removed the word
  "verdict" everywhere ("answer that holds up" / "You get the answer"). Hero badge changed to
  "Frontier models from OpenAI, Anthropic & Google" with the TeamStoa icon in a gradient chip.
- [x] **Persona section** — headline "Built for the moment you can't afford to be wrong." with quote
  cards (Investor/Researcher/Founder/Everyday); "Start here" hint small + right-aligned. Added an
  "Or pick a team" chip strip rendering all `TEAM_TEMPLATES` (icon + name), each pre-selecting that
  team and routing to `/register` — reuses the same `pending_team_template` mechanism.
- [x] **"Why not just ask one AI?"** — converted to a two-column card grid (Comparing isn't checking /
  Most "AI debates" still argue from memory / One guess, stated with confidence / on-the-record).
- [x] **Pricing** — restyled the note into a full-bleed brand-violet banner (honest copy: no
  grounded-data or Pro-tier claims).
- [x] **Layout polish** — extra top space above the landing navbar and bottom space in the footer
  (both stack the safe-area inset); section separators between How it works / persona.
- [x] **Login/register routing bug fix** — `/login` and `/register` returned `<LoginPage>`
  unconditionally, so a successful login left the form on screen until a browser Back. Both now
  redirect to `/app/new` when `isLoggedIn`.
- [x] **Back-to-landing links** — the TeamStoa brand on [LoginPage.tsx](frontend/src/pages/LoginPage.tsx)
  is now a `Link` to `/`, plus an explicit "← Back to home" link below the card.
- [x] **Search + share metadata** ([index.html](frontend/index.html)) — Google was scraping the login
  page's visible text as the result description (no `<meta name="description">` existed and `/` used to
  render the login form). Added a real `<meta name="description">`, a descriptive `<title>`
  ("TeamStoa — Multi-model AI debate for answers that hold up"), and `<meta name="robots">`; aligned the
  Open Graph / Twitter title + description with the landing page's honest debate copy; added
  `og:image:alt`. Replaced the share image `MascotTeamStoa.png` with a corrected **1200×630** asset
  (previous file was 766×418 with a "DESCISION" typo; `og:image:width/height` now match) and bumped the
  homepage `lastmod` in [sitemap.xml](frontend/public/sitemap.xml). Post-deploy the user must request
  re-indexing in Google Search Console for the snippet to refresh (scrapers cache aggressively).
  Note: SPA serves one shared title/description/OG for all routes — per-page and per-`/shared/:slug`
  cards remain the job of v8.4 (shared-run OG) / v_SEO (Next.js).
- [x] **Google Search Console ownership verification** ([index.html](frontend/index.html)) — the
  HTML-**file** method failed: Railway's static host 301-redirects any `.html` URL to its
  extension-less form, which the SPA catch-all then serves as `index.html` (logged-out unknown route →
  LoginPage), so Google saw "wrong content." Switched to the HTML-**tag** method: added
  `<meta name="google-site-verification" content="…">` to the `<head>` (in the static HTML, immune to
  the `.html` redirect) and deleted the dead `frontend/public/googlee6ff2c260d85bf58.html`. Ownership
  now verified. Indexing request + card-debugger re-scrapes remain user actions in Search Console /
  the social debuggers.

**Verified:** `cd frontend && npx tsc --noEmit` clean after each change. Manual browser checks
(below) are pending the user.

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
Frontend-only (`LandingPage.tsx`, `LoginPage.tsx`, `App.tsx`, `index.html`,
`public/MascotTeamStoa.png`, `public/sitemap.xml`). Push; only the **Frontend** service rebuilds (if
Watch Paths set). No new deps. No env vars, no dashboard change. Post-deploy (user-only): request
re-indexing of `https://www.teamstoa.com/` in Google Search Console, and re-scrape the URL in the
Facebook / LinkedIn / X card debuggers so the cached share preview picks up the new image + copy.
