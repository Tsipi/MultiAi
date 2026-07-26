# v8.1 — Free-tier quota counter (live + correct) — Done

Part of v8.0 Marketing & Launch. Strategy context: `docs/local_only/PLAN_v8.0_marketing_suggestions.md`. Index:
`PLAN_v8.0.md`.

**Decision:** launch **free for now** (no billing / no Pro tier — Section 5 deferred), but keep the
free-tier quota as a **cost cap**. Before anything else, the "Runs this month N / 20" counter in the
left sidebar ([ConsensusRunsSidebar.tsx:104-115](frontend/src/components/layout/ConsensusRunsSidebar.tsx#L104-L115))
must be live and correct. Audit found three bugs; all fixed.

## Bug 1 — counter doesn't update after a run
`useAuth` fetches `/api/me` only when the token changes (login/page-load)
([useAuth.ts:34-56](frontend/src/hooks/useAuth.ts#L34-L56)); nothing re-fetches it when a run
finishes ([App.tsx](frontend/src/App.tsx) `onRunComplete`). The backend increments the count on the
server ([app.py:272](backend/api/app.py#L272)), but the sidebar stays frozen at the login-time value
until reload.

- [x] Exposed a `refreshProfile()` from `useAuth` (extracted the `/api/me` fetch into a callback).
- [x] Call it in `App.tsx` `onRunComplete` and in all three run-error catches (so a 429 also corrects
  the counter). Counter now increments live, no reload.

## Bug 2 — stale count at the start of a new month
The monthly reset only runs inside `_check_and_increment_quota` (on run start,
[app.py:255-263](backend/api/app.py#L255-L263)), but `/api/me` returns `user.runs_this_month` raw
([app.py:145](backend/api/app.py#L145)). So on the 1st of a new month, before starting a run, the
counter can still show last month's number (e.g. "20 / 20", amber) even though the quota reset.

- [x] Added `_runs_reset_due(reset_at, now)` helper; `/api/me` now returns `0` for `runs_this_month`
  when `runs_reset_at` is a prior month/year — corrected read without needing a run.

## Bug 3 — clarification double-counts
Both `/api/consult` and `/api/consult-stream` incremented the quota **before** the engine ran. A
question that returns a **clarification** does no debate, yet still incremented; answering the
clarification hits the endpoint again and increments a second time. So one clarified question counted
as 2 (user-confirmed: 2 questions showed "3 / 20").

- [x] Split `_check_and_increment_quota` into `_check_quota` (429 if over, applies rollover, no
  increment — called **before** the engine in both `/api/consult` and `/api/consult-stream`) and
  `_increment_quota` (called **after** the engine, only when `not session.needs_clarification`). A
  clarification return counts 0; the resumed debate counts 1.

## Verify — user-confirmed working
- [x] Run a debate → sidebar counter increments immediately (no reload).
- [x] Ask a question that triggers a clarification, then answer it → counter goes up by 1, not 2.
- [x] `npx tsc --noEmit` clean; `backend/api/app.py` parses. No existing tests reference the quota
  logic.
- [ ] Not re-verified this session: quota-limit 429, prior-month rollover, superuser (logic unchanged
  in behavior for these paths).
