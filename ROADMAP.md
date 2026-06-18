# MultiAi Roadmap

High-level version history and future direction.  
Detailed specs for each version live in `docs/plan_archive/PLAN_vX.x.md`.

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

---

## Current

### v4.4 - Live Debate Experience Polish
**Theme:** Make the live debate section feel like a polished AI team room instead of a raw backend activity log.

The original v4.4 draft was narrowed after v4.3 shipped the live header, stage badge, answer mode, elapsed time, round count, score, avatars, and agent message styling. Current v4.4 focuses on the remaining rough edges users can feel.

| Phase | Goal |
|-------|------|
| 4.4.1 | Compact Routine Progress Messages - done |
| 4.4.2 | Remove Generic Critic Labels From User-Facing Copy - done |
| 4.4.3 | Simplify Typing And Loading States - done |
| 4.4.4 | Preserve Compatibility For Saved And Larger Debates - done |
| 4.4.5 | Avatar Fetch And Render Audit - done |
| 4.4.6 | Minimal Verification - manual check pending |
| 4.4.7 | Clear Repair And Provider-Limit Notes - done |

Full spec: `docs/plan_archive/PLAN_v4.4.md`

---

## Planned

### v5.0 - New Login, Auth, Admin, And User Settings
**Theme:** Product-ready account UX, regular user settings, admin area, and permission hardening.

| Phase | Goal | Status |
|-------|------|--------|
| 5.0.1 | Auth Audit And Role Model | Planned |
| 5.0.2 | New Login And Registration UX | Planned |
| 5.0.3 | Regular User Settings | Planned |
| 5.0.4 | Admin Area | Planned |
| 5.0.5 | Usage Quotas And Billing Preparation | Planned |
| 5.0.6 | Permissions And API Hardening | Planned |
| 5.0.7 | Deployment And Operations | Planned |

Full spec: `docs/plan_archive/PLAN_v5.0.md`

### v6.0 - Mobile UX
**Theme:** Responsive app shell, mobile compose, mobile sessions, and mobile run experience.

| Phase | Goal |
|-------|------|
| 6.0.1 | Auth Audit And Role Model |
| 6.0.2 | New Login And Registration UX |
| 6.0.3 | Regular User Settings |
| 6.0.4 | Admin Area |
| 6.0.5 | Permissions And API Hardening |
| 6.0.6 | Deployment And Operations |

Full spec: `docs/plan_archive/PLAN_v6.0.md`

### v7.0 - Next.js, SEO, Template Pages, SSR/SSG
**Theme:** Move public and SEO-sensitive surfaces to Next.js while preserving the private app workflow.

| Phase | Goal |
|-------|------|
| 7.0.1 | Architecture Decision |
| 7.0.2 | Template Page System |
| 7.0.3 | SSR Shared Run Pages |
| 7.0.4 | Marketing And SEO Foundation |
| 7.0.5 | App Router And Private App Integration |
| 7.0.6 | Deployment, Analytics, And Verification |

Full spec: `docs/plan_archive/PLAN_v7.0.md`

---

## Backlog

- Save personal team templates
- Billing / usage limits
- Deeper analytics for run quality, cost, and latency
- Team/template marketplace ideas after public SEO pages exist
