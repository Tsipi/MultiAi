# Version 6.3 - Mobile Follow-up & Debate View Fixes

**Scope:** Bug-fix session covering the mobile follow-up flow, the Full Debate transcript view, and saved-session team labeling.
**Status:** Phase 6.3.1 complete. Phase 6.3.2 not started (idea only).

---

## Phase 6.3.1 - Mobile Follow-up & Debate View Fixes — complete

### Tasks

- [x] Fix "Send follow-up" button hidden behind the mobile bottom nav (`MobileFollowupSheet.tsx` z-index) and auto-close the sheet on submit so the live activity feed is visible while it runs
- [x] Fix "Full Debate" message text cutting off mid-word on mobile — message list used CSS Grid without `min-w-0`, letting bubbles overflow and get clipped (`ChatPanel.tsx`, `DebateActivityPrimitives.tsx`)
- [x] Redesign "Previous Answer" (shown on follow-ups) to match the "Final Answer" card, including a score badge — reused `PinnedAnswer` via a new `label` prop, collapsed by default (`PinnedAnswer.tsx`, `SessionPromptBlock.tsx`)
- [x] Add `source_final_score` end-to-end so the previous-answer score badge has real data — threaded through `DebateSession`, `ConsultRequest`/`ConsultResponse`, `ConsensusEngine`, and the frontend types/API layer. Persists via the existing JSON-blob session store, no migration needed
- [x] Fix saved sessions showing the wrong team name (e.g. "Answered by your Programmer Team" on an unrelated run) — compose-time `activeTemplateId` was leaking into any later-viewed session because `selectSession` never reset it, and the Settings default-team preference applied itself even when deep-linking into an existing run (`App.tsx`)
- [x] Remove duplicated team-name display on "Viewing saved answer" — the template chip appeared both next to the title and again as plain text below; now shows once, inline in "Answered by your [chip]" (`SessionPromptBlock.tsx`)
- [x] Add a team-template icon badge to each session card in the "Team Answers" sidebar. Final approach: sessions now store `team_template_id` explicitly at run time (`DebateSession`, `ConsultRequest`/`ConsultResponse`, `ConsensusEngine`, `app.py`, no DB migration needed), and `/api/sessions` returns it for every row so the badge shows immediately without loading each session. For sessions saved before this field existed, the backend also includes the raw writer/critic cast for just those legacy rows, so the frontend can still infer a template the same way the main panel does (`AnswersPanel.tsx`, `db_session_store.py`)

**Note:** Sessions saved before this work will show `Score 0.0 / 10` on "Previous Answer" — expected, since `source_final_score` didn't exist yet. All new follow-ups carry the real score forward.

**Verified:** `tsc --noEmit`, `vitest run` (22/22), `npm run build`, `python -m compileall`, and `pytest tests/` (56/57 — one pre-existing unrelated failure) all clean.

---

## Phase 6.3.2 - Follow-up Thread History & Ordering — not started (idea)

**Goal:** Let a user with several chained follow-ups see the score and position of every step in the thread, not just the immediate parent's.

### Idea

- Walk the `parent_session_id` chain on demand to reconstruct question → answer → score for a whole thread, rather than duplicating a growing score array onto every session.
- Once that lookup exists, "Follow-up N of M" numbering and a "thread timeline" view both fall out of it for free.

### Tasks

- [ ] Backend helper to walk `parent_session_id` back to `root_question`, returning an ordered `{session_id, question, final_score, timestamp}` list
- [ ] Expose via a new endpoint or embed in the session response
- [ ] "Follow-up N of M" badge near the score badges
- [ ] Optional expandable "thread timeline" panel
