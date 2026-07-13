# Version 6.3 - Mobile Follow-up & Debate View Fixes

**Scope:** Bug-fix session addressing mobile-only rendering issues in the follow-up flow and the
Full Debate transcript view, plus a "Previous Answer" card redesign for follow-up sessions.
**Status:** Phase 6.3.1 complete. Phase 6.3.2 not started (idea only).

---

## Phase 6.3.1 - Mobile Follow-up & Debate View Fixes — complete

### Tasks

- [x] Fix "Send follow-up" button hidden behind the bottom nav bar on mobile — `MobileFollowupSheet`'s backdrop/sheet used `z-[90]`/`z-[95]`, below `MobileBottomNav`'s `z-[100]`. Bumped to `z-[190]`/`z-[195]` (`MobileFollowupSheet.tsx`)
- [x] Auto-close the mobile follow-up sheet on submit so the live chatroom/activity feed is visible while the follow-up runs, matching the desktop inline composer's behavior (`MobileFollowupSheet.tsx`)
- [x] Fix "Full Debate" (Director's Cut) message text getting cut off mid-word on mobile — the message list used CSS Grid (`grid gap-2`) without `min-w-0`, allowing bubbles to overflow the viewport and get clipped by the panel's `overflow-hidden`. Switched to `flex flex-col` (matching the working live-chatroom pattern) and added `min-w-0`/`break-words` down the chain (`ChatPanel.tsx`, `DebateActivityPrimitives.tsx`)
- [x] Restyle "Previous Answer" (shown when viewing a follow-up) to match the "Final Answer" card exactly, including a score badge — reused `PinnedAnswer` via a new `label` prop instead of duplicating markup (`PinnedAnswer.tsx`, `SessionPromptBlock.tsx`)
- [x] Add `source_final_score` end-to-end so the previous-answer score badge has real data to show: `DebateSession` (`models.py`), `ConsultRequest`/`ConsultResponse` (`schemas.py`), `ConsensusEngine.consult()` (`engine.py`), all three call sites in `app.py`, `ConsultPayload`/`ConsultResult` (`types.ts`), the response normalizer (`api.ts`), `buildFollowupContext()` (`consultHelpers.ts`), and `App.tsx`'s `runFollowup()`. Persists automatically via the existing JSON-blob session store — no DB migration needed
- [x] Collapse "Previous Answer" fully closed by default (header only — label, score badge, chevron; no text preview) instead of showing a clamped preview like "Final Answer" does — new `previewWhenClosed` prop on `PinnedAnswer`, set to `false` only for the Previous Answer usage (`PinnedAnswer.tsx`, `SessionPromptBlock.tsx`)

**Note:** Sessions completed before this change will show `Score 0.0 / 10` on "Previous Answer" — expected, since `source_final_score` didn't exist yet when they were saved. All new follow-ups carry the real score forward.

**Verified:** `tsc --noEmit` clean, `vitest run` 22/22 passed, `npm run build` clean, `python -m compileall` clean, `pytest tests/` 56/57 (same pre-existing unrelated `test_load_legacy_session_without_list_fields` failure noted in prior sessions).

---

## Phase 6.3.2 - Follow-up Thread History & Ordering — not started (idea)

**Goal:** Let a user who has asked several chained follow-ups see the score and position of every
step in the thread, not just the immediate parent's score.

### Idea

- Each `DebateSession` already links to its parent via `parent_session_id`/`thread_id`, and each
  session already stores its own `final_score`. Rather than duplicating a growing score array onto
  every session (which can go stale if a session is ever edited/regenerated), walk the
  `parent_session_id` chain in the DB on demand to reconstruct the full sequence of
  question → answer → score for a thread.
- Once that chain lookup exists, numbering follow-ups ("Follow-up 2 of 3") is free — count hops
  from `root_question` to the current session.
- Natural pairing: a small "thread timeline" view (ordered list of every prior Q&A + score in the
  chain) using the same underlying lookup.

### Tasks

- [ ] Add a backend helper to walk `parent_session_id` back to `root_question`, returning an ordered list of `{session_id, question, final_score, timestamp}`
- [ ] Expose it via a new endpoint (e.g. `/api/sessions/:id/thread`) or embed it in the existing session response
- [ ] Add a "Follow-up N of M" badge near the score badges in `SessionPromptBlock`/`PinnedAnswer`
- [ ] Add an optional expandable "thread timeline" panel showing every step in order
