# Coding Conventions & Gotchas

## Coding conventions

**Python:**
- Type hints on every function signature
- All constants in `config.py` — no magic numbers anywhere else
- `AppConfig` is a frozen dataclass — constructed once at startup, passed around
- Logging via `logging` module only — never `print()`
- `DebateSession` and `DebateRound` are dataclasses — return these from engine functions, never raw dicts
- All file paths use `pathlib.Path`

**TypeScript:**
- All shared types live in `types.ts`
- One import statement per source module (don't import from the same file twice)
- Use `useState(() => fn())` lazy initializer form when the initial value is computed from a function

**Prompts (special rule):**
Do NOT modify `backend/consensus/prompts.py` without explicit intention. Prompt wording directly affects whether the debate converges. Even small wording changes can break scoring behavior.

---

## Gotchas to avoid

**Running from the wrong directory**
Always run the backend from the project root (`MultiAi/`), not from inside `backend/`.

```bash
# Wrong — running from MultiAi/backend/
python -m uvicorn backend.api.app:app  # ModuleNotFoundError: No module named 'backend'

# Right — running from MultiAi/
uv run uvicorn backend.api.app:app --reload --port 8000
```

**Modifying scorer/summarizer prompts**
These affect consensus behavior in non-obvious ways. If critiques suddenly never agree or always agree, check if someone edited `SCORER_PROMPT` or `SUMMARIZER_PROMPT`.

**Image attachments and Deepseek**
Deepseek doesn't support vision. If a user uploads an image and has Deepseek selected, the backend and frontend both automatically switch those seats to Gemini Flash. This is handled in two places — keep them in sync if you add new vision-incompatible models.

**Session IDs are timestamps**
`session_id = datetime.now().strftime("%Y%m%d_%H%M%S")` — if two requests arrive within the same second they'll collide. Fine for personal use, not fine for multi-user SaaS.

**Rolling context is summaries only**
Never pass full round text to subsequent rounds. Only append summaries:
```python
rolling_context += f"\n[Round {round_num} summary]: {round_summary}"
```
If you break this rule, token costs explode and context windows overflow.

---

## Key engineering decisions (why the code is the way it is)

**Concurrent LLM calls**
Critic A and Critic B run in parallel via `asyncio.gather()`. Same for relevance validation + round summarization. Saves 5–15 seconds per debate round.

**`asdict()` not `__dict__` for dataclasses**
`__dict__` breaks silently when nested dataclass fields are added. Use `asdict()` everywhere:
```python
from dataclasses import asdict
full_discussion = [asdict(item) for item in session.rounds]
```

**No UI persona names in backend code**
`intent.py` once had `"Which interpretation should John, Christy, and Mark use?"` hardcoded. Those are frontend names — if the UI renames them, the backend produces wrong text silently. Always use generic terms like `"the team"`.

**Delete session: `try/except`, not `exists() + unlink()`**
```python
# Wrong — TOCTOU race condition
if not file.exists():
    return False
file.unlink(missing_ok=True)

# Right
try:
    file.unlink()
    return True
except FileNotFoundError:
    return False
```
