# PLAN.md

**Active version:** v4.1.1 — Cleanup & Component Reorganisation  
**Previous:** `docs/plan_archive/PLAN_v4.1.md` (completed 2026-06-08)

---

## Active roadmap

| Version | Theme | Scope | Status |
|---------|-------|-------|--------|
| v4.0 | UI Foundation | React Router v6 + Team Templates (frontend only) | **Complete** |
| v4.1 | Persistence & Auth | PostgreSQL, Alembic, fastapi-users, login UI | **Complete** |
| **v4.1.1** | Cleanup & Reorganisation | Component folder move, CORS, session scoping, PLAN sync | **Active** |
| v4.2 | Sharing & Export | Public run pages, full debate export | Not started |
| v5.0 | Next.js + SEO | Migration, template pages, SSR/SSG | Not started |

---

## v4.0 tasks

| Phase | Goal | Status |
|-------|------|--------|
| 1 — Empty-state UX | `New Run` button in TopNav | **Done** |
| 1b — Client-side routing | React Router v6; `/app/new`, `/app/run/:id` | **Done** |
| 2 — Team Templates | Template chips + drawer; 8 starter templates | **Done** |
| 3 — Backend performance & accuracy | Speed fixes + live pricing + follow-up root anchor | **Done** |

### v4.0 Phase 3 — Backend performance & accuracy (done 2026-06-04)

**Speed — parallel scorer + writer refinement**
Scorer and writer refinement were running sequentially each round despite being independent.
Both now run inside `asyncio.gather`, saving ~0.5 s per round.

**Speed — remove per-round relevance validation**
`validate_relevance` was being called once per debate round AND again after final synthesis.
Removed from the loop entirely; the final-answer check in the engine is kept.
Eliminates N redundant Deepseek calls per session.

**Pricing — live rates from OpenRouter**
`costs.py` now fetches `/api/v1/models` at backend startup and caches prices in memory.
All models get accurate rates automatically. Falls back to the hardcoded table if the fetch fails.

**Follow-up — root question anchor**
Each follow-up was using the immediate parent's question as "Original prompt", causing context
drift in chains longer than one hop. Added a `root_question` field to the session and payload;
follow-ups now always anchor to the first question in the thread, regardless of depth.

Full spec: `docs/plan_archive/PLAN_v4.0.md`

---

## Version archive

| Version | Theme | Plan |
|---------|-------|------|
| v1.0 | Initial architecture | `docs/plan_archive/PLAN_v1.0.md` |
| v1.1 | Unified dashboard UX | `docs/plan_archive/PLAN_v1.1.md` |
| v2.0 | Dark tech minimal redesign | `docs/plan_archive/PLAN_v2.0.md` |
| v3.0 | Slack-style chatroom debate | `docs/plan_archive/PLAN_v3.0.md` |
| v3.1 | Codebase cleanup | `docs/plan_archive/PLAN_v3.1.md` |
| v3.2 | Engagement & threading | `docs/plan_archive/PLAN_v3.2.md` |
| v3.3 | Documentation sync | `docs/plan_archive/PLAN_v3.3.md` |
| **v4.0** | UI Foundation | `docs/plan_archive/PLAN_v4.0.md` |
| **v4.1** | Persistence & Auth | `docs/plan_archive/PLAN_v4.1.md` |
| **v4.1.1** | Cleanup & Reorganisation | `docs/plan_archive/PLAN_v4.1.1.md` |
| v4.2 | Sharing & Export | `docs/plan_archive/PLAN_v4.2.md` |
| v5.0 | Next.js + SEO | `docs/plan_archive/PLAN_v5.0.md` (not written yet) |
