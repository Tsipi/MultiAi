# Review

## Findings

1. **High - Empty team lists now validate but can crash or falsely report consensus.**
   `backend/api/schemas.py:19` and `backend/api/schemas.py:20` default `writers` and `critics` to empty lists, while the legacy model fields at `backend/api/schemas.py:22` through `backend/api/schemas.py:24` are now optional empty strings. A request with no model fields therefore passes request validation, then `backend/consensus/debate_runner.py:52` indexes `writers[0]` and raises `IndexError`. A request with `writers` but no `critics` is also accepted; `backend/consensus/debate_runner.py:74` produces no critiques and `backend/consensus/scorer.py:63` returns a perfect `10.0` for fewer than two answers, so a run can refine against an empty critique set and potentially stop as if consensus was reached. Add API validation requiring at least one writer and at least one critic after legacy coercion, and consider whether consensus should require at least two critic positions.

2. **Medium - Existing backend tests are stale against the changed engine API.**
   `tests/test_engine.py:15` still calls `ConsensusEngine.consult` with `writer`, `critic_a`, and `critic_b`, but `backend/consensus/engine.py:28` and `backend/consensus/engine.py:29` now require `writers` and `critics`. This test will fail before it can exercise the clarification path. Update the test payload to the list-based contract and add explicit coverage for legacy API coercion at the FastAPI schema boundary.

3. **Medium - Pairwise scoring scales quadratically with critic count.**
   `backend/consensus/scorer.py:65` through `backend/consensus/scorer.py:70` scores every pair of critic answers. Because the frontend lets users keep adding team members, each round can jump from 3 scorer calls for 3 critics to 45 calls for 10 critics, before counting the critic calls themselves. This can make latency and OpenRouter cost spike unexpectedly. Add a critic cap, sample/aggregate strategy, or a single multi-answer scoring prompt before exposing arbitrary critic counts.

## Test Notes

I attempted to run:

```powershell
python -m pytest tests/test_engine.py tests/test_api_contract.py tests/test_scorer.py
py -m pytest tests/test_engine.py tests/test_api_contract.py tests/test_scorer.py
```

The sandbox could not execute Python here: `python.exe` points to the Windows Store shim and failed with "The file cannot be accessed by the system"; `py` reported "No installed Python found." The stale `test_engine.py` call is nevertheless visible from static review.
