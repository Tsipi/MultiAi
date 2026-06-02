# MultiAi Roadmap

High-level version history and future direction.  
Detailed specs for each version live in `docs/plan_archive/PLAN_vX.x.md`.

---

## Shipped

### v1.0 — Initial Architecture (2026-03-29)
Three-area dashboard concept: left sidebar (session history), center builder (compose), right output (final answer + debate).  
Core multi-agent loop: Writer → Critics → Scorer → Summarizer → refine until consensus.

### v1.1 — Unified Dashboard UX
Merged the create and view flows into a single panel. Reduced layout friction, improved usability, prepared for SaaS growth.

### v2.0 — Dark Tech Minimal Redesign
Replaced generic SaaS UI with a sharp, premium aesthetic. Removed card clutter, strengthened visual hierarchy, established brand identity.

### v3.0 — Slack-Style Chatroom Debate (2026-04-09)
Replaced the static output panel with a live chatroom feed. Each agent posts messages as the debate progresses; round dividers act as channel separators; the final answer is pinned at the top. Scales naturally to N agents.

### v3.1 — Codebase Cleanup (2026-05-14)
Removed dead components, refactored `App.tsx` into custom hooks, updated `CLAUDE.md` to reflect actual codebase state.

### v3.2 — Engagement & Threading (2026-05-27)
Final answer prompt redesigned (structured sections + dry humor). Session sidebar groups threads by `thread_id`. CommandBar empty-state tagline added.  
Deferred: full-debate export (→ v4), authentication (→ v4).

### v3.3 — Documentation Sync (2026-06-02)
Aligned all planning documents, created ROADMAP.md, verified CLAUDE.md and README accuracy. Gate before v4.

---

## In Progress

### v4.0 — UI Foundation
**Theme:** Frontend-only. Real URLs and team templates. No DB changes.

| Phase | Goal |
|-------|------|
| 1 — Empty-state UX | `New Run` button in TopNav — **done** |
| 1b — Client-side routing | React Router v6; `/app/new`, `/app/run/:id`; shareable URLs |
| 2 — Team Templates | Template chips + drawer; 8 hardcoded starter templates |

Full spec: `docs/plan_archive/PLAN_v4.0.md`

### v4.1 — Persistence & Authentication
**Theme:** Replace JSON file storage with a real DB. Add user accounts.

| Phase | Goal |
|-------|------|
| 3 — Backend persistence | Real DB (Runs, Outputs, TeamConfigs); sidebar from API |
| 3b — Authentication | Supabase Auth or Clerk; per-user session scoping |

Full spec: `docs/plan_archive/PLAN_v4.1.md`

### v4.2 — Sharing & Export
**Theme:** Make runs shareable externally. Complete the full-debate export.

| Phase | Goal |
|-------|------|
| 4 — Public sharing | Share button; `/shared/:slug` public page; unshare action |
| 4b — Full debate export | PDF/markdown optionally includes all debate rounds |

Full spec: `docs/plan_archive/PLAN_v4.2.md`

---

## Planned

### v5.0 — Next.js Migration (after v4 is complete)
**Theme:** Move public/marketing surface to Next.js for SSR, SSG, and proper SEO.

The v4 React Router structure maps cleanly to Next.js App Router routes, making migration straightforward when the time comes.

| Concern | v4 (React Router v6) | v5 (Next.js) |
|---------|----------------------|--------------|
| Private app | SPA (`/app/*`) | `app/` dir, client components |
| Public sharing | `/shared/:slug` client-only | `app/shared/[slug]/page.tsx` — SSR |
| SEO pages | Not possible in SPA | `app/templates/[slug]/page.tsx` — SSG |
| Metadata / OG tags | Manual | `generateMetadata()` built-in |
| Sitemap | Manual | `sitemap.ts` built-in |

**Prerequisite:** Complete all v4 phases first. Do not migrate until the product is stable and SEO/sharing are the clear next bottleneck.

---

## Backlog (future)

- Authentication — Supabase Auth or Clerk; per-user session storage
- Per-agent role/tone/model fully passed to backend debate loop
- Save personal team templates
- Billing / usage limits
- Mobile-responsive layout
