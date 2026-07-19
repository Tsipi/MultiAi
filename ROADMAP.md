# MultiAi Roadmap

High-level version history and future direction.  
Detailed specs for each version live in `docs/plan_archive/PLAN_vX.x.md`.  
Status vocabulary: Done / In Progress / Blocked / Planned (see `docs/Planning_Cleanup_V_6.md`). This file mirrors PLAN.md's "Active roadmap" table — keep both in sync when a version's status changes.

---

## Shipped

### v1.0 - Initial Architecture (2026-03-29)
Three-area dashboard concept: left sidebar (session history), center builder (compose), right output (final answer + debate).  
Core multi-agent loop: Writer -> Critics -> Scorer -> Summarizer -> refine until consensus.

### v1.1 - Unified Dashboard UX
Merged the create and view flows into a single panel. Reduced layout friction, improved usability, prepared for SaaS growth.

### v2.0 - Dark Tech Minimal Redesign
Replaced generic SaaS UI with a sharp, premium aesthetic. Removed card clutter, strengthened visual hierarchy, established brand identity.

### v3.0 - Slack-Style Chatroom Debate (2026-04-09)
Replaced the static output panel with a live chatroom feed. Each agent posts messages as the debate progresses; round dividers act as channel separators; the final answer is pinned at the top. Scales naturally to N agents.

### v3.1 - Codebase Cleanup (2026-05-14)
Removed dead components, refactored `App.tsx` into custom hooks, updated project docs to reflect actual codebase state.

### v3.2 - Engagement And Threading (2026-05-27)
Final answer prompt redesigned. Session sidebar groups threads by `thread_id`. CommandBar empty-state tagline added.

### v3.3 - Documentation Sync (2026-06-02)
Aligned planning documents, created `ROADMAP.md`, verified project docs before v4 work.

### v4.0 - UI Foundation
Added frontend routing, new-run flow, team templates, public route foundations, and backend performance/accuracy improvements.

Full spec: `docs/plan_archive/PLAN_v4.0.md`

### v4.1 - Persistence And Authentication
Added PostgreSQL, Alembic, fastapi-users auth foundation, login UI, and session persistence groundwork.

Full spec: `docs/plan_archive/PLAN_v4.1.md`

### v4.1.1 - Cleanup And Reorganisation
Follow-up cleanup after persistence/auth: component organization, CORS, session scoping, docs sync, and deployment hardening notes.

Full spec: `docs/plan_archive/PLAN_v4.1.1.md`

### v4.2 - Sharing, Export, Roles, And Live Web Research
Added public sharing, full-debate export, per-agent writer/critic roles, and live web research for current questions.

Full spec: `docs/plan_archive/PLAN_v4.2.md`

### v4.3 - Reduce Run Latency
Added Fast/Balanced/Deep answer modes, reduced default run latency, skipped unnecessary fast-mode support calls, tightened web-search behavior, deferred non-essential work, and exposed timing/cost metadata.

Full spec: `docs/plan_archive/PLAN_v4.3.md`

### v4.4 - Live Debate Experience Polish
Compact progress notes, named teammate copy, typing polish, clearer repair/error notes.

**Status:** Done.

Full spec: `docs/plan_archive/PLAN_v4.4.md`

### v5.0 - New Login, Auth, Admin, And User Settings
Product-ready account UX, admin area, regular user settings, permission hardening.

**Status:** Done.

Full spec: `docs/plan_archive/PLAN_v5.0.md`

### v5.1 - Auth And Settings Polish
Login/settings fixes, admin password-reset trigger, rate limiting, deferred v5.0 items completed.

**Status:** Done.

Full spec: `docs/plan_archive/PLAN_v5.1.md`

### v6.0 - Mobile UX
Responsive app shell, mobile compose, mobile sessions, mobile run experience.

**Status:** Done.

Full spec: `docs/plan_archive/PLAN_v6.0.md`

### v6.1 - Advanced Setup Panel Redesign
Three-tab (Team/Debate/Sources) redesign of the Advanced Setup drawer.

**Status:** Done.

Full spec: `docs/plan_archive/PLAN_v6.1.md`

---

## Current

### v6.2 - Pre-Launch Polish: Rebrand, SEO Foundation, Legal Pages, And OG Sharing
PDF rebrand, OG/Twitter tags, robots.txt/canonical, Privacy/Terms/About pages, sitemap, production email, SPA routing fix.

**Status:** In Progress — 6.2.1-6.2.6 done; 6.2.7 (sitemap) planned, 6.2.8 (production email) blocked, 6.2.9 (SPA routing fix) in progress.

Full spec: `docs/plan_archive/PLAN_v6.2.md`

### v6.3 - Mobile Follow-up & Debate View Fixes
Bug-fix session: mobile follow-up flow, Full Debate transcript view, saved-session team labeling, OpenRouter call reliability, sidebar title-generation cost trimming, and sidebar follow-up chronological ordering.

**Status:** Done — 6.3.1, 6.3.2, and 6.3.3 all Done.

**In production:** 6.3.1 shipped; 6.3.2/6.3.3 done on branch, not yet deployed.  
**In development:** v6.2's remaining items (6.2.7/6.2.8/6.2.9) still open in parallel; v6.4 queued next.

Full spec: `docs/plan_archive/PLAN_v6.3.md`

---

## Planned

### v5.2 - Deferred Auth And Account Features
**Status:** Blocked — Google OAuth, notification preferences, impersonate/view-as; blocked on missing infra and explicit approval.

Full spec: `docs/plan_archive/PLAN_v5.2.md`

### v6.4 - Markdown Table Rendering (App + PDF Export)
Render GFM-style markdown tables in the live app and PDF export.

**Status:** Planned.

Full spec: `docs/plan_archive/PLAN_v6.4.md`

### v_SEO - Next.js, SEO, Template Pages, SSR/SSG
Template pages, public/shared SSR/SSG, metadata, sitemap, SEO architecture.

**Status:** Planned.

Full spec: `docs/plan_archive/PLAN_SEO.md`

### Marketing - TeamStoa Brand, Launch, And Growth
In-app rebrand, landing page, content, analytics, Product Hunt, pricing.

Full spec: `docs/local_only/PLAN_Marketing.md`

---

## Backlog

- Save personal team templates
- Billing / usage limits
- Deeper analytics for run quality, cost, and latency
- Team/template marketplace ideas after public SEO pages exist
