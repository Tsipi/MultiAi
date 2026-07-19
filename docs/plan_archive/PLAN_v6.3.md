# Version 6.3 - Mobile Follow-up & Debate View Fixes

**Scope:** Bug-fix session covering the mobile follow-up flow, the Full Debate transcript view, saved-session team labeling, OpenRouter call reliability, and sidebar title-generation cost trimming.
**Status:** Phase 6.3.1 Done. Phase 6.3.2 Done (scope reduced to a sort-only fix — see phase notes). Phase 6.3.3 Done.

---

## Phase 6.3.1 - Mobile Follow-up & Debate View Fixes — Done

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

## Phase 6.3.2 - Follow-up Thread History & Ordering — Done

**Goal:** Let a user with several chained follow-ups see the score and position of every step in the thread, not just the immediate parent's.

### What was tried and reverted

A full implementation was built and verified (add `final_score` to `list_sessions()` in both stores, thread it onto `SessionPreview`, a `threadPositionFor()` helper deriving 1-based position + thread total client-side from the in-memory `sessions` array, and a "Follow-up N of M" badge on the "Previous Answer" card via a new `positionBadge` prop on `PinnedAnswer.tsx`). The design avoided any new endpoint or backend walking helper (see git history on this file for the original write-up).

**Reverted per user review of the live UI:** the badge wasn't wanted, and its counting was confusing in practice — it numbers the root question as step 1, so a thread with 2 follow-ups reads "Follow-up 3 of 3" even though only 2 items are actually labeled "Follow-up" in the sidebar. Given the badge was the only consumer of the `final_score`/`threadPosition` plumbing, all of it was removed rather than left as unused code: `final_score` additions to both `list_sessions()` stores, `SessionPreview`/`toPreview`/`services/api.ts` types, `threadPositionFor()` and its tests, and the `threadPosition` prop chain through `App.tsx` → `AnswersPanel.tsx` → `ChatPanel.tsx` → `SessionPromptBlock.tsx` → `PinnedAnswer.tsx`.

### What shipped

- [x] `groupByThread` (`AnswersPanel.tsx`) now sorts each thread's `runs` chronologically (oldest first) instead of inheriting the newest-first order of the full session list — a small, independent readability fix for the sidebar accordion, kept on its own merit since it doesn't depend on anything else that was reverted.

**Verified:** `tsc --noEmit`, `vitest run` (24/24), `npm run build`, `python -m compileall`, and `pytest tests/` (56/57 — one pre-existing unrelated failure) all clean after the revert.

---

## Phase 6.3.3 - OpenRouter Call Reliability & Title-Generation Cost Trimming — Done

### Tasks

- [x] Fix `EXPORT_TITLE_MODEL` default id typo (`openrouter/gpt-oss-120b` -> `openai/gpt-oss-120b`) — was failing every `/api/title` call with HTTP 400 "not a valid model ID"
- [x] Add explicit `max_tokens` to every OpenRouter call (`call_openrouter` + `web_research.py`), using new `config.py` budget constants, to stop OpenRouter's worst-case-cost preflight check from blocking on a model's large default max output (e.g. Claude Sonnet's 65536-token default) even when the key has balance for the real (much smaller) completion — actual token usage and billing are unaffected
- [x] Raise `title_max_tokens` (60 -> 300) — `openai/gpt-oss-120b` is a reasoning model that spends part of its token budget on internal reasoning before emitting visible text; 60 tokens left no room for actual output, so `content` came back `null`
- [x] Harden `call_openrouter` against empty/`null` response content: raises a clear `LLMCallError` with the provider's `finish_reason` instead of crashing on `len(None)` — protects any future call to a reasoning model or a content-filtered response, not just the title endpoint
- [x] Sidebar session title: skip the `/api/title` LLM call entirely for questions of 37 characters or fewer — short questions already read fine as the raw-question fallback title, so calling an LLM to shorten them further was an unnecessary request. Added `shouldRequestGeneratedTitle()` gate in `useConsultRun.ts`; only the Markdown/PDF export titles are unaffected (PDF was already non-LLM; Markdown export still always calls `/api/title`)

**Verified:** `pytest tests/` (56/57 — one pre-existing unrelated failure), `vitest run` (9/9 for `useConsultRun.test.ts`), `tsc --noEmit` clean, manual reproduction of all three backend errors resolved by the user.
