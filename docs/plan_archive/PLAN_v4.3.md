# Version 4.3 - Reduce Run Latency

**Scope:** Reduce the time users wait for a final answer without removing the core multi-agent value.  
**Status:** Planning only. Do not implement until explicitly approved.  
**Depends on:** v4.2.5 live web research behavior remaining explicit and visible.

---

## Why Runs Feel Slow Today

MultiAi is slower than a single chatbot because one user question can trigger many dependent LLM calls:

1. Intent / clarification check
2. Optional live web research
3. Writer opening answer
4. Critics in parallel
5. Scorer
6. Summarizer
7. Writer refinement
8. Repeat for each round
9. Final synthesis
10. Relevance validation
11. Optional repair
12. Optional title/export work

Some calls already run in parallel, but many must happen sequentially because the next step depends on the previous output. The goal of v4.3 should be to reduce unnecessary calls, use faster paths for simple requests, and make the waiting experience feel clearer.

---

## Recommendation

Add an answer-depth control:

- **Fast** - quickest useful answer
- **Balanced** - default quality/speed tradeoff
- **Deep** - current full deliberation behavior

Default should be **Balanced** or **Fast** for general questions. Users can choose **Deep** when they want maximum quality.

---

## Phase 4.3.1 - Add Answer Mode

**Goal:** Give users explicit control over speed vs depth.

### Modes

| Mode | Intended behavior |
|------|-------------------|
| `fast` | 1 debate round, fewer support calls, fastest models where safe |
| `balanced` | 1-2 rounds, normal debate quality, limited extra checks |
| `deep` | Current behavior: full rounds, scoring, summaries, validation, optional repair |

### Tasks

- [x] Add `answer_mode: "fast" | "balanced" | "deep"` to frontend payload and backend schema
- [x] Add UI control in Advanced Setup near debate settings
- [x] Store answer mode on `DebateSession`
- [x] Show answer mode in session metadata / insights
- [x] Include answer mode in saved/shared sessions

---

## Phase 4.3.2 - Reduce Default Rounds

**Goal:** Stop doing three full debate passes unless the user asks for it.

### Recommendation

- Fast: `max_rounds = 1`
- Balanced: `max_rounds = 2`
- Deep: user-selected, default 3

### Tasks

- [x] Change default run setup to fewer rounds
- [x] Keep manual override for advanced users
- [x] Add copy explaining that more rounds usually means slower but more reviewed answers
- [x] Verify follow-up runs inherit the selected mode/rounds correctly

---

## Phase 4.3.3 - Skip Unnecessary Support Calls in Fast Mode

**Goal:** Remove calls that add quality but are not always needed.

### Candidate changes

Fast mode can use:

```text
Writer -> Critics -> Final synthesis
```

instead of:

```text
Writer -> Critics -> Scorer -> Summarizer -> Rewrite -> Validate -> Final synthesis
```

### Tasks

- [x] In fast mode, skip summarizer unless multiple rounds are needed
- [x] In fast mode, skip consensus scorer or run it only once at the end
- [x] In fast mode, skip relevance validator unless the answer appears obviously off-topic
- [x] In fast mode, skip repair unless validation was explicitly run and failed
- [x] Add tests proving fast mode uses fewer LLM calls

---

## Phase 4.3.4 - Use Faster Models for Utility Roles

**Goal:** Keep answer quality while making support calls cheaper and faster.

### Recommendation

Keep the user-selected Writer/Critics, but use fast fixed models for:

- Intent assessment
- Scorer
- Summarizer
- Validator
- Export title generation

### Tasks

- [x] Review current fixed utility models
- [x] Add config values for utility model selection
- [x] Track latency per model call so decisions are based on measured data
- [x] Keep cost display accurate after model changes

---

## Phase 4.3.5 - Make Web Search Strictly Conditional

**Goal:** Avoid live-search delay unless it is actually needed.

### Rules

- `No web`: never search
- `Auto`: search only when explicit or clearly time-sensitive
- `Search web`: always search

### Tasks

- [x] Keep current auto-detection conservative
- [x] Add a visible "search skipped" state so users understand why no search ran
- [x] Add timeout fallback that continues the run with a warning
- [x] Consider shorter web-search timeout in Fast mode
- [x] Add tests for false positives like "binary search"

---

## Phase 4.3.6 - Defer Non-Essential Work

**Goal:** Show the final answer sooner by moving non-critical tasks after answer display.

### Candidate deferrals

- Session title generation
- Some session insight formatting
- Export-only transformations
- Expensive metadata enrichment

### Tasks

- [ ] Ensure title generation does not block final answer display
- [ ] Generate export titles only when exporting, not during the run
- [ ] Keep session saving reliable even if deferred title generation fails
- [ ] Add UI fallback title while title generation is pending

---

## Phase 4.3.7 - Improve Perceived Speed

**Goal:** If work still takes time, make progress feel trustworthy and alive.

### Tasks

- [ ] Stream clearer activity messages for each major stage
- [ ] Show which stage is currently running: research, drafting, critique, scoring, synthesis
- [ ] Show "Fast / Balanced / Deep" mode in the live header
- [ ] Add elapsed time or stage progress labels
- [ ] Avoid long silent gaps between activity events

---

## Phase 4.3.8 - Measure Before and After

**Goal:** Make latency improvements measurable.

### Metrics to collect

- Total run duration
- Duration per LLM call
- Duration per phase
- Number of LLM calls per run
- Tokens and cost per phase
- Whether web search ran
- Selected answer mode

### Tasks

- [ ] Add timing around each backend phase
- [ ] Include timings in debug logs
- [ ] Optionally expose timings in Session Insights
- [ ] Compare Fast/Balanced/Deep on the same prompts
- [ ] Use measurements before changing default models

---

## Suggested Implementation Order

1. Add timing instrumentation first.
2. Add `Fast / Balanced / Deep` mode.
3. Reduce default rounds for Fast/Balanced.
4. Skip summarizer/scorer/validator in Fast mode where safe.
5. Defer title generation.
6. Polish progress UI.

---

## Acceptance Criteria

- Fast mode produces a useful answer noticeably faster than current behavior.
- Balanced mode is faster than current default without feeling shallow.
- Deep mode preserves current deliberation quality.
- Users understand why a run is taking time.
- Web search does not run unless requested, clearly needed, or manually forced.
- Cost and timing metadata remain honest.
