# v8.2.1 — Follow-up relevance check overwrites the final answer with the parent answer — Done

Unplanned bug-fix subphase on the `PLAN_v8.0` branch. Reported 2026-08-05 from a live three-question
follow-up chain. Index: `PLAN_v8.0.md`.

**Scope:** Backend only. No prompt-template edits (`prompts.py` stays locked). No frontend change.

**Status:** Done (Tasks 1-3, 5, 6). Task 4 — intent assessment still reads the packet — was
deliberately deferred by the user and is carried forward as separate scope, not unfinished work.

**Verified:** `pytest tests/` — 64 passed, 1 pre-existing unrelated failure
(`test_session_store.py::test_load_legacy_session_without_list_fields`, a legacy `model_writer`
attribute; that test does not import the engine).

Re-scoring stored sessions against the shipped code confirmed the fix: follow-ups that previously
scored 1.29-3.14 on relevance — the signature of a validator reading a packet that never contained
the question — now score 8-9. Runs that still fail carry substantive critiques of the answer rather
than truncation artifacts.

---

## Symptom

In a follow-up chain, each follow-up's final answer is a near-verbatim copy of the **parent**
session's final answer, and the debate that just ran is discarded.

User-reported chain:

| # | Session | Question | Score shown | Final answer actually stored |
|---|---------|----------|-------------|------------------------------|
| 1 | `20260805_134244` | compare the 10 most cap market USA stocks 2026 vs 2016 | 7.0 | The comparison table (correct) |
| 2 | (follow-up) | table comparison, who gave the highest performance / 10x forward potential | 5.0 | The same table, plus `Note: Relevance remained imperfect after repair.` |
| 3 | `20260805_143926` | prove why an ETF beats a single stock, pros and cons | 8.0 | The same table again |

Run 3's PDF shows a complete, on-topic ETF debate under **Full Debate** (Brett drafts an ETF
argument, Josh and Mark critique it), but the **Revised Answer** section is the 2016-vs-2026 table.
The synthesized ETF answer was produced and then thrown away.

---

## Root cause

Four things chain together. Only the first is by design.

### 1. The follow-up request sent to the backend embeds the whole parent answer

[App.tsx:252-256](frontend/src/App.tsx#L252-L256) builds `payload.question` as one packet:

```
Original prompt:
<root question>            (~98 chars in run 3)

Previous final answer:
<the entire parent final answer>   (>2,000 chars — the whole table)

Follow-up instruction:
<the user's actual new question>   ← last
```

This is intentional and correct **for the debate**: writers and critics genuinely need the parent
answer to revise or extend it. The packet becomes `question_with_context` in the engine.

The problem is that the packet is then also used by the steps that ask *"what did the user actually
ask for?"* — where the only correct input is the follow-up instruction.

### 2. Relevance validation reads the packet, and truncation removes the actual question

[engine.py:239](backend/consensus/engine.py#L239) validates against `question_with_context`, and
[validator.py:37](backend/consensus/validator.py#L37) truncates with `question[:700]`.

Character budget for run 3:

| Segment | Chars | Running |
|---------|-------|---------|
| `Original prompt:\n` | 17 | 17 |
| root question | ~98 | ~115 |
| `\n\nPrevious final answer:\n` | ~25 | ~140 |
| parent final answer | >2,000 | cut at 700 |
| `Follow-up instruction:` + instruction | — | **never reached** |

The validator's 700-character window ends roughly 560 characters into the parent table. The
follow-up instruction is structurally unreachable. So the validator scored a correct ETF answer
against what it believed the request was — "produce a market-cap comparison table" — and failed it
(`min_relevance_score = 7.0`, [config.py:55](backend/config.py#L55)).

The lexical half has the same defect from the other direction:
[`_token_overlap`](backend/consensus/validator.py#L25-L31) uses the **untruncated** packet, so the
denominator is dominated by parent-answer vocabulary rather than the question's.

This is deterministic for any follow-up whose parent answer is longer than ~560 characters — i.e.
effectively all of them. It is not an occasional misfire.

### 3. The repair prompt instructs the writer to reproduce the parent answer

Validation failure triggers repair at
[engine.py:246-257](backend/consensus/engine.py#L246-L257):

```python
repair = f"The answer drifted from user intent. Rewrite it to answer exactly: {question_with_context}"
refined = WRITER_REFINEMENT.format(..., question=question_with_context, ...)
```

Both slots receive the full packet, whose dominant content is a finished, well-formatted answer
sitting under the heading `Previous final answer:`. The writer is told to "answer exactly" that, so
it emits that. The result overwrites `session.final_answer`.

That is the copied table. Steps 2 and 3 together are the whole bug.

### 4. The repair discards the synthesis even when it is aimed correctly

`WRITER_REFINEMENT` takes `rolling_context`, `question`, and `critique` — it never receives the
answer it is meant to be repairing. So repair does not refine the synthesized answer; it regenerates
from scratch and loses the `FINAL_SYNTHESIS` structure (The Bottom Line / What the Team Agreed On /
Where They Disagreed / The Definitive Answer). This is why a repaired answer reads as though the
debate never happened, independent of bug 2.

### Related: `intent_scope` is derived from the same packet

[engine.py:135](backend/consensus/engine.py#L135) runs `assess_intent(question_with_context, ...)`.
For a follow-up, the intent model reads the packet and can return a scope describing the *parent*
topic. That scope is injected into every writer and critic prompt via `{intent_scope}`, and is
reused by the repair at [engine.py:251](backend/consensus/engine.py#L251) instead of the
`synthesis_scope` computed at [engine.py:216-218](backend/consensus/engine.py#L216-L218). Quieter
than the main bug, same root cause. Handled in Task 4.

### What already does this correctly

Two places in the engine already use the focused instruction, and are the precedent for the fix:

- [engine.py:151](backend/consensus/engine.py#L151) — `search_subject = followup_instruction or question`
- [engine.py:208-221](backend/consensus/engine.py#L208-L221) — `synthesis_question` /
  `synthesis_scope` via `_build_followup_synthesis_context`

Final synthesis is correct. Validation, repair, and intent were never updated to match.

---

## Not a frontend bug

The screenshot showing the table three times reflects genuine stored data, not a UI duplication
fault. `buildAncestorAnswers` ([consultHelpers.ts:168-189](frontend/src/lib/consultHelpers.ts#L168-L189))
reads each ancestor's `source_final_answer` from its own session, and the three cards carry distinct
scores (7.0 / 5.0 / 8.0), so three distinct sessions loaded correctly. They contain the same text
because the backend wrote the same text. No frontend change is in scope.

Corollary: this fix cannot repair the three saved sessions. They keep their stored answers. The
chain needs to be re-asked after deploy.

---

## Fix plan

Guiding rule: **the packet is for the debate; a single focused "user request" string is for every
step that judges intent.** Compute it once, use it everywhere that asks what the user wanted.

### Task 1 — Derive one focused user-request string — Done
- [x] Added `_build_user_request(*, is_followup, followup_instruction, question, clarification)` at
      [engine.py:299-311](backend/consensus/engine.py#L299-L311).
- [x] Follow-up with a non-empty `followup_instruction`: returns the instruction, plus
      `\n\nClarification: {clarification[:500]}` when present — mirroring `synthesis_scope`.
- [x] Otherwise (non-follow-up, or `is_followup` with an empty instruction): returns the base
      `question` plus clarification. The fallback condition matches the guard at
      [engine.py:208](backend/consensus/engine.py#L208), so the two paths cannot disagree.
- [x] Excluded from the string: attachment text, web-research context, and the parent answer.
- [x] Computed once after the debate rounds, next to `synthesis_question`
      ([engine.py:222-227](backend/consensus/engine.py#L222-L227)).

### Task 2 — Point validation and repair at the focused request — Done
- [x] [engine.py:240](backend/consensus/engine.py#L240) — fast-mode `_token_overlap` guard.
- [x] [engine.py:245](backend/consensus/engine.py#L245) — first `validate_relevance`.
- [x] [engine.py:255](backend/consensus/engine.py#L255) — the `repair` directive string.
- [x] [engine.py:265](backend/consensus/engine.py#L265) — second `validate_relevance`.
- [x] `run_rounds` ([engine.py:192](backend/consensus/engine.py#L192)) left on
      `question_with_context` — the debate keeps full parent context, unchanged.
- [x] Non-follow-up behavior change as predicted: validation now sees the base question instead of
      question + attachment + web-research text. Pinned by
      `test_plain_run_validates_against_base_question`. Still needs a real-run check (see Verify).

### Task 3 — Make repair refine the synthesis instead of regenerating from scratch — Done
User approved the template swap on 2026-08-05.

- [x] Repair now calls `FINAL_SYNTHESIS` instead of `WRITER_REFINEMENT`
      ([engine.py:256-261](backend/consensus/engine.py#L256-L261)), passing
      `current_answer=session.final_answer` and folding the repair directive into the `critique`
      slot ahead of `final_critique`. The repaired answer keeps the four-section structure and the
      debate's content.
- [x] Both templates used verbatim — this swaps which locked template is invoked. `prompts.py`
      untouched per CLAUDE.md.
- [x] Repair receives `synthesis_scope`, not `session.intent_scope`.
- [x] `WRITER_REFINEMENT` import dropped from `engine.py`; the now-unused `rolling` return from
      `run_rounds` unpacks to `_`. `run_rounds` itself still builds and uses rolling context
      internally — only the engine's discarded copy changed.

Note on scope: the repair prompt still contains the parent answer, because it uses
`synthesis_question`, which presents it under the labeled heading
`Previous final answer to revise or extend:`. That is deliberate and matches the already-correct
final-synthesis path — a follow-up repair needs parent context. What changed is the **directive**:
it now says `Rewrite it to answer exactly: <follow-up instruction>` instead of pointing at the whole
packet. The parent answer is context to revise, no longer the thing being asked for.

### Task 4 — Stop feeding the packet to intent assessment — Not done (deferred by user)
- [ ] For follow-ups, call `assess_intent` with the instruction plus a short parent anchor
      (`source_prompt` truncated to ~300 chars), not the full packet.
- [ ] Anchor is required: a bare short instruction ("make it shorter", "add a table") looks ambiguous
      in isolation and would trigger spurious clarification prompts. This changes clarification
      behavior, so it needs its own verification pass.
- [ ] Separable — can be deferred to a follow-on if we want Tasks 1-3 shipped first.

### Task 5 — Validator truncation and scoring calibration — Done
Started as a magic-number cleanup. Live diagnosis on 2026-08-06 showed the `900` was not cosmetic —
it was suppressing relevance scores across the board, so this task absorbed that investigation
(originally scoped as a separate v8.2.3).

#### Root cause
`FINAL_SYNTHESIS` puts the deliverable **last** (`The Definitive Answer`), while the validator read
only the first 900 characters. On answers over ~2500 chars it saw the Bottom Line and the
disagreement bullets but never the actual answer, then marked the answer down for missing exactly
what had been cut off. Same truncation-hides-the-point failure as the main v8.2.1 bug, one layer
down.

Measured by re-scoring ten stored sessions, varying only the answer truncation: mean score
6.11 -> 7.54, pass rate 5/10 -> 7/10, with the largest gains on the longest answers. On one session
the validator said `SCORE: 4` / "lacks specific details" when truncated and `SCORE: 7` / "provides a
detailed comparison" on the same content in full.

Two caveats worth remembering: the effect tracks answer **length**, not follow-up status; and full
answers are not uniformly higher — two sessions scored lower, where a strong opening masked later
drift, meaning those truncated scores had been false passes. Deepseek is also non-deterministic
(one session swung 9.33 -> 6.97 on identical content), so only the aggregate direction is reliable.

#### 5a — Let the validator see the whole answer — Done
- [x] Moved `700`/`900` into `AppConfig` as `validator_question_chars` (700, unchanged) and
      `validator_answer_chars` ([config.py:56-57](backend/config.py#L56-L57)), per the no-magic-numbers standard.
- [x] Raised the answer budget to 6000 chars. Synthesis is capped at `round_call_max_tokens=800`
      (~3200 chars) and the longest observed answer was 4121, so this is effectively "the whole
      answer" with headroom rather than an arbitrary bound.
- [x] Added `_excerpt(text, limit)` in [validator.py](backend/consensus/validator.py): under the
      limit it passes text through untouched; over it, it keeps head **and** tail joined by `[...]`.
      This makes the class of bug structurally impossible to reintroduce — the conclusion is never
      the part that gets dropped, whatever the limit is set to.
- [x] Cost: ~850 input tokens per validator call, once per run. Negligible.
- [x] Tests: `test_validator_sees_the_end_of_a_structured_answer` (sentinel at the end of a
      long answer must reach the prompt), plus two `_excerpt` unit tests.

#### 5b — Scoring formula deflates the LLM verdict — Needs a decision
Independent of truncation. [validator.py:42](backend/consensus/validator.py#L42) computes:

```
final = (llm_score * 0.9) + (overlap * 10 * 0.1)      # LLM_WEIGHT / OVERLAP_WEIGHT
```

With `min_relevance_score = 7.0`, an LLM score of 7 needs `overlap >= 0.70` to pass. Observed
overlap is 0.5-0.7, so **an LLM verdict of 7 essentially always fails a threshold of 7**. Confirmed
twice in the data above: 20260723_115146 (llm 7 -> 6.97, failed by 0.03) and 20260726_124209
truncated (llm 7 -> 6.74). The effective gate is "the LLM must say 8" — stricter than the constant
advertises, and not a value anyone deliberately chose.

Decision 2026-08-06: overlap becomes a floor-guard, not a weighted term.

- [x] `final_score` is now the LLM verdict itself. `min_relevance_score = 7.0` therefore means
      exactly "the validator said 7 or better" — no hidden deflation.
- [x] Lexical overlap is retained only as a guard: below `validator_min_overlap` (0.15,
      [config.py:58](backend/config.py#L58)) the run fails regardless of the LLM verdict, so a
      confidently-scored but obviously off-topic answer cannot slip through. That was the one real
      job the 0.1 weight was doing.
- [x] `LLM_WEIGHT` / `OVERLAP_WEIGHT` removed; guard rejections return a specific reason
      (`OFF_TOPIC_REASON`) rather than the model's, since the model's reason would contradict the
      verdict.
- [x] Tests: `test_llm_verdict_at_the_threshold_now_passes` (a 7 must clear 7.0 — this fails against
      the old weighting) and `test_validator_guard_rejects_answer_with_no_shared_wording`.

#### Task 5 verification
The same ten sessions re-scored with the shipped validator: 8/10 pass. Sessions that previously
scored 1.29-3.14 (the follow-up packet bug) now score 8-9. The two that still fail carry substantive
critiques — "misses the ask", "speculative data without sources" — rather than truncation artifacts,
which is the validator working rather than misfiring.

### Task 6 — Regression tests — Done
- [x] `test_followup_validation_uses_instruction_not_parent_answer` — captures the question string
      passed to `validate_relevance`; asserts it contains the follow-up instruction and contains
      neither the parent-answer marker nor the packet header. Parent answer is padded past the
      700-char validator window, so this fails against the pre-fix code (which passed the packet).
- [x] `test_followup_repair_targets_instruction_and_keeps_synthesized_answer` — forces one
      validation failure, then asserts the repair prompt contains
      `Rewrite it to answer exactly: <instruction>`, carries the synthesized answer, and is built
      from `FINAL_SYNTHESIS` (checks for the `The Bottom Line` section header). Covers Tasks 2 and 3
      together; fails against pre-fix code on all three assertions.
- [x] `test_plain_run_validates_against_base_question` — pins the non-follow-up path to the base
      question. This one also passes pre-fix (no attachment or research context in the fixture), so
      it is a guard against future regression rather than proof of the bug.
- [x] Existing `test_followup_final_synthesis_keeps_parent_answer_and_clarification` still passes
      unchanged — the synthesis path was not touched.
- [ ] Not added: `test_validator.py` truncation-limit assertions — belongs with Task 5, deferred.

Suite result: 59 passed, 1 failed. The failure is
`test_session_store.py::test_load_legacy_session_without_list_fields` (`DebateSession` has no
`model_writer` attribute) — pre-existing and unrelated; the diff touches only `engine.py` and
`test_engine.py`, and that test does not import the engine.

---

## Verify

- [ ] `uv run pytest tests/` green.
- [ ] Reproduce the reported chain manually: ask the 10-stock comparison, then the performance-table
      follow-up, then the ETF follow-up. The third answer must be about ETFs and must carry the
      `FINAL_SYNTHESIS` section headings.
- [ ] Inspect the new session's `phase_timings`: `relevance_validation` should read `passed`, and no
      `repair` row should be present. Before the fix, follow-ups produce
      `relevance_validation: failed` followed by a `repair` row — this is the cheapest signal for
      whether the bug is live.
- [ ] Confirm no `Note: Relevance remained imperfect after repair.` is appended.
- [ ] Non-follow-up regression: run a plain question, and a question with a file attachment, and
      confirm both still validate and read normally (Task 2's flagged change).
- [ ] If Task 4 ships: confirm a short follow-up instruction ("make it shorter") does not trigger a
      spurious clarification.

---

## Out of scope

- Frontend changes. The packet construction in `App.tsx` stays as-is; the debate needs it.
- Prompt-template wording. `prompts.py` is untouched.
- Retroactive repair of the three affected sessions — not possible; re-ask after deploy.
- The score-labeling oddity this exposed: the header score is the round consensus score
  ([engine.py:232](backend/consensus/engine.py#L232)), computed on the real debate, so a repaired
  answer displays a score it did not earn. Once repair stops firing spuriously this is near-harmless.
  Log as a candidate for a later subphase rather than fixing here.

## Risk and rollback

Low. All edits are inside the post-synthesis block of `ConsensusEngine.consult` plus one validator
constant move. The debate loop, the synthesis path, storage, and the API contract are unchanged.
Rollback is reverting a single commit; no migration, no stored-data change.
