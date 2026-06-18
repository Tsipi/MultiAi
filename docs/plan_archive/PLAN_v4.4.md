# Version 4.4 - Live Debate Experience Polish

**Scope:** Polish the current live debate panel only where it clearly improves the running app.  
**Status:** Planning only. Do not implement until explicitly approved.  
**Depends on:** v4.3 answer modes, timing metadata, `ChannelHeader`, `ChatroomDebateView`, `TypingRow`, `ScoreBadge`, and `parseActivityMessages`.

---

## What v4.3 Already Delivered

The screenshot shows that the app already has the main live debate experience:

- Team/template name in the debate header.
- Live badge.
- Current stage, answer mode, elapsed time, round count, and score.
- Team avatars.
- Agent messages with name, role/specialty, avatar, and provider badge.
- Scorer card and round structure.

v4.4 should not rebuild these pieces. It should remove the remaining friction that users can actually feel.

---

## Current Remaining Problems Worth Fixing Now

- Routine progress messages can still add noise inside the debate feed.
- Setup, web-search, clarification-resume, and completion messages can repeat or distract from the agent conversation.
- User-facing critic text still says generic labels like `Critic 1` and `Critic 2` even though the UI knows the actual people, such as Erika and Sandy.
- Loading/typing can feel too placeholder-like because a skeleton block appears after the typing row.
- Older or unusual debate activity text can still be shown less cleanly than the current happy path.
- The same team avatars appear in many UI locations; this is mostly normal browser behavior, but repeated uncached downloads should be checked once.

---

## Phase 4.4.1 - Compact Routine Progress Messages

**Goal:** Keep the live feed focused on the agents while still showing useful system state.

### What this means

Agent chat should stay as normal messages. Routine app progress, such as "preparing", "web research skipped", or "completed", should be shown as small status notes or grouped into one note when possible.

### Tasks

- [ ] Classify activity items as either agent messages or routine progress notes.
- [ ] Group setup/resume messages into one compact note when several arrive together.
- [ ] Show web research skipped/failed/used at most once in the live feed.
- [ ] Keep important status visible: research started, sources found, consensus reached, errors, completed.
- [ ] Keep unknown activity text visible as a compact note instead of hiding it.

---

## Phase 4.4.2 - Remove Generic Critic Labels From User-Facing Copy

**Goal:** Make debate output read like named teammates are participating, not anonymous critic slots.

### What this means

The live feed message header already shows the real team member name. The live feed message body should match it. For example, instead of:

```text
Round 1: Critic 1 feedback: Vague spatial claims. Critic 1 also flagged...
Writer rewrites based on Critic 1, and Critic 2.
```

show:

```text
Round 1: Erika feedback: Vague spatial claims. Erika also flagged...
Josh rewrites based on Erika and Sandy.
```

### Tasks

- [ ] Replace generic critic labels in live activity text with the actual critic names where the frontend has the cast mapping.
- [ ] Replace writer activity wording with the actual writer name where available.
- [ ] Keep the visual header color/person mapping unchanged: name color, avatar, role, and provider badge still come from the speaker seat.
- [ ] Preserve generic labels only as a fallback when a saved run does not have enough cast data.
- [ ] Make sure fast-mode critic revision lines and normal writer-rewrite lines use the same naming style.
- [ ] Remove `Critic 1` / `Critic 2` from Full Debate / Director's Cut participant sublabels; use the role specialty alone, such as `Local travel expert`, or `Critic` only when no specialty exists.
- [ ] Remove `Critic 1` / `Critic 2` from Full Debate critique section labels/cards when the teammate name is already shown.
- [ ] Keep the underlying Full Debate critique content faithful; this task changes display labels, not the actual critique text.

---

## Phase 4.4.3 - Simplify Typing And Loading States

**Goal:** Make the panel feel live, not like a loading placeholder.

### What this means

The compact row such as "Jue is typing" is useful. The extra skeleton message underneath it is less useful because it looks like fake content and adds visual noise.

### Tasks

- [ ] Remove the skeleton block that appears immediately after `TypingRow`.
- [ ] Replace the initial multi-skeleton loading area with one compact "team is getting started" state.
- [ ] Keep active-agent typing labels.
- [ ] Use simple stage-aware wording where available: drafting, reviewing, scoring, researching, synthesizing.
- [ ] Ensure typing disappears cleanly when the next real event arrives.

---

## Phase 4.4.4 - Preserve Compatibility For Saved And Larger Debates

**Goal:** Make sure live and saved debates render cleanly without expanding this into a major parser project.

### What this means

The app currently recognizes current labels like `Critic 1`, `Critic 2`, and so on. Some older saved activity may use labels like `Critic A` / `Critic B`. If those appear, they should still render as critic messages instead of becoming generic system notes.

### Tasks

- [ ] Preserve current support for numbered critics, especially teams with 3+ critics.
- [ ] Add simple compatibility for old `Critic A` / `Critic B` labels if needed.
- [ ] Check that scorer and final synthesis messages still render in the right style.
- [ ] Check that follow-up/resume activity does not duplicate setup messages.

---

## Phase 4.4.5 - Avatar Fetch And Render Audit

**Goal:** Confirm the repeated avatar entries in DevTools are normal, and fix only if they cause real extra network transfer or UI jank.

### What this means

The same avatar can appear in several places: compose roster, template picker, live header, message feed, typing row, final answer, and saved runs. Seeing the same image name more than once in DevTools can be normal, especially in development mode or when DevTools disables cache. It is only a problem if the browser repeatedly downloads the same bytes instead of serving them from memory/disk cache.

### Tasks

- [ ] Check DevTools with browser cache enabled and confirm whether repeated avatar rows are served from cache.
- [ ] Check whether the same avatars are being unnecessarily remounted during live updates.
- [ ] If real repeat downloads are happening, add the smallest fix: stable keys, avoid unnecessary remounts, or add appropriate image loading/cache hints.
- [ ] Do not optimize avatars further if the repeated entries are cached and have no visible cost.

---

## Phase 4.4.6 - Minimal Verification

**Goal:** Verify the changed behavior without over-investing before the mobile phase.

### Tasks

- [ ] Manually verify one Fast or Balanced live run.
- [ ] Manually verify one follow-up run.
- [ ] Manually verify one saved/replayed run if the parser compatibility task changes rendering.
- [ ] Add only targeted tests for parsing changes that are easy to break, such as grouped progress messages or old critic labels.
- [ ] Skip full mobile QA in this version; mobile layout belongs to v5.0.

---

## Suggested Implementation Order

1. Compact/group routine progress messages.
2. Remove generic critic labels from live activity copy and Full Debate display labels.
3. Remove skeleton noise from typing/loading states.
4. Add only the compatibility parsing needed for saved/larger debates.
5. Audit avatar fetch behavior and fix only if real repeat downloads are confirmed.
6. Do minimal manual verification and targeted tests.

---

## Acceptance Criteria

- The current v4.3 live header remains intact.
- Agent messages remain the main content of the live debate feed.
- Routine setup/search/resume/completion messages are compact and not repetitive.
- Live feed message text uses teammate names instead of generic `Critic 1` / `Critic 2` labels when cast data is available.
- Full Debate / Director's Cut does not show user-facing `Critic 1` / `Critic 2` labels; it keeps teammate names, avatars, and role specialties.
- Full Debate / Director's Cut critique content remains faithful; only display labels are cleaned up.
- Typing/loading feels intentional without fake message blocks.
- Saved/current debates still render correctly, including 3+ critics.
- Avatar network behavior is understood; no avatar optimization is done unless there is real repeated transfer or visible cost.
- Mobile-specific polish is deferred to v5.0.
