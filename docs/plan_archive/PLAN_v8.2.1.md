# v8.2.1 — Follow-up relevance check overwrites the final answer with the parent answer — In Progress

**Scope:** Backend only. No prompt-template edits (`prompts.py` stays locked). No frontend change.

**Status:** In Progress (Tasks 1-3 Done; Tasks 4-5 deferred to 2026-08-06 by user decision;
end-to-end user verification pending).

**Verified:** `.venv/Scripts/python.exe -m pytest tests/` — 59 passed, 1 failed. The failure is
`test_session_store.py::test_load_legacy_session_without_list_fields` (`DebateSession` has no
`model_writer`), pre-existing and unrelated: the diff touches only `engine.py` and `test_engine.py`,
and that test does not import the engine. Manual end-to-end re-run of the reported three-question
chain not yet done by the user.

Unplanned bug-fix subphase on the `PLAN_v8.0` branch. Reported 2026-08-05 from a live three-question
follow-up chain (sessions `20260805_134244` -> `20260805_143926`). Index: `PLAN_v8.0.md`.

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

### Task 5 — Remove the magic numbers in the validator — Not done (deferred by user)
- [ ] Move `700` and `900` ([validator.py:37](backend/consensus/validator.py#L37)) into `AppConfig`
      as `validator_question_chars` / `validator_answer_chars`, per the `config.py` standard.
- [ ] Keep the current values. With Task 1 the request is short, so 700 is ample; this is a standards
      cleanup, not a behavior change.

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
