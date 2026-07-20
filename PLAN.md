# PLAN.md

**In production:** v6.3 - Mobile Follow-up & Debate View Fixes (6.3.1 shipped)
**In development:** v6.4 - Markdown Table Rendering (6.4.1/6.4.2 both Done on this branch,
plus live-feed and mobile-scroll fixes, mobile user-confirmed; not yet deployed); v6.3 -
Mobile Follow-up & Debate View Fixes (6.3.1/6.3.2/6.3.3 all Done on this branch, not yet
deployed beyond 6.3.1); v6.2 all phases (6.2.1-6.2.9) Done, verified live on Railway

**Status governance:** Per-version detail tables are authoritative for phase-level status. When a phase's status changes, update its detail table row and the matching Active roadmap summary row in the same edit.

---

## Active roadmap

| Version | Theme | Scope | Status |
|---------|-------|-------|--------|
| v4.0 | UI Foundation | React Router v6 + Team Templates (frontend only) | Done |
| v4.1 | Persistence & Auth | PostgreSQL, Alembic, fastapi-users, login UI | Done |
| v4.1.1 | Cleanup & Reorganisation | Component folder move, CORS, session scoping, PLAN sync | Done |
| v4.2 | Sharing, Export, Roles, and Live Web Research | Public sharing, full debate export, per-agent roles, live web research | Done |
| v4.3 | Reduce Run Latency | Fast/Balanced/Deep mode, fewer unnecessary calls, timing instrumentation | Done |
| v4.4 | Live Debate Experience Polish | Compact progress notes, named teammate copy, typing polish, clearer repair/error notes | Done |
| v5.0 | New Login, Auth, Admin, and User Settings | Product-ready account UX, admin area, regular user settings, permission hardening | Done |
| v5.1 | Auth And Settings Polish | Login/settings fixes, admin password-reset trigger, rate limiting, deferred v5.0 items completed | Done |
| v5.2 | Deferred Auth And Account Features | Google OAuth, notification preferences, impersonate/view-as — blocked on infra and approval | Blocked |
| v6.0 | Mobile UX | Responsive app shell, mobile compose, mobile sessions, mobile run experience | Done |
| v6.1 | Advanced Setup Panel Redesign | Three-tab (Team/Debate/Sources) redesign of the Advanced Setup drawer | Done |
| v6.2 | Pre-Launch Polish: Rebrand, SEO Foundation, Legal Pages, and OG Sharing | PDF rebrand, OG/Twitter tags, robots.txt/canonical, Privacy/Terms/About pages, sitemap, production email, SPA routing fix | Done |
| v6.3 | Mobile Follow-up & Debate View Fixes | Bug-fix session: mobile follow-up flow, Full Debate transcript view, saved-session team labeling, OpenRouter call reliability and title-generation cost trimming, sidebar follow-up chronological ordering | Done |
| v6.4 | Markdown Table Rendering (App + PDF Export) | Render GFM-style markdown tables in the live app and PDF export; also fixes live-feed table garbling and mobile table horizontal-scroll | Done |
| v_SEO | Next.js + SEO | Template pages, public/shared SSR/SSG, metadata, sitemap, SEO architecture | Planned |
| Marketing | TeamStoa Brand, Launch, And Growth | In-app rebrand, landing page, content, analytics, Product Hunt, pricing | Planned |

---

## v4.0 UI Foundation - Done

Full spec: `docs/plan_archive/PLAN_v4.0.md`

| Phase | Goal | Status |
|-------|------|--------|
| 1 | Empty-state UX: `New Run` button in TopNav | Done |
| 1b | Client-side routing: React Router v6; `/app/new`, `/app/run/:id` | Done |
| 2 | Team Templates: template chips + drawer; 8 starter templates | Done |
| 3 | Backend performance and accuracy: speed fixes, live pricing, follow-up root anchor | Done |

---

## v4.2 Sharing, Export, Roles, and Live Web Research - Done

Full spec: `docs/plan_archive/PLAN_v4.2.md`

| Phase | Goal | Status |
|-------|------|--------|
| 4.2.1 | PDF Export Polish | Done |
| 4.2.2 | Public Sharing | Done |
| 4.2.3 | Full Debate Export | Done |
| 4.2.4 | Per-Agent Writer and Critic Roles | Done |
| 4.2.5 | Live Web Research for Current Questions | Done |


---

## v4.3 Reduce Run Latency - Done

Full spec: `docs/plan_archive/PLAN_v4.3.md`

| Phase | Goal | Status |
|-------|------|--------|
| 4.3.1 | Add Answer Mode | Done |
| 4.3.2 | Reduce Default Rounds | Done |
| 4.3.3 | Skip Unnecessary Support Calls in Fast Mode | Done |
| 4.3.4 | Use Faster Models for Utility Roles | Done |
| 4.3.5 | Make Web Search Strictly Conditional | Done |
| 4.3.6 | Defer Non-Essential Work | Done |
| 4.3.7 | Improve Perceived Speed | Done |
| 4.3.8 | Measure Before and After | Done |

---

## v4.4 Live Debate Experience Polish - Done

Full spec: `docs/plan_archive/PLAN_v4.4.md`

| Phase | Goal | Status |
|-------|------|--------|
| 4.4.1 | Compact Routine Progress Messages | Done |
| 4.4.2 | Remove Generic Critic Labels From User-Facing Copy | Done |
| 4.4.3 | Simplify Typing And Loading States | Done |
| 4.4.4 | Preserve Compatibility For Saved And Larger Debates | Done |
| 4.4.5 | Avatar Fetch And Render Audit | Done |
| 4.4.6 | Minimal Verification | Done |
| 4.4.7 | Clear Repair And Provider-Limit Notes | Done |

---

## v5.0 New Login, Auth, Admin, and User Settings - Done

Full spec: `docs/plan_archive/PLAN_v5.0.md`

| Phase | Goal | Status |
|-------|------|--------|
| 5.0.1 | Auth Audit And Role Model | Done |
| 5.0.2 | New Login And Registration UX | Done |
| 5.0.3 | Regular User Settings | Done |
| 5.0.4 | Admin Area | Done |
| 5.0.5 | Usage Quotas And Billing Preparation | Done |
| 5.0.6 | Permissions And API Hardening | Done |
| 5.0.7 | Deployment And Operations | Done |

---

## v5.1 Auth And Settings Polish - Done

Full spec: `docs/plan_archive/PLAN_v5.1.md`

| Phase | Goal | Status |
|-------|------|--------|
| 5.1.0 | Login Fixes | Done |
| 5.1.1 | Settings Polish | Done |
| 5.1.2 | Regular User Settings | Done |
| 5.1.3 | Admin Improvements | Done |
| 5.1.4 | API Hardening And Tests | Done |

Note: 5.1.4's automated-test-coverage task was deferred pending approval, not fully done — treated as an accepted scope-cut rather than an open blocker. Tracked separately in `docs/plan_archive/PLAN_Tests.md`.

---

## v5.2 Deferred Auth And Account Features - Blocked

Full spec: `docs/plan_archive/PLAN_v5.2.md`

| Phase | Goal | Status |
|-------|------|--------|
| 5.2.1 | Google OAuth | Planned |
| 5.2.2 | Notification Preferences | Planned |
| 5.2.3 | Impersonate / View As | Planned |

---

## v6.0 Mobile UX - Done

Full spec: `docs/plan_archive/PLAN_v6.0.md`

| Phase | Goal | Status |
|-------|------|--------|
| 6.0.1 | Mobile Information Architecture | Done |
| 6.0.2 | Responsive App Shell | Done |
| 6.0.3 | Mobile Compose Experience | Done |
| 6.0.4 | Mobile Live Debate And Final Answer | Done |
| 6.0.5 | Mobile Session History | Done |
| 6.0.6 | Mobile QA And Accessibility | Done |


---

## v6.1 Advanced Setup Panel Redesign - Done

Full spec: `docs/plan_archive/PLAN_v6.1.md`

| Phase | Goal | Status |
|-------|------|--------|
| 6.1.1 | Advanced Setup Panel Redesign | Done |

Note: the archive file has no numbered sub-phases (single "Status: Complete" scope) — this row is synthesized to keep the table format consistent.

---

## v6.2 Pre-Launch Polish: Rebrand, SEO Foundation, Legal Pages, and OG Sharing - Done

Full spec: `docs/plan_archive/PLAN_v6.2.md`

| Phase | Goal | Status |
|-------|------|--------|
| 6.2.1 | PDF Export Rebrand | Done |
| 6.2.2 | Social Share OG Tags | Done |
| 6.2.3 | SEO Foundation | Done |
| 6.2.4 | Privacy Policy Page | Done |
| 6.2.5 | Terms of Service Page | Done |
| 6.2.6 | About Page | Done |
| 6.2.7 | Sitemap | Done |
| 6.2.8 | Production Email (Resend) | Done |
| 6.2.9 | SPA Routing Fix (Railway) | Done |

---

## v6.3 Mobile Follow-up & Debate View Fixes - Done

Full spec: `docs/plan_archive/PLAN_v6.3.md`

| Phase | Goal | Status |
|-------|------|--------|
| 6.3.1 | Mobile Follow-up & Debate View Fixes | Done |
| 6.3.2 | Follow-up Thread History & Ordering | Done |
| 6.3.3 | OpenRouter Call Reliability & Title-Generation Cost Trimming | Done |

---

## v6.4 Markdown Table Rendering (App + PDF Export) - Done

Full spec: `docs/plan_archive/PLAN_v6.4.md`

| Phase | Goal | Status |
|-------|------|--------|
| 6.4.1 | Live App: Render Markdown Tables (+ live-feed & mobile-scroll fixes) | Done |
| 6.4.2 | PDF Export: Render Markdown Tables | Done |

---

## v_SEO Next.js + SEO - Planned

Full spec: `docs/plan_archive/PLAN_SEO.md`

| Phase | Goal | Status |
|-------|------|--------|
| v_SEO-1 | Architecture Decision | Planned |
| v_SEO-2 | Template Page System | Planned |
| v_SEO-3 | SSR Shared Run Pages | Planned |
| v_SEO-4 | Marketing And SEO Foundation | Planned |
| v_SEO-5 | App Router And Private App Integration | Planned |
| v_SEO-6 | Deployment, Analytics, And Verification | Planned |

---

## Version archive

| Version | Theme | Plan |
|---------|-------|------|
| v1.0 | Initial architecture | `docs/plan_archive/PLAN_v1.0.md` |
| v1.1 | Unified dashboard UX | `docs/plan_archive/PLAN_v1.1.md` |
| v2.0 | Dark tech minimal redesign | `docs/plan_archive/PLAN_v2.0.md` |
| v3.0 | Slack-style chatroom debate | `docs/plan_archive/PLAN_v3.0.md` |
| v3.1 | Codebase cleanup | `docs/plan_archive/PLAN_v3.1.md` |
| v3.2 | Engagement and threading | `docs/plan_archive/PLAN_v3.2.md` |
| v3.3 | Documentation sync | `docs/plan_archive/PLAN_v3.3.md` |
| v4.0 | UI Foundation | `docs/plan_archive/PLAN_v4.0.md` |
| v4.1 | Persistence and Auth | `docs/plan_archive/PLAN_v4.1.md` |
| v4.1.1 | Cleanup and Reorganisation | `docs/plan_archive/PLAN_v4.1.1.md` |
| v4.2 | Sharing, Export, Roles, and Live Web Research | `docs/plan_archive/PLAN_v4.2.md` |
| v4.3 | Reduce Run Latency | `docs/plan_archive/PLAN_v4.3.md` |
| v4.4 | Live Debate Experience Polish | `docs/plan_archive/PLAN_v4.4.md` |
| v5.0 | New Login, Auth, Admin, and User Settings | `docs/plan_archive/PLAN_v5.0.md` |
| v5.1 | Auth And Settings Polish | `docs/plan_archive/PLAN_v5.1.md` |
| v5.2 | Deferred Auth And Account Features | `docs/plan_archive/PLAN_v5.2.md` |
| v6.0 | Mobile UX | `docs/plan_archive/PLAN_v6.0.md` |
| v6.1 | Advanced Setup Panel Redesign | `docs/plan_archive/PLAN_v6.1.md` |
| v6.2 | Pre-Launch Polish: Rebrand, SEO Foundation, Legal Pages, and OG Sharing | `docs/plan_archive/PLAN_v6.2.md` |
| v6.3 | Mobile Follow-up & Debate View Fixes | `docs/plan_archive/PLAN_v6.3.md` |
| v6.4 | Markdown Table Rendering (App + PDF Export) | `docs/plan_archive/PLAN_v6.4.md` |
| v_SEO | Next.js + SEO | `docs/plan_archive/PLAN_SEO.md` |
| Marketing | TeamStoa Brand, Launch, And Growth | `docs/local_only/PLAN_Marketing.md` |
