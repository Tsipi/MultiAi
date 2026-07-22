# Version 7.0 - Cleanup and fixing the follow up flow

**Scope:** Fix the follow-up composition/run flow (redundant button, confusing post-submit
screen, stale final answer at the bottom, low-value clarification subtitle, clarification
continue screen) and resolve the Scorer badge color/direction confusion.
**Status:** In Progress (7.0.1, 7.0.2, 7.0.3, 7.0.5 Done; 7.0.4, 7.0.6, 7.0.7, 7.0.8 Planned)
**Depends on:** v6.4 (Markdown Table Rendering) merged
**Verified:** 7.0.1/7.0.2/7.0.3/7.0.5 — `npx tsc --noEmit` clean and `npm run build` succeeds (frontend). Follow-up + clarification flow user-tested with live OpenRouter run (credit restored). `uv run pytest tests/` not run this session (frontend-only changes).

## Why this happens

The follow-up experience was assembled incrementally across the v6.x line. The result is a mix
of overlapping affordances and stale state that surface once a user actually runs a follow-up:

- Two "ask/send follow-up" affordances can be visible at once — the desktop compose area inside
  `SessionPromptBlock` and the separate `Ask follow-up` button below it — because the button's
  visibility is gated only on `isSavedAnswer && onAskFollowup`, never on whether the compose area
  is already open.
- After submitting a follow-up that triggers a clarification, the page keeps the previous run's
  full **Final Answer** pinned at the bottom while a new clarification and "Team is working…"
  state appear higher up. The two competing "answers" on one screen read as broken.
- The clarification card's subtitle (the raw `clarification_reason` text, e.g. "The term 'matter
  performance' is ambiguous—it could refer to…") is model-authored reasoning, not guidance the
  user needs, and reads as noise.
- The `ScoreBadge` has no "first score / no prior score" state: on Round 1 `previousScore` is
  `null`, so both `improved` and `same` evaluate false and the badge falls through to the
  `dropped` branch — rendering a red badge with a `▼` down-arrow even though the score did not
  drop and consensus was in fact reached (green banner). Score color and consensus color
  contradict each other on the same screen.

---

## Phase 7.0.1 - Hide/disable the redundant "Ask follow-up" button while the compose area is open — Done

**Problem (user):** After typing into the "Follow-up task or question" field, the standalone
`Ask follow-up` button in the bottom-right corner is still shown. It is redundant with the open
compose area and its `Send follow-up` button, and it is confusing.

**Where:** [SessionPromptBlock.tsx](frontend/src/components/session/SessionPromptBlock.tsx) —
the `isSavedAnswer && onAskFollowup` button block appears twice (once in `followupContextContent`
around lines 179-190, once in `standardContent` around lines 308-319). Both render regardless of
`followupOpen`.

**Goal:** When the follow-up compose area is open (`followupOpen === true`), the separate
`Ask follow-up` button must not be a competing call to action.

### Tasks

- [x] Hide the button entirely when `followupOpen` is true (decision confirmed — hide, not
  disable): gated both `Ask follow-up` button blocks in `SessionPromptBlock` on
  `isSavedAnswer && onAskFollowup && !followupOpen`.
- [x] Verified the mobile path: `MobileFollowupSheet` is a separate slide-up modal keyed on
  `followupOpen` and `MobileBottomNav` has no `Ask follow-up`, so the `!followupOpen` gate covers
  all widths — no double affordance on mobile, no changes needed.
- [x] Closed the desktop close/cancel gap (there was no way to collapse the desktop compose panel):
  added a `Cancel` button beside `Send follow-up` in both compose panels, wired to the existing
  `onCloseFollowup` handler (disabled while `loading`), and threaded `onCloseFollowup` from
  `ChatPanel` into `SessionPromptBlock` via a new prop. (This overlaps 7.0.2's "collapse or lock the
  compose form" task — do not re-do it there.)
- [x] `npx tsc --noEmit` clean. Manual check (user to run): open follow-up → only `Send follow-up`
  visible, `Ask follow-up` gone; click `Cancel` → panel collapses and `Ask follow-up` returns.

Note: on submit the panel does not collapse immediately — it stays showing the "Team is working…"
state until the run completes (close happens post-completion at `App.tsx` `runFollowup`). Cleaning
up that post-submit working screen is deferred to Phase 7.0.2 (user confirmed).

---

## Phase 7.0.2 - Fix the confusing post-submit ("Send follow-up") screen — Done

**Problem (user):** Clicking the purple `Send follow-up` button leads to a confusing screen — the
transition between "form filled" and "team working / clarification requested" is not legible.

**Where:** `SessionPromptBlock` compose area (`loading` → "Team is working…" label at
[SessionPromptBlock.tsx:166](frontend/src/components/session/SessionPromptBlock.tsx#L166) and
[:295](frontend/src/components/session/SessionPromptBlock.tsx#L295)); run wiring in
`useConsultRun` / `useFollowup`; App orchestration in `App.tsx`.

**Goal:** After `Send follow-up`, the user should land on a clear, single-focus state: "your
follow-up was sent, the team is working," with the compose form collapsing/locking rather than
staying editable alongside a new clarification.

### Tasks

- [x] Mapped the sequence: `runFollowup` left `followupOpen` true until *after* `await execute`, so
  the locked compose form stayed on screen beside the clarification/live run for the whole run.
- [x] Collapse the compose form on submit: moved `setFollowupOpen(false)` to the start of
  `runFollowup` (values are captured into `mergedInstruction` first) and removed the post-completion
  one — the form now closes immediately, leaving one active region.
- [x] Removed the desktop follow-up textarea `onFocus` scrollIntoView jump in both compose panels
  (`SessionPromptBlock`).
- [x] "Team is working…" prominence delivered via 7.0.3: with the standalone hero suppressed, the
  `loading`-tied "Live Follow-up Run" panel is the primary visible section during the run.
- [x] `npx tsc --noEmit` clean, `npm run build` succeeds; both paths (straight-to-debate and
  clarification) user-tested.

---

## Phase 7.0.3 - Live follow-up run shows the follow-up Question card; suppress the duplicate previous answer so "Live Follow-up Run" is primary — Done

**Problem (user):** When a follow-up run starts, the previous run's **Final Answer stays displayed
in full and prominent** — its heading, body, **score badge, and the entire export/action row
(copy · md · pdf · share · "Include full debate" · Score · tokens · $cost)** — while the new
"Live Follow-up Run" section sits below it. The old answer dominates the screen and the live run
is easy to miss.

**What the user wants (confirmed):** Relocate the **whole previous Final Answer card as one unit** —
the answer body, its **score**, **and** the export/stats/downloads row — into a single
**collapsed ("closed") card**, and place that collapsed card **inside the Question card, directly
after the Clarification block**. After submitting the follow-up, the primary section the user sees
below the Question card is the **"Live Follow-up Run"** section, not the old answer.

**Target follow-up layout (confirmed with user):**
1. Title/subtitle — "Viewing…", team badge, date.
2. **Question card** (`SessionPromptBlock`) — Original question → Live Web Research Used →
   Clarification (question + "Your answer") → **collapsed previous Final Answer card (with score +
   export buttons), placed right after the Clarification**.
3. **"Live Follow-up Run"** section — the open, primary section below the Question card.

**Where:**
- The Question card is `SessionPromptBlock`
  ([SessionPromptBlock.tsx](frontend/src/components/session/SessionPromptBlock.tsx)); its follow-up
  layout is `followupContextContent`. That block **already renders a collapsed "Previous Answer"
  card** ([:88-93](frontend/src/components/session/SessionPromptBlock.tsx#L88-L93)) via
  `PinnedAnswer` — BUT it is currently positioned **before** the follow-up instruction and
  clarification, and it **lacks the export buttons**. The clarification block is at
  [:108-129](frontend/src/components/session/SessionPromptBlock.tsx#L108-L129).
- The standalone Final Answer card the user circled is rendered lower down in
  [ChatPanel.tsx](frontend/src/components/debate/ChatPanel.tsx): Hero `PinnedAnswer`
  ([:314-324](frontend/src/components/debate/ChatPanel.tsx#L314-L324)) + Stats/downloads row
  (`SessionPromptDownloads` + `Score · rounds · tokens · $cost`,
  [:326-369](frontend/src/components/debate/ChatPanel.tsx#L326-L369)). During a follow-up this is
  a **duplicate** of the answer we are collapsing into the Question card and must be suppressed.
- "Live Follow-up Run" `CollapsiblePanel`:
  [ChatPanel.tsx:371-379](frontend/src/components/debate/ChatPanel.tsx#L371-L379) (`title` is
  already `loading ? "Live Follow-up Run" : "Live Debate Replay"`).
- `PinnedAnswer` ([PinnedAnswer.tsx](frontend/src/components/session/PinnedAnswer.tsx)) already
  supports collapsed rendering via `previewWhenClosed`.

**Goal:** For a follow-up (in-flight and saved-follow-up view), the previous Final Answer appears
**only once** — as a collapsed card inside the Question card, right after the Clarification,
carrying its score and export buttons — and the "Live Follow-up Run" section is the open, primary
section below. No standalone full-height previous answer, no duplicate.

### Tasks

**Implementation note:** The root problem was that during a live follow-up run `displayResult` is the
parent session (not a follow-up), so the Question card rendered `standardContent` and the typed
follow-up instruction "disappeared." Solved by driving the Question card with a **synthetic
in-progress follow-up result** so the live run reuses the existing `followupContextContent` (the
same layout as a saved follow-up) — original question → collapsed previous answer → follow-up
instruction → clarification. This also naturally satisfies the "no standalone previous answer"
goal via hero suppression.

- [x] Added `buildInProgressFollowupResult(parent, …)` in `consultHelpers.ts`: a follow-up-shaped
  result with empty `final_answer` and populated `source_*` / `followup_instruction` /
  `root_question` / optional clarification Q&A.
- [x] `App.tsx`: new `liveFollowupResult` state; `displayResult` prefers it; set in `runFollowup`
  (instruction) and updated in `resumeWithClarification` (answered clarification); cleared on
  completion (`onRunComplete`), on error, and on fresh navigation (`selectSession`, `/app/new` URL
  branch, `runConsult`, `startNewQuestion`).
- [x] `ChatPanel.tsx`: `suppressHero = result.is_followup && !result.final_answer` hides the
  standalone Hero + downloads row during the in-flight follow-up (previous answer shows collapsed in
  the Question card). On completion the real answer is present, so the hero returns for the new
  answer.
- [x] Result: during the live run the Question card shows the follow-up context and "Live Follow-up
  Run" is the primary section; on completion the new answer is the open Final Answer card with no
  duplication. Saved-follow-up view and brand-new-question runs unchanged. User-tested.
- [x] Extra fix (follow-up control locking): the `Ask follow-up` button in `SessionPromptBlock` now
  has `disabled={loading}` so it can't be clicked while a run is in progress.
- [~] **Dropped per user decision ("keep current order"):** moving the collapsed previous answer to
  *after* the Clarification, and adding the score/export (`SessionPromptDownloads`) row into that
  collapsed card. The live run mirrors the current saved-view order (previous answer before the
  follow-up instruction, no export buttons on it), which the user confirmed is what they want.

---

## Phase 7.0.4 - Replace the low-value clarification subtitle

**Problem (user):** The clarification card's subtitle looks bizarre and is not valuable — it shows
raw model reasoning like "The term 'matter performance' is ambiguous—it could refer to specific
performance metrics (e.g., speed, accuracy), use cases…". This is noise, not guidance.

**Where:** the `clarification_reason` render in `SessionPromptBlock`
([:113-115](frontend/src/components/session/SessionPromptBlock.tsx#L113-L115) and
[:216-218](frontend/src/components/session/SessionPromptBlock.tsx#L216-L218)) and the live
clarification prompt component (the "CLARIFICATION NEEDED" card shown during a run). Backend
source: `backend/consensus/intent.py`.

**Goal:** The clarification card leads with the actual question the user must answer, and either
drops the reasoning subtitle or replaces it with a short, useful framing.

### Tasks

- [ ] Remove the `clarification_reason` subtitle entirely from the UI (decision confirmed — no
  fixed-label replacement); show only the clarification question + options.
- [ ] Apply consistently across: the live clarification card, the stored-clarification render in
  `followupContextContent`, and the standard-content clarification render.
- [ ] Keep `clarification_reason` in the persisted result and PDF/Markdown exports unchanged
  (decision confirmed — UI-only hide, no backend/data change).
- [ ] Manual check: trigger a clarification; confirm the card reads as a clear question, no raw
  model reasoning.

---

## Phase 7.0.5 - Continue on a follow-up clarification must not drop back to the empty "new run" home screen — Done

**Problem (user):** On a **follow-up** question, after answering the clarification and pressing
`Continue`, the page **jumps to the empty new-run home screen** — the "Hey, Admin. Ready to Dive
in?" hero, the compose bar, the "PICK A TEAM" chips, and "Mission Initializing…" — as if starting
a brand-new run. The live card lower down still confirms it is actually a follow-up ("Resuming
with clarification · Web research skipped · Team assembled"), so the session framing (parent
question, previous answer, clarification) is lost and the screen misrepresents what is happening.

**Root cause:** `resumeWithClarification`
([App.tsx:266-299](frontend/src/App.tsx#L266-L299)) — the `Continue` handler — calls
`setResult(null)` ([:275](frontend/src/App.tsx#L275)) and `setSelectedId(null)`
([:276](frontend/src/App.tsx#L276)). The new-run compose hero is rendered
`{!displayResult && <CommandBar … />}` ([App.tsx:583](frontend/src/App.tsx#L583)), so clearing the
result makes `displayResult` falsy and the empty home hero + team picker appears while `ChatPanel`
streams the follow-up below. The handler already distinguishes the follow-up case via
`pending?.payload?.is_followup` ([:272](frontend/src/App.tsx#L272)), so the fix has a clean hook.

**Goal:** After `Continue` on a follow-up, the screen stays in the follow-up/session context —
Question card (with the collapsed previous answer per 7.0.3) on top, "Live Follow-up Run" as the
primary section — and the empty "Ready to Dive in?" compose hero + team picker never appears.

### Tasks

- [x] In `resumeWithClarification`, guarded the null-out: `const isFollowupResume =
  Boolean(pending?.payload?.is_followup)` and `if (!isFollowupResume) { setResult(null);
  setSelectedId(null); }` — a follow-up resume keeps the session mounted.
- [x] Robust belt-and-suspenders: exposed `isResuming` from `useConsultRun` and gated the hero on
  `{!displayResult && !isResuming && <CommandBar … />}`, so the home hero cannot render during a
  follow-up resume even if session state momentarily blanks (e.g. via the `/app/new` URL-sync
  effect). Brand-new-question resumes keep `isResuming` false, so their hero still shows.
- [x] Post-Continue hierarchy delivered together with 7.0.3: the live follow-up context Question
  card on top, "Live Follow-up Run" primary; clarification duplicate avoided (live `clarifyBox`
  shows while `clarificationPrompt` is set; the synthetic's stored clarification shows only after
  `Continue` clears it).
- [x] `npx tsc --noEmit` clean; full flow (Send → clarification → Continue) user-tested — no home
  hero appears.

---

## Phase 7.0.6 - Fix the Scorer badge color/direction confusion

**Problem (user):** The Scorer shows the score in **red with a `▼` down-arrow** (e.g. "▼ 8.0 / 10")
while the same round's consensus banner is **green** ("Agreement reached at Round 1 — Score
8.0 / 10"). The two colors contradict each other and imply the score dropped when it did not.

**Root cause:** In
[ScoreBadge.tsx:12-15](frontend/src/components/primitives/ScoreBadge.tsx#L12-L15), on the first
score `previousScore` is `null`, so `improved` and `same` are both `false` and the badge falls
through to the `dropped`/else branch — red background and `▼` arrow
([:41](frontend/src/components/primitives/ScoreBadge.tsx#L41),
[:44](frontend/src/components/primitives/ScoreBadge.tsx#L44)). There is no dedicated "first score,
nothing to compare" state.

**Goal:** A first/only score renders in a neutral (not red, not down-arrow) state, and — when the
score meets the consensus threshold — its color agrees with the green consensus banner. Red `▼`
is reserved for a genuine drop vs a prior round.

### Tasks

- [ ] Add a "no prior score" (`previousScore === null`) branch to `ScoreBadge`: neutral styling
  (e.g. the amber/muted `same` treatment or a dedicated neutral), and a neutral glyph (e.g. `•` or
  no arrow) instead of `▼`.
- [ ] Add threshold awareness (decision confirmed): when the score meets/exceeds the consensus
  threshold, render the badge in the same emerald family as `ConsensusReachedBanner` so score and
  banner agree. `ScoreBadge` does not currently receive the threshold — pass it in from the caller.
- [ ] Keep genuine drop (`score < previousScore` with a real `previousScore`) as red `▼`, and
  improvement as emerald `▲`.
- [ ] Manual check: Round-1 consensus run shows a non-red, non-down-arrow score consistent with
  the green banner; a multi-round run still shows ▲/▼ correctly between rounds.

---

## Phase 7.0.7 - Multi-level follow-up lineage: true root question + stacked ancestor answers (UI only)

**Problem (user):** With a chain of follow-ups (`#153 "Compare in a table Full Stack…"` →
`#154 "what about AI engineer"` → `#155 "What about QA Engineer"`), the Question card for `#155`
shows the **immediate parent** ("what about AI engineer") as the "Original question", not the true
root (`#153`). The user wants (a) the **true original question** in context, and (b) to see **all
prior answers with their scores, stacked one after another** in the collapsible "Previous Answer"
card, each labeled with a **short subtitle of the follow-up instruction** that produced it (e.g.
"What about AI Engineer" on the closed card).

**Key findings (feasibility):**
- The **true root is already in the data.** `root_question` is threaded down the chain
  ([App.tsx:247](frontend/src/App.tsx#L247), consumed at
  [consultHelpers.ts:114](frontend/src/lib/consultHelpers.ts#L114)), so `#155` still carries the
  `#153` question. The wrong "Original question" is a **display bug**: `followupContextContent`
  renders `source_prompt` (the immediate parent instruction) at
  [SessionPromptBlock.tsx:81](frontend/src/components/session/SessionPromptBlock.tsx#L81) instead of
  `root_question`.
- Showing the **stacked ancestor answers is display-only and cheap** — the ancestry can be walked
  via `parent_session_id` across already-saved sessions. It does **not** require sending more to the
  debate LLMs.
- **Do not** feed every ancestor answer into the debate context — each answer is ≤ 800 tokens
  against a ~12,000-token session budget, so a deep chain would bloat cost. The debate context stays
  bounded: root question + immediate parent answer + instruction (unchanged — see resolved
  decision 7.0.7).

**Goal:** In the follow-up Question card, the "Original question" shows the true root, and the
collapsed "Previous Answer" card presents the chain of ancestor answers (each with its score and a
short follow-up-instruction subtitle) — all without increasing what the debate system processes.

### Tasks

- [ ] **Fix the "Original question" display:** in `followupContextContent`, source the "Original
  question" from `result.root_question` first (fall back to `source_prompt`/`base_question`/
  `question`). Verify the backend persists and returns `root_question` for saved follow-ups; if it
  does not, thread/persist it (data already computed on the client at submit time).
- [ ] **Add a short subtitle to the closed "Previous Answer" card:** show the follow-up instruction
  that produced that answer (e.g. "What about AI Engineer") on the collapsed header, so the closed
  card is identifiable without expanding.
- [ ] **Stack ancestor answers (UI only):** reconstruct the ancestry by walking `parent_session_id`
  across saved sessions, and render each ancestor's final answer + score inside the collapsible
  card, each with its instruction subtitle. Reuse the collapsed-card treatment from 7.0.3.
  Ordering (oldest → newest vs newest → oldest) is **deferred to visual review** — implement one,
  show the user, adjust.
- [ ] **Confirm the debate context is unchanged:** verify `buildFollowupContext` / `runFollowup`
  still send only root question + immediate parent answer + instruction (no ancestor stacking into
  the LLM payload).
- [ ] **Bound the UI depth** for very long chains (e.g. show the most recent N ancestors with a
  "show earlier" affordance) so the card does not grow unbounded. Exact N is **deferred to visual
  review** — start with a sensible default (e.g. 2-3), show the user, adjust.
- [ ] Manual check: build a 3-level chain; confirm the true root shows as "Original question", the
  closed card shows the instruction subtitle, and expanding lists each prior answer with its score;
  confirm token usage/cost of the debate run did not grow from the ancestry display.

---

## Phase 7.0.8 - Disable the "PICK A TEAM" picker while a run is in flight

**Problem (user):** After submitting a question, while the run shows "Mission Initializing…" (and
during the live run), the **"PICK A TEAM" template picker is still interactive** — the chips remain
clickable and their hover popover still opens. The user can change the team mid-mission, which
should not be allowed once a question has been delivered.

**Root cause:** `CommandBar` computes `busy = disabled || loading`
([CommandBar.tsx:44](frontend/src/components/compose/CommandBar.tsx#L44)) and disables its own
controls with it ([:101-169](frontend/src/components/compose/CommandBar.tsx#L101-L169)), but it
renders `<TemplateShortcutRow … />` at
[CommandBar.tsx:180](frontend/src/components/compose/CommandBar.tsx#L180) **without passing `busy`**.
`TemplateShortcutRow` has no `disabled` prop, so its template `<button>`s keep their `onClick` and
`onMouseEnter` hover popover ([TemplateShortcutRow.tsx:28-50](frontend/src/components/team/TemplateShortcutRow.tsx#L28-L50))
active during the run.

**Goal:** Once a question is submitted, the team picker is disabled (no selecting a different team,
no hover popover) until the run finishes, consistent with the rest of the compose controls.

### Tasks

- [ ] Add a `disabled?: boolean` prop to `TemplateShortcutRow` (and its inner chip component); pass
  `busy` from `CommandBar` ([:180](frontend/src/components/compose/CommandBar.tsx#L180)).
- [ ] When disabled: block `onClick` (no template switch), suppress the `onMouseEnter` popover, and
  apply a disabled visual state (reduced opacity / `cursor-not-allowed`) consistent with the other
  busy controls.
- [ ] Confirm the same holds on any other surface that lets the team be changed mid-run (e.g.
  `AdvancedDrawer` team editing, "Add member") — the team should be locked once a run is in flight.
  Note: follow-up runs intentionally support "Adjust team" before submit; this lock applies only
  while `loading`/`busy`, not before submission.
- [ ] Manual check: submit a question; during "Mission Initializing…" and the live run, confirm the
  team chips are unclickable and show no hover popover; confirm they re-enable after the run ends.

---

## Resolved decisions (confirmed by user)

- **7.0.1:** Hide the redundant `Ask follow-up` button entirely while the compose area is open
  (not disable).
- **7.0.3 (completion behavior):** The collapsed previous-answer card **stays** inside the Question
  card after the follow-up finishes (it does not disappear).
- **7.0.7 (debate context bound):** The debate LLMs continue to receive only the root question +
  the immediate parent's final answer + the new instruction. The multi-ancestor answer history is
  **UI-only** — ancestor answers are not pushed into the model prompt.
- **7.0.4:** Remove the clarification reasoning subtitle from the UI entirely (no fixed-label
  replacement); the clarification question + options stand alone.
- **7.0.4b:** Keep `clarification_reason` in persisted results and PDF/Markdown exports — hide it
  in the live UI only. No backend/data change.
- **7.0.6:** Both — neutral styling when there is no prior score, and emerald styling (matching
  `ConsensusReachedBanner`) when the score clears the consensus threshold. Requires passing the
  threshold into `ScoreBadge`.
