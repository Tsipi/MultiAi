# Version 4.4 - Live Debate Experience Polish

**Scope:** Improve the live debate section so it feels like a polished AI team room instead of a raw backend activity log.  
**Status:** Planning only. Do not implement until explicitly approved.  
**Depends on:** Current `ChatroomDebateView`, `parseActivityMessages`, and streaming activity events.

---

## Current Problem

The live debate view currently mixes backend progress lines and agent activity as chat messages. This makes the UI feel noisy:

- Repeated **System** messages take too much visual space.
- Important agent activity is buried between status logs.
- The user cannot quickly see the current stage.
- Typing rows and skeletons make the lower part feel unfinished.
- The section feels closer to a debug feed than a deliberate "team working live" experience.

The goal is not to remove transparency. The goal is to separate system state from agent conversation.

---

## Product Direction

The live debate should feel like a compact AI team room:

- A clear header says which team is running and whether it is live.
- A status bar shows the current phase.
- System events appear as compact timeline/status notes.
- Writer/Critic/Scorer messages remain chat-like and visually prominent.
- Typing indicators are subtle and elegant.

---

## Phase 4.4.1 - Add Live Debate Status Bar

**Goal:** Give users a quick answer to "what is happening right now?"

### Suggested UI

```text
Tourist Planner Team      Live
Round 1 of 3 · Writer drafting · Score pending
```

Optional phase rail:

```text
Research → Draft → Critique → Score → Final
```

### Tasks

- [ ] Create `LiveDebateStatusBar`
- [ ] Show team/template name and live badge
- [ ] Show current round and max rounds
- [ ] Show current stage: preparing, researching, drafting, critiquing, scoring, synthesizing, complete
- [ ] Show latest score when available
- [ ] Keep styling aligned with current violet/emerald design language

---

## Phase 4.4.2 - Separate System Events From Agent Chat

**Goal:** Stop rendering backend progress lines as large "System" chat messages.

### Recommendation

System events should become compact status/timeline items, not full chat bubbles.

Examples:

```text
✓ Web research skipped for this question
✓ Writer is drafting
✓ Consensus threshold reached at Round 2
```

### Tasks

- [ ] Add `SystemEventTimeline`
- [ ] Classify backend activity lines as system events vs agent events
- [ ] Render system events with small text, muted background, and lightweight icons
- [ ] Collapse repeated or low-value system events
- [ ] Avoid large system avatars for ordinary progress messages

---

## Phase 4.4.3 - Improve Agent Message Feed

**Goal:** Make Writer/Critic/Scorer content feel like real team chat.

### Agent message style

Each agent message should include:

- Avatar
- Name
- Role / team-specific specialty
- Model/provider badge
- Chat bubble content

### Tasks

- [ ] Keep agent messages visually larger than system notes
- [ ] Use different accent treatment for Writer, Critics, Scorer, and Summarizer
- [ ] Preserve copy/share controls only on meaningful answer messages
- [ ] Improve spacing between messages
- [ ] Ensure avatars and provider badges align consistently

---

## Phase 4.4.4 - Polish Typing State

**Goal:** Make typing feel intentional, not like placeholder loading noise.

### Suggested behavior

```text
Josh is drafting...
```

with small animated dots, but without a large skeleton block unless content is truly loading.

### Tasks

- [ ] Replace large skeleton area with compact typing row
- [ ] Show the active agent name and action
- [ ] Use stage-specific verbs: drafting, reviewing, scoring, synthesizing
- [ ] Keep the typing row sticky to the bottom only while loading
- [ ] Ensure it disappears cleanly when the next real event arrives

---

## Phase 4.4.5 - Group And De-Duplicate Progress Events

**Goal:** Prevent the feed from feeling repetitive.

### Examples

Instead of:

```text
System: Resuming with your clarification...
System: Live web research skipped for this question.
System: Your Writer and both Critics are in session...
```

Show:

```text
Preparing resumed run · Web research skipped · Team assembled
```

### Tasks

- [ ] Identify repeated low-value messages
- [ ] Group setup messages into a single compact setup row
- [ ] Group web research status into the run header or timeline
- [ ] Keep major events visible: research started, sources found, consensus reached, errors
- [ ] Add tests for activity parsing and grouping

---

## Phase 4.4.6 - Improve Stage Detection

**Goal:** Make the UI derive a reliable current stage from backend activity.

### Suggested stages

- `queued`
- `clarifying`
- `researching`
- `drafting`
- `critiquing`
- `scoring`
- `summarizing`
- `synthesizing`
- `complete`
- `error`

### Tasks

- [ ] Extend `parseActivityMessages`
- [ ] Add `currentStage` to `ChatroomState`
- [ ] Add focused tests for stage detection
- [ ] Keep backward compatibility with old activity strings
- [ ] Use stage data in `LiveDebateStatusBar` and typing row

---

## Phase 4.4.7 - Better Visual Hierarchy

**Goal:** Make the live debate section easier to scan.

### Tasks

- [ ] Reduce vertical space consumed by system notes
- [ ] Keep agent chat bubbles at comfortable reading width
- [ ] Add subtle dividers between rounds
- [ ] Make the header sticky within the debate panel
- [ ] Preserve mobile responsiveness
- [ ] Ensure dark mode colors remain readable

---

## Phase 4.4.8 - Empty, Error, And Resume States

**Goal:** Make edge cases feel designed.

### Tasks

- [ ] Empty state before activity starts: "Your team will appear here when the run starts"
- [ ] Error state with clear retry guidance
- [ ] Resume state after clarification: compact note instead of repeated system bubbles
- [ ] Search skipped/failed state shown once, not repeatedly
- [ ] Completed state that transitions smoothly into the final answer

---

## Suggested Implementation Order

1. Extend `parseActivityMessages` with `currentStage` and system-event grouping.
2. Add `LiveDebateStatusBar`.
3. Add `SystemEventTimeline`.
4. Update `ChatroomDebateView` to render system notes separately from agent chat.
5. Polish typing row.
6. Add tests for parsing/grouping/stage detection.
7. Tune spacing and mobile layout.

---

## Acceptance Criteria

- System progress no longer appears as repeated large "System" chat bubbles.
- The current run stage is visible at a glance.
- Agent messages are visually distinct from status events.
- Clarification resume and web-search skipped messages do not dominate the feed.
- The live debate section feels polished, not debug-like.
- Existing streaming behavior remains compatible with saved/current runs.
