# v8.2.6 — Clarification on reshape-only follow-ups, and a validator that explains itself — Done

Unplanned bug-fix subphase on the `PLAN_v8.0` branch. Raised 2026-08-09 by the first full production
verification pass across v8.1-v8.2.5. Index: `PLAN_v8.0.md`.

**Scope:** Backend only. No prompt-template edits. No frontend change.

**Verified:** `uv run pytest tests/` — 96 passed, 1 pre-existing unrelated failure
(`test_session_store.py::test_load_legacy_session_without_list_fields`, a legacy `model_writer`
attribute; that test does not import the engine). Production re-test of checks 2.3/2.4 outstanding.

---

## Where this came from

The production verification pass recorded 26 checks passing and 4 failing. This subphase closes the
two that were attributable to shipped code, and unblocks diagnosis of the other two.

| Check | Result | Cause |
|---|---|---|
| 2.1 / 2.2 | Passed | The reported v8.2.5 bug is fixed — "make it shorter" no longer searches. |
| 3.2 (control) | Passed | The meta guard discriminates; "optimize it" still asks for clarification. |
| **2.3 / 2.4** | **Failed** | Clarification still fires on "make it shorter". Task 1 below. |
| **1.3 / 1.4** | **Failed** | Relevance validation failed on 2 of 3 Chain A runs. Not attributable to v8.2.4/v8.2.5 — A1 is a plain new question and neither subphase touches that path. Task 2 below makes it diagnosable. |

---

## Task 1 — A reformatting follow-up has nothing to clarify — Done

### Root cause

`assess_intent` judged `make it shorter` ambiguous and returned a clarification question, so the run
stopped and asked the user before doing any work.

v8.2.4 had already tried to prevent this by **anchoring** the instruction with the parent prompt, on
the theory that context would make it read as clear. Production disproved that: the model still
judged it ambiguous, only now with correct context — the clarification question it produced
("What part of the marketing suggestion should be made shorter?") was well-formed and on-topic. The
anchor fixed `intent_scope`, which was its other job, but it was the wrong instrument for this.

The right instrument already existed. v8.2.5 added `is_meta_instruction()` to answer "is this request
only about the shape of an existing answer?" If the answer is yes there is nothing to research — and
by the same reasoning, nothing to clarify.

### Fix

- [x] `reshape_only = is_followup and is_meta_instruction(followup_instruction)` in
      [engine.py](backend/consensus/engine.py). When true, `assess_intent` is not called at all; a
      non-ambiguous `IntentAssessment` is constructed directly, with `intent_scope` taken from
      `_build_user_request()` — the string that already means "what the user actually asked for".
- [x] Checked against the **raw** `followup_instruction`, never `intent_subject`. Same trap as
      v8.2.5: `is_meta_instruction` matches the whole string, so testing the anchored version
      ("make it shorter (follow-up to…)") would never fire.
- [x] The post-repair `assess_intent` retry is skipped too. Its purpose is to offer clarification
      when relevance keeps failing; for a reshape-only instruction that is the same offer we just
      declined.
- [x] `intent_assessment` records `status="reshape_only"`, so the skip is visible in Session Insights
      rather than looking like an ordinary `clear`.
- [x] Saves one LLM call per reshape-only follow-up.
- [x] Tests: `test_reformatting_followup_skips_the_clarification_check` (asserts `assess_intent`
      raises if called at all, and pins `intent_scope` and the new status) and
      `test_topical_followup_still_gets_the_clarification_check` (the skip must stay narrow —
      this is the check that would catch over-suppression, the same risk class as v8.2.5 Task 1).

**Expected to also close 2.4.** The B2 answer was not a genuine condensation, most likely because the
clarification detour changed the synthesis scope. That is a hypothesis, not a diagnosis — re-test 2.4
against production before recording it as fixed.

---

## Task 2 — Keep the validator's reason — Done

### Root cause

`validate_relevance` returns `(is_ok, score, reason)`. The reason is a one-sentence explanation of
what the validator objected to. It was **discarded** unless a clarification happened to fire
downstream, and the repair pass recorded neither its score nor its reason. So when check 1.4 found A2
failing validation and then failing its repair, the system had computed the explanation twice and
kept neither.

This is why 1.4 could not be diagnosed from the UI, or even from the database.

### Fix

- [x] `relevance_reason` added to the existing `record_phase("relevance_validation", …)` call.
- [x] The repair pass now captures its score and reason instead of discarding them
      (`is_ok, _, _` → named values), and records both.
- [x] No behavior change. No threshold moved, no output altered. The only difference is that a value
      already being computed is no longer thrown away.
- [x] Test: `test_relevance_failure_records_the_validator_reason` — forces a fail-then-repair cycle
      and asserts both phases carry their score and reason.

### Task 2a — Do not leak it publicly — Done

Found while implementing Task 2, not part of the original proposal.

`phase_timings` reaches the public `/api/shared/:slug` payload through `session.to_dict()`
([shared.py](backend/api/shared.py)), and `SharedRunPage` does not render it. Adding the validator's
reason would therefore have published sentences like "Answer never states a recommendation" on a
public URL, about the user's own run, with no UI benefit — the same class of leak as v8.2.2.

- [x] `_strip_internal_diagnostics()` removes `relevance_reason` from `phase_timings` in the shared
      payload only. Status and score are kept; they carry no prose.
- [x] Test: `test_shared_get_hides_the_validator_reason` asserts the key is absent and that the
      sentence does not appear anywhere in the response body.

---

## Verify

- [x] `uv run pytest tests/` — 96 passed, 1 pre-existing unrelated failure.
- [ ] Re-run verification check **2.3**: marketing question, then "make it shorter". No clarification
      prompt should appear, and Session Insights should show
      `Intent Assessment → reshape_only`.
- [ ] Re-run check **2.4**: the same B2 answer should now be a genuine condensation of B1. If it is
      still not, 2.4 is a separate defect in follow-up synthesis and needs its own investigation.
- [ ] Re-run check **3.2** (the control): "optimize it" on the Postgres/MySQL parent must **still**
      raise a clarification. This is the regression guard for Task 1.
- [ ] Collect reasons for **1.4**: run a handful of ordinary questions and read
      `relevance_reason` from Session Insights or the query below. The distribution decides what, if
      anything, to do about `min_relevance_score`.
- [ ] Confirm a shared run's public JSON has no `relevance_reason`.

```sql
select r.session_id,
       p->>'phase'            as phase,
       p->>'status'           as status,
       p->>'relevance_score'  as score,
       p->>'relevance_reason' as reason
from runs r
join outputs o on o.run_id = r.id
cross join lateral jsonb_array_elements((o.full_session_json->'phase_timings')::jsonb) p
where p->>'phase' in ('relevance_validation','repair')
order by r.created_at desc
limit 20;
```

---

## Out of scope — deliberately not fixed here

- **The relevance threshold itself.** `min_relevance_score = 7.0` may be too strict, or the failures
  may be correct rejections of weak answers. Task 2 exists precisely so that call is made from
  evidence. Tuning it now would be guessing.
- **`Note: Relevance remained imperfect after repair.`** still appended into `final_answer`, so it
  reaches exports and public share links. Deferred as v8.2.2 Task 3 and still deferred — the user is
  considering a redesign of the debate and validation flow, and this string may not survive it.
- Carried forward from `PLAN_v8.2.5.md`: auto-mode detection on follow-ups reads only the
  instruction; no LLM retries; `asyncio.gather` without `return_exceptions`; silent parse/PDF
  fallbacks; no crash recovery; the stream worker swallowing non-`LLMCallError`.

## Risk and rollback

Low. Task 1 is gated behind `is_followup and is_meta_instruction(...)`, so every non-follow-up and
every topical follow-up is untouched; its failure mode is a missed clarification prompt, guarded by
the topical test and by production check 3.2. Task 2 changes no behavior at all. Task 2a only removes
a field from one public response. Rollback is reverting a single commit; no migration, no stored-data
change.
