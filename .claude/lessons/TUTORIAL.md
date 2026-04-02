# MultiAi — Session Notes for Future Me

*Written after the code simplification + tooling setup session. April 2026.*

---

## What we built and why

**MultiAi** is a multi-LLM consensus dashboard. The idea: instead of asking one AI and hoping it's right, you assemble a team — one Writer LLM drafts an answer, two Critic LLMs tear it apart, and the loop repeats until the critics and writer agree enough (scored 1–10 by a separate Scorer LLM). The final answer is a synthesis of that debate.

**Stack:**
- Backend: Python + FastAPI, hosted at `localhost:8000`
- Frontend: React + TypeScript + Vite, hosted at `localhost:5173`
- LLM calls: all go through OpenRouter (one API key, access to GPT, Claude, Gemini, Deepseek)
- Storage: JSON files in a `sessions/` folder — no database

**Why no database?** Deliberate choice to keep it simple for v1. JSON files are good enough for a personal/small-team tool. If you ever scale to many users, that's when you'd add one.

---

## How the debate loop works

```
User submits question
  → Intent check: is the question clear enough? If not, ask for clarification.
  → Round 1: Writer drafts an answer
  → Loop (up to max_rounds):
      Critic A and Critic B critique in PARALLEL (asyncio.gather)
      Scorer rates agreement 1–10
      Summarizer + Relevance validator run in PARALLEL (asyncio.gather)
      If score >= threshold → stop
      Writer refines based on critique
  → Writer synthesizes final answer
  → Relevance check: does the answer actually address the question?
  → Session saved as sessions/YYYYMMDD_HHMMSS.json
```

**Critical rule:** never pass full transcripts to subsequent rounds — only the compressed rolling summary. This keeps token costs low.

**Fixed models:** Scorer and Summarizer are always `deepseek/deepseek-chat-v3.2`. Only Writer and the two Critics are user-selectable.

---

## Key decisions made this session

### 1. Concurrent LLM calls (big win)
Critic A and Critic B used to run sequentially. We parallelized them with `asyncio.gather()`:
```python
critique_a, critique_b = await asyncio.gather(
    call_openrouter(prompt, critic_a, cfg),
    call_openrouter(prompt, critic_b, cfg),
)
```
Same for relevance validation + round summarization. This saves one full LLM round-trip per debate round — potentially 5–15 seconds per round.

### 2. Use `asdict()` not `__dict__` for dataclasses
`__dict__` on a dataclass works today but breaks silently if you add a nested dataclass field. The codebase uses `asdict()` everywhere — keep it consistent.

```python
# Wrong
full_discussion=[item.__dict__ for item in session.rounds]

# Right
from dataclasses import asdict
full_discussion=[asdict(item) for item in session.rounds]
```

### 3. Extract repeated code into helpers
The usage finalization block (stop collection, compute totals, write to session) was copy-pasted in two places. Extracted to `_apply_usage(session, token)`. General rule: if you see the same 4+ lines in two places, extract them.

### 4. Don't put UI names in backend code
`intent.py` had `"Which interpretation should John, Christy, and Mark use?"` hardcoded in the backend. John/Christy/Mark are frontend persona names. If the UI renames them, the backend produces wrong text silently. Changed to generic `"the team"`.

### 5. Delete session: use try/except, not exists() + unlink()
```python
# Wrong — TOCTOU race condition + dead missing_ok flag
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

---

## Project structure cheat sheet

```
MultiAi/
  backend/
    api/
      app.py           ← FastAPI routes (/api/consult, /api/consult-stream, /api/health)
      schemas.py       ← Pydantic request/response models
      sessions.py      ← Session list/get/delete routes
    consensus/
      engine.py        ← Main orchestrator (ConsensusEngine.consult)
      debate_runner.py ← Round loop (run_rounds)
      llm_clients.py   ← OpenRouter HTTP wrapper (call_openrouter)
      scorer.py        ← Rates agreement between two answers (1–10)
      summarizer.py    ← Compresses a round into rolling context
      validator.py     ← Checks if final answer is relevant to the question
      intent.py        ← Detects if the question needs clarification
      models.py        ← DebateRound, DebateSession dataclasses
      prompts.py       ← ALL prompt templates (do not edit without care)
      attachments.py   ← Parses file uploads (text, PDF, image)
      costs.py         ← Token pricing per model
      usage_tracker.py ← Per-request token/cost collector (uses ContextVar)
      model_registry.py← Maps product aliases to real OpenRouter model IDs
      activity_text.py ← Builds human-readable activity feed messages
      parsing.py       ← Extracts revised answer from critic output
    config.py          ← All constants + env var loading (AppConfig dataclass)
    storage/
      session_store.py ← save/load/list/delete JSON session files
  frontend/
    src/
      App.tsx          ← Root component, all state lives here
      types.ts         ← Shared TypeScript types
      components/      ← ChatPanel, Composer, SettingsBar, Sidebar, etc.
      services/
        api.ts         ← fetch wrappers for all backend endpoints
        attachments.ts ← File/clipboard reading utilities
        exporter.ts    ← Download as Markdown or PDF
      data/
        experts.ts     ← Persona definitions (names, avatars, fun facts)
        models.ts      ← LLM options shown in UI dropdowns
  tests/               ← pytest tests (all mock LLM calls, never real API)
  .env                 ← secrets (gitignored — never commit this)
  CLAUDE.md            ← instructions for Claude Code
```

---

## Coding conventions to keep

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
Always run the backend from the project root (`MultiAi/`), not from inside `backend/`. The module path `backend.api.app` requires `backend` to be a package visible from the current directory.

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

## Commands (always run from MultiAi/ root)

```bash
# Backend
uv run uvicorn backend.api.app:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm run dev

# Tests
uv run pytest tests/
uv run pytest tests/test_scorer.py            # single file
uv run pytest tests/test_scorer.py::test_foo  # single test

# First-time uv setup (do once, then forget about it)
winget install astral-sh.uv   # PowerShell only, then restart terminal
uv sync                        # creates .venv and installs all dependencies
```

---

## Environment variables (.env file)

```
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
DEFAULT_WRITER_MODEL=openai/gpt-5.4
DEFAULT_CRITIC_MODEL_A=anthropic/claude-sonnet-4.6
DEFAULT_CRITIC_MODEL_B=google/gemini-3.1-pro
SCORER_MODEL=deepseek/deepseek-chat-v3.2
SUMMARIZER_MODEL=deepseek/deepseek-chat-v3.2
```

The `.env` file is gitignored. Never commit it. On a new machine, recreate it manually from this list.

---

## What to do first when starting a similar Python + React project

1. Create the project folder, `git init`
2. Install uv: `winget install astral-sh.uv` (restart terminal after)
3. Run `uv init` in the project root — creates `pyproject.toml`
4. Add backend dependencies: `uv add fastapi uvicorn python-dotenv httpx pydantic`
5. Add dev dependencies: `uv add --dev pytest pytest-mock`
6. Scaffold the frontend: `npm create vite@latest frontend -- --template react-ts`
7. Create `.env` and add it to `.gitignore` immediately (before any first commit)
8. Write `CLAUDE.md` with architecture notes before you forget them
9. From day one: run everything from the project root, never from subdirectories

---

## When you're ready to deploy to Railway

These changes are needed before deploying — don't do them now, do them at deploy time:

- Start command must use `--host 0.0.0.0 --port $PORT` (not `localhost:8000`)
- `sessions/` directory needs a Railway persistent volume (otherwise sessions vanish on redeploy)
- Tighten CORS in `app.py` — change `allow_origins=["*"]` to your actual frontend URL
- All `.env` variables go into Railway's dashboard environment settings (never in code)
- Frontend deploys separately (Vercel or Railway static site) with the backend URL configured
