# PLAN.md

**Version:** v3.3 — Codebase Cleanup & Documentation Sync  
**Date:** 2026-06-02  
**Scope:** Close out v3.2 leftovers, align all docs, prepare for v4.0  
**Out of scope:** Backend changes, routing, V4 features, database, authentication

---

## Goals

1. Complete remaining unfinished v3.2 tasks (V3.2.3).
2. Defer tasks that won't be done this cycle (V3.2.5 export, V3.2.4 auth).
3. Update `docs/plan_archive/PLAN_v3.2.md` with final task statuses.
4. Create `ROADMAP.md` with a full version history.
5. Verify `CLAUDE.md` and `README.md` reflect the current codebase state.
6. Archive this plan as `docs/plan_archive/PLAN_v3.3.md` when complete.

---

## Task Checklist

### Phase A — Complete v3.2 leftovers

- [x] **V3.2.1** — Final answer prompt redesign (`FINAL_SYNTHESIS` in `prompts.py`) — done in prior sprint
- [x] **V3.2.2** — Session thread view in sidebar (`Sidebar.tsx` groups by `thread_id`) — done in prior sprint
- [x] **V3.2.3** — CommandBar empty-state tagline — added hero line to `CommandBarHeaderRow.tsx`
- [x] **V3.2.4** — Authentication — **deferred** (high risk; provider undecided)
- [x] **V3.2.5** — Export full debate — **deferred** (low priority; will revisit in v4)

### Phase B — Documentation sync

- [x] Update `docs/plan_archive/PLAN_v3.2.md` with final task statuses
- [x] Create `ROADMAP.md` with v1 → v4 high-level roadmap
- [x] Verify `CLAUDE.md` reflects current architecture and component list — no changes needed
- [x] Verify `README.md` is consistent with current feature set — updated run commands and N-agent note
- [x] Archive this file as `docs/plan_archive/PLAN_v3.3.md`
- [x] Set `PLAN.md` to point at the new active plan (v4.0)

---

## Outcome

All v3.2 and v3.3 tasks resolved. Codebase documentation is aligned. v4.0 planning is ready to begin.  
Active plan: `docs/plan_archive/PLAN_v4.0.md`
