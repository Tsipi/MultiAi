# v8.2.4 — Truncation hides the decisive text: scorer excerpt + intent subject — Done

Unplanned bug-fix subphase on the `PLAN_v8.0` branch. Raised 2026-08-09 from an architecture review
of error handling, agent responsibility boundaries, crash recovery, and context management.
Index: `PLAN_v8.0.md`.

**Scope:** Backend only. No prompt-template edits (`prompts.py` untouched). No frontend change.

**Verified:** `uv run pytest tests/` — 67 passed, 1 pre-existing unrelated failure
(`test_session_store.py::test_load_legacy_session_without_list_fields`, a legacy `model_writer`
attribute; that test does not import the engine). Plus an offline measurement over the 126 stored
sessions in `sessions/` quantifying Bug 1 — see "Evidence from stored sessions" below. Live
verification (a real debate, a real short follow-up) is still outstanding; see Verify.

---

## Bug 1 — The scorer graded introductions, not conclusions

### Symptom

Consensus scores that do not match what the answers actually say. Two answers that open with the
same framing and end with opposite recommendations could score 9 and stop the debate early.

### Root cause

`score_consensus` truncated with `answer_a[:600]` / `answer_b[:600]`. Round answers are capped at
`round_call_max_tokens = 800` (~3200 chars), and critic revisions run longer still, so the scorer
saw only the opening of each — measured below at 38.2% of the writer answer and 17.9% of the
critic's revision. Because the score controls the loop-termination branch in
[debate_runner.py:150-152](backend/consensus/debate_runner.py#L150-L152), this is the highest-leverage
truncation in the pipeline: it decides when the debate stops.

Same failure mode as v8.2.1 Task 5, one layer over. That task fixed it for the validator by adding
`_excerpt()` (head **and** tail joined by `[...]`) and noted the pattern makes the bug structurally
impossible to reintroduce. The scorer never received the fix.

### Evidence from stored sessions

Measured offline over the 126 session JSONs in `sessions/` (110 rounds long enough to be affected),
reconstructing each scored pair as `answer_a` = the writer answer, `answer_b` =
`extract_revised_answer(critique)`:

| Measurement | Result |
|---|---|
| Rounds where at least one side exceeded the 600-char window | **110 / 110** |
| Mean fraction of `answer_a` the scorer actually read | **38.2%** |
| Mean fraction of `answer_b` the scorer actually read | **17.9%** |

The clearest single case is **`20260518_171918` round 3** (Tel Aviv vs Paris vs New York):

- `answer_a` 2,530 chars, `answer_b` 8,279 chars — the scorer read 23.7% and 7.2% respectively.
- The two 600-char windows were **99.3% identical** (byte-for-byte apart from a leading `**`): the
  critic had reproduced the writer's opening verbatim before diverging. Full-text similarity was
  **21.4%**.
- Stored consensus score: **8.0** — exactly the default threshold, so it broke the loop.
- Both conclusions sat in the unread tail. `answer_b` ended in a three-city `Bottom Line` block that
  the scorer never saw; `excerpt()` now includes it.

This pattern — the critic's revision opening with a copy of the writer's opening — means the old
window was frequently comparing a text against a near-copy of itself.

**Limit of this evidence, recorded deliberately.** A correlation of stored scores against
opening-similarity vs full-text similarity came back near zero both ways (+0.06 / -0.17), so it is
uninformative rather than supportive. Lexical similarity is not what an LLM scorer measures, so
stored data can demonstrate the *blindness* but cannot establish that scores were systematically
inflated. Establishing that requires re-scoring stored rounds with the real scorer at both
truncations — the v8.2.1 Task 5 methodology, ~20 Deepseek calls. Not run; offered to the user.

Scripts used are throwaway (session scratchpad, not committed): `find_divergence.py` ranks rounds by
hidden divergence, `show_case.py <session_id> <round>` prints the old vs new windows for any stored
round, `stats.py` produces the table above.

### Fix — Done

- [x] Extracted the helper to `backend/consensus/text_excerpt.py` as public `excerpt(text, limit)`.
      It was `validator._excerpt`; two modules now need it, and a cross-module private import is
      worse than a named shared module.
- [x] `validator.py` imports it; behavior unchanged.
- [x] `score_consensus` and `score_relevance` use `excerpt(...)` in place of `[:600]`.
- [x] The `600` moved into `AppConfig` as `scorer_excerpt_chars`
      ([config.py](backend/config.py)), per the no-magic-numbers standard.
- [x] **Budget unchanged at 600 chars.** Only the shape of the cut changed: 600 head becomes
      300 head + 300 tail. CLAUDE.md documents the scorer at "≤ 100 tokens (600-char excerpts only)",
      and that stays true. Raising the budget is a separate, defensible change — the scorer's *output*
      is capped at 100 tokens regardless of input, so it is the cheapest place in the system to buy
      accuracy — but it would move a documented number and deserves its own measurement pass.
- [x] Tests: `test_scorer_sees_the_conclusion_of_a_long_answer` (800 chars of shared preamble, then
      divergent conclusions; both markers must reach the prompt — fails against the old `[:600]`),
      plus the two `excerpt` unit tests moved to `tests/test_text_excerpt.py`.

---

## Bug 2 — v8.2.1 Task 4: intent assessment read the follow-up packet

Carried forward from `PLAN_v8.2.1.md`, where it was deliberately deferred by the user. Root cause is
documented there under "Related: `intent_scope` is derived from the same packet".

### Symptom

On a follow-up, `assess_intent` received `question_with_context` — the packet whose dominant content
is the parent answer — so `intent_scope` could describe the **parent** topic. That scope is injected
into every writer and critic prompt via `{intent_scope}`, so a wrong anchor propagated through the
whole run. It also fed the clarification gate, which could then ask about the parent question.

### Fix — Done

- [x] `_build_intent_subject(*, is_followup, followup_instruction, source_prompt, root_question,
      question_with_context, anchor_chars)` in [engine.py](backend/consensus/engine.py), mirroring
      the `_build_user_request` / `_build_followup_synthesis_context` precedent.
- [x] Follow-up with a non-empty instruction: the instruction, plus the parent prompt truncated to
      `intent_parent_anchor_chars` (300, [config.py](backend/config.py)) under an explicit
      "It continues this earlier request:" label, plus one line scoping the judgment to the
      instruction. The anchor is required — a bare "make it shorter" reads as ambiguous in isolation
      and would trigger spurious clarification prompts.
- [x] Anchor falls back to `root_question` when `source_prompt` is empty; with neither, the bare
      instruction is used.
- [x] Every other path returns `question_with_context` unchanged, so non-follow-up behavior
      (including attachment context) is untouched.
- [x] The post-repair `assess_intent` retry ([engine.py](backend/consensus/engine.py)) reuses the
      same `intent_subject` — it had the identical defect.
- [x] Tests: `test_followup_intent_reads_instruction_with_a_short_parent_anchor` (subject contains
      the instruction and the parent prompt, must not contain parent-answer body text, must be
      shorter than the packet — fails against pre-fix code) and
      `test_plain_run_intent_still_reads_the_full_question_context` (regression guard on the
      unchanged path).

### Judgment call to review

The subject string ends with `Judge only whether the follow-up instruction is clear enough to act
on.` This is a directive added to the `Question:` slot of `INTENT_PROMPT`. `INTENT_PROMPT` lives in
`intent.py`, not the locked `prompts.py`, so it is not a template edit — but it does steer the intent
model, and it is the lever that keeps short follow-up instructions from being flagged ambiguous.
Remove it if live behavior shows the anchor alone is sufficient.

---

## Verify

- [x] `uv run pytest tests/` — 67 passed, 1 pre-existing unrelated failure.
- [x] Offline measurement over stored sessions (see Evidence above).
- [ ] Bug 1, deterministic (preferred): re-score a dozen stored rounds with the real scorer twice —
      once at `[:600]`, once with `excerpt()` — and compare. A single live debate is a weak test
      because Deepseek is non-deterministic (v8.2.1 Task 5 saw one session swing 9.33 -> 6.97 on
      identical content), so only an aggregate over several rounds is readable.
- [ ] Bug 1, live: a question that forces a ranked recommendation after shared framing, e.g.
      "Should a 3-person startup building a B2B SaaS product use a monolith or microservices? Rank
      the options and commit to one recommendation at the end." Confirm the consensus score tracks
      the conclusions rather than the shared preamble.
- [ ] Bug 2, live: "What are the main trade-offs between renting and buying an apartment in Tel Aviv
      right now?" then the follow-up "make it shorter"; and "Compare Postgres and MySQL for a new
      SaaS backend." then "add a table". No spurious clarification prompt should fire, and the
      stored `intent_scope` should describe the follow-up, not the parent topic.
- [ ] Bug 2, control: the same Postgres/MySQL parent with the follow-up "optimize it" — genuinely
      ambiguous, so clarification *should* still fire.
- [ ] Non-follow-up regression: a plain question and a question with a file attachment both still
      assess intent normally.

**Where to observe `intent_scope`.** It is not in `ConsultResponse` (`backend/api/schemas.py`), so
it never reaches the frontend, and `sessions/*.json` stopped being written on 2026-06-07 — current
runs are DB-only. It survives in `Output.full_session_json`:

```sql
select r.session_id,
       r.is_followup,
       o.full_session_json->>'followup_instruction' as instruction,
       o.full_session_json->>'intent_scope'         as intent_scope
from runs r
join outputs o on o.run_id = r.id
order by r.created_at desc
limit 5;
```

The clarification half of Bug 2 needs no query — a spurious prompt on "make it shorter" is visible
in the UI.

---

## Out of scope

Named during the same review, not fixed here — candidates for a later subphase:

- No retry or backoff on any OpenRouter call. One transient 429/503 aborts a whole run.
- `asyncio.gather` in `debate_runner.py` omits `return_exceptions=True`, so one failed critic
  discards the successful ones.
- Parse-failure fallbacks (`scorer._parse_score` -> 5.0, `intent` -> `_fallback_assessment`,
  `parsing.extract_revised_answer` -> whole critique) are invisible to the user and unrecorded on
  the session.
- `attachments._read_pdf_text` returns `""` on any failure with no user-facing signal, so an
  unreadable PDF silently contributes nothing.
- No crash recovery: a run is a fire-and-forget `asyncio.create_task` in the web process and the
  session is persisted only on completion, so a restart mid-run loses everything including spend.
- A non-`LLMCallError` exception inside the stream worker queues `done` without `final`, and the
  frontend read loop ends with no result and no error message.
- The summarizer's 800-char window is applied to the *merged* critique blob, so with 3+ critics the
  rolling context is biased toward the first critic seat.

## Risk and rollback

Low. Bug 1 changes only which characters reach a scoring prompt, at an unchanged budget. Bug 2 is
gated behind `is_followup and followup_instruction`, so non-follow-up runs are byte-identical.
Rollback is reverting a single commit; no migration, no stored-data change.
