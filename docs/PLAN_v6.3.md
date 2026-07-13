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
- [x] Fix a saved session showing the wrong team name (e.g. "Answered by your Programmer Team" on a run that actually used a different/no template) — `activeTemplateId` is compose-time state ("which template is selected for the *next* question"), but it was leaking into the display label for *any* currently-viewed saved session because (a) `selectSession` never reset it when switching sessions, and (b) the Settings page's default-team preference (`pref_team_template`) set it unconditionally on login, even while deep-linked straight into an existing run. Now `selectSession` clears `activeTemplateId` so the label is always re-inferred from that session's own recorded writer/critic names and models, and the login preference-apply effect skips setting `activeTemplateId`/`team` when the current URL is already `/app/run/:id` (`App.tsx`)
- [x] Remove duplicated team-name display on the "Viewing saved answer" header — the violet `TemplateNameChip` badge appeared both next to the "Viewing saved answer" title and again as plain text in the "Answered by your ... team" line below it. Dropped the chip from next to the title and moved it inline into the "Answered by your [chip] · date · rounds." sentence instead, so the team name (with its hover tooltip) appears exactly once (`SessionPromptBlock.tsx`)
- [x] Add a small team-template icon badge to each "Team Answers" session card in the sidebar (desktop and mobile), positioned overlapping the top border — shown only when that session's own writer/critic names and models match a known team template (via `inferTeamTemplateId`), using the existing `TEMPLATE_ICONS` map. Restructured the compact/mobile card (`listSelectOnly`) to wrap it in a non-clipping `relative` container so the badge isn't cut off by the card's `overflow-hidden` (`AnswersPanel.tsx`)
- [x] Move the badge to the right side of the card (was left) and extend it to follow-up cards in the same thread — a follow-up's own `ConsultResult` is only loaded once opened, so a per-card lookup showed no badge on unopened follow-ups even when they used the same team as their thread's parent. Added `resolveThreadTemplateIcon()`, which checks every session in a thread (parent + all follow-up runs) for whichever one already has a cached result and shares that one icon across the whole thread, so follow-ups get the badge as soon as any session in their thread has been viewed (`AnswersPanel.tsx`)

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
