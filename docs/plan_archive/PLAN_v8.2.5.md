# v8.2.5 — Follow-up web research searched for the instruction text — Done

Unplanned bug-fix subphase on the `PLAN_v8.0` branch. Reported 2026-08-09 from a live run
(`20260809_125127`). Index: `PLAN_v8.0.md`.

**Scope:** Backend only. No prompt-template edits. No frontend change.

**Verified:** `uv run pytest tests/` — 92 passed, 1 pre-existing unrelated failure
(`test_session_store.py::test_load_legacy_session_without_list_fields`, a legacy `model_writer`
attribute; that test does not import the engine). Live re-run of the reported case still outstanding.

---

## Symptom

A follow-up of `make it shorter` on a marketing question ran a live web search and displayed
**LIVE WEB RESEARCH USED** with five sources about text-summarizer tools — MarkdownMe, Summarizer
API, Rephrase AI — none related to the actual topic (marketing an app that synchronizes multi-LLM
answers). The search query shown in the UI was literally `make it shorter`.

## Root cause

Third instance of the family behind v8.2.1 and v8.2.4: **a follow-up-only string used where topic
context is required.** Two independent defects chained.

### 1. The retrieval query had no topic

[engine.py](backend/consensus/engine.py) set `search_subject = followup_instruction or question`
and passed it straight to `research_web`, where `build_research_query` forwards it verbatim. For a
follow-up the instruction alone carries no subject, so Exa was asked to find pages about the phrase
"make it shorter" — and correctly returned text-shortening tools.

`PLAN_v8.2.1.md` had cited this exact line as one of the two places that "already does this
correctly". It is correct for a *topical* follow-up ("what about 2027?") and wrong for a
meta-instruction about the previous answer.

### 2. `mode = "on"` never inspected the request

The user's saved `pref_web_research_mode` is `on`, applied to the compose form at
[App.tsx:550-552](frontend/src/App.tsx#L550-L552) and inherited by the follow-up because
`runFollowup` spreads `...form` into the payload ([App.tsx:258](frontend/src/App.tsx#L258)).
`should_search` returned `True` unconditionally for `on` without looking at the text.

Confirmed against the real function: `should_search("make it shorter", "auto")` is **False** — no
currentness or explicit-search pattern matches it. Under `auto` this run would have skipped research
entirely. Only `on` reached the search.

### Consequences beyond the wrong links

- The packet is appended to `question_with_context`, so the irrelevant evidence reached **every**
  writer, critic, refinement, validator and final-synthesis call in the run, labeled as evidence.
- `SYSTEM_GUARDRAIL` permits sourced claims *because* research context is present, so a writer could
  legitimately cite a summarizer tool inside a marketing answer.
- `web_search_performed = true` makes the app, the PDF export and the public shared page all
  advertise live research backed by irrelevant sources.
- Every follow-up under `on` burned a web-plugin call (gpt-5.4 + Exa, up to 3,000 tokens).

---

## Fix

Decision 2026-08-09: a reformatting instruction must never search, **in any mode**. "Always" now
means "search whenever there is something to research".

### Task 1 — Skip research for reformatting instructions — Done
- [x] `META_INSTRUCTION_RE` + `is_meta_instruction()` in
      [web_research.py](backend/consensus/web_research.py), checked inside `should_search` **before**
      the `on` branch so it applies to every mode except the already-short-circuiting `off`.
- [x] Matched against the **whole** instruction, not as a substring. This is the entire safety
      property: anything carrying a topic falls through and still searches. `add a table` is meta;
      `add a table comparing 2026 and 2016 prices` is not. `summarize it` is meta;
      `summarize the latest news about Tesla` is not. `make it shorter` is meta;
      `how do I make my resume shorter?` is not.
- [x] Covers shortening/expanding ("make it shorter", "please make the answer more concise"), bare
      verbs ("condense", "rephrase this"), and format directives ("add a table", "in bullet points",
      "tl;dr").
- [x] Tests: 15 parametrized meta cases asserting no search in `auto` or `on`, and 8 parametrized
      topical cases asserting the guard does **not** fire and `on` still searches. The second set is
      the one that matters — a false positive here would silently disable research for a real
      question.

### Task 2 — Anchor the retrieval query with the parent topic — Done
- [x] `_build_search_query(*, is_followup, followup_instruction, source_prompt, root_question,
      question, anchor_chars)` in [engine.py](backend/consensus/engine.py), mirroring
      `_build_intent_subject` from v8.2.4.
- [x] Follow-up with an instruction: `"{instruction} (follow-up to an earlier request about:
      {anchor})"`, where the anchor is `source_prompt` (falling back to `root_question`) truncated to
      `search_parent_anchor_chars` = 300 ([config.py](backend/config.py)). Every other path returns
      the base question unchanged.
- [x] **Decision and retrieval use different strings, deliberately.** `should_search` still receives
      the raw `followup_instruction or question`; only `research_web` gets the anchored query.
      Anchoring before the guard would defeat it — `"make it shorter (follow-up to an earlier request
      about: ...)"` is no longer a whole-string match, so the meta guard would never fire.
- [x] Test: `test_followup_search_query_carries_the_parent_topic` asserts the query contains both
      the instruction and the parent prompt but not parent-answer body text.
- [x] Test: `test_reformatting_followup_skips_search_entirely` reproduces the reported case —
      "make it shorter" under `mode=on` must not call `research_web` at all, must leave
      `web_search_performed` false, and must record `web_research: skipped` in `phase_timings`.

---

## Verify

- [x] `uv run pytest tests/` — 92 passed, 1 pre-existing unrelated failure.
- [ ] Re-run the reported case: ask a marketing question, then follow up with "make it shorter".
      No LIVE WEB RESEARCH block should appear, and `phase_timings` should show
      `web_research: skipped`.
- [ ] Topical follow-up regression: with Sources set to Always, a follow-up like "what about
      2027?" should still search, and the query recorded in `web_search_query` should name the
      parent topic rather than being three bare words.
- [ ] New-question regression: a plain time-sensitive question under `auto` still searches normally.

---

## Out of scope — flagged, not fixed

**Auto-mode detection on follow-ups still reads only the instruction.** `should_search` receives the
raw instruction, so a topical follow-up under `auto` is judged without the parent. If the parent was
"what is the latest AAPL price" and the follow-up is "what about Microsoft?", no currentness word
appears in the follow-up and `auto` will not search. Running the *detection* on the anchored subject
would fix it, but only if the meta guard runs on the raw instruction first, and it would raise
auto-mode activation rates across the board — a behavior change worth its own decision rather than a
side effect of this fix.

Carried forward unchanged from `PLAN_v8.2.4.md`: no LLM retries, `asyncio.gather` without
`return_exceptions`, silent parse/PDF fallbacks, no crash recovery, the stream worker swallowing
non-`LLMCallError`, and the summarizer's 800-char window over merged critiques.

## Risk and rollback

Low-moderate. Task 2 is gated behind `is_followup and followup_instruction`, so non-follow-up runs
are unchanged. Task 1 is the riskier half: it can only ever *suppress* a search, so the failure mode
is a missed search rather than a wrong answer, and the 8 topical test cases pin the boundary.
Rollback is reverting a single commit; no migration, no stored-data change.
