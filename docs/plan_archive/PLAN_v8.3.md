# v8.3 — Team role refinements — Planned (after the landing page, v8.2)

Part of v8.0 Marketing & Launch. Strategy context: `docs/local_only/PLAN_v8.0_marketing_suggestions.md`.
Index: `PLAN_v8.0.md`.

**Goal:** Sharpen the `role` description each team template member carries in
[templates.ts](frontend/src/data/templates.ts), so every team's debate stance is crisper and reads
well on the persona cards (landing page, `PLAN_v8.2.md`). **You (the user) write the refined
wording** — this doc is the worksheet and the rules; Claude only applies the exact text you supply,
it does not invent roles.

**What changes:** only the `role` strings inside `TEAM_TEMPLATES`. Not the template `id`s, names,
member names, avatars, or models. No backend, no new deps.

## Format rule (must keep)
Each role uses the pattern **`Title — description`** with a space-em dash-space separator. It is
parsed by `roleSummaryFromText` / `roleDescriptionFromText` in
[templates.ts:37-49](frontend/src/data/templates.ts#L37-L49): text before the ` — ` becomes the card
title, text after becomes the description. A refined role that drops the ` — ` will render with no
title/description split — keep the separator.

## Honesty rule (suggestions doc Section 9 / 11)
Roles describe *debate stances and expertise* only. Do NOT write roles implying live market data, SEC
feeds, real-time quotes, or per-claim confidence — those features do not exist.

## Worksheet — current roles to refine (edit the text after each ` — `)
Fill in a refined line for any you want to change; leave the rest as-is.

- [ ] **Programmer Team** (`programmer`)
  - John (writer): "Senior full-stack engineer — drafts implementation plans and architecture decisions"
  - Christy (critic): "Security engineer — reviews for vulnerabilities, auth issues, and attack surface"
  - Mark (critic): "DevOps engineer — reviews for scalability, deployment strategy, and observability"
- [ ] **Research & Writing Team** (`research-writing`)
  - Sue (writer): "Senior researcher — synthesizes sources and builds the core argument"
  - Jue (critic): "Editor — reviews clarity, structure, logical flow, and unsupported claims"
  - Jeff (critic): "Fact-checker — challenges weak evidence, flags hedging, and tests conclusions"
- [ ] **Tourist Planner Team** (`tourist-planner`)
  - Josh (writer): "Travel planner — designs itineraries, recommends where to stay, and maps day trips by region and transport"
  - Erika (critic): "Local travel expert — challenges generic picks, adds seasonal context, hidden gems, and on-the-ground accuracy"
  - Sandy (critic): "Logistics & budget advisor — reviews booking timing, transport options, costs, and practical friction points"
- [ ] **UX / Product Team** (`ux-product`)
  - Emma (writer): "Product lead — defines user stories, success metrics, and feature scope"
  - Natalie (critic): "UX designer — reviews usability, flow clarity, and edge-case interactions"
  - Patricia (critic): "Engineering lead — flags technical feasibility and integration complexity"
- [ ] **Startup GTM Team** (`startup-gtm`)
  - Juan (writer): "Growth strategist — drafts GTM plan, positioning, and channel strategy"
  - Sandy (critic): "Marketing lead — reviews messaging clarity, ICP fit, and competitive angle"
  - Erika (critic): "Founder advisor — stress-tests assumptions, pricing, and market timing"
- [ ] **Marketing Campaign Team** (`marketing-campaign`)
  - Christy (writer): "Creative director — develops campaign concept, copy, and emotional hook"
  - Sandy (critic): "Media strategist — reviews channel mix, targeting, and budget allocation"
  - Natalie (critic): "Brand guardian — ensures tone, consistency, and audience resonance"
- [ ] **Investment Team** (`investment-debate`)
  - Brett (writer): "Investment analyst — builds the bull case with data and market comps"
  - Josh (critic): "Risk officer — challenges valuation, macro risks, and downside scenarios"
  - Mark (critic): "Portfolio manager — reviews fit, sizing, and opportunity cost vs alternatives"
- [ ] **Resume / Career Team** (`resume-career`)
  - Suzie (writer): "Career coach — evaluates positioning, narrative, and impact framing"
  - Patricia (critic): "Hiring manager — reviews from a recruiter's lens: clarity, keywords, red flags"
  - Emma (critic): "Peer advisor — stress-tests the career move decision and growth trajectory"
- [ ] **Technical Architecture Review** (`tech-architecture`)
  - Jue (writer): "Principal engineer — designs the system architecture and component boundaries"
  - John (critic): "Backend specialist — reviews data models, API contracts, and failure modes"
  - Jerry (critic): "Infrastructure engineer — reviews scaling, cost, latency, and operational burden"

## Tasks
- [ ] You supply the refined role lines (any subset of the worksheet above).
- [ ] Claude replaces only the corresponding `role` strings in
  [templates.ts](frontend/src/data/templates.ts), keeping the ` — ` separator and every other field
  unchanged.

## Verify (user runs these)
- In your terminal: `cd frontend && npm run dev`, open http://localhost:5173.
- To confirm the refined roles render: open the affected template in the "PICK A TEAM" picker / team
  drawer — each member card should show the new title (before ` — `) and description (after it).
- To confirm nothing else moved: member names, avatars, and models on each card are unchanged.
- `cd frontend && npx tsc --noEmit` clean.

## Deploy (Railway)
Frontend-only (`templates.ts`). Push; only the **Frontend** service rebuilds (if Watch Paths set). No
new deps, no env vars, no dashboard change.
