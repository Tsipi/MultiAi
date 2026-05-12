# Dev Setup & Environment

## Commands (always run from `MultiAi/` root)

```bash
# Backend
uv run uvicorn backend.api.app:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm run dev

# Tests
uv run pytest tests/
uv run pytest tests/test_scorer.py            # single file
uv run pytest tests/test_scorer.py::test_foo  # single test

# First-time uv setup (do once)
winget install astral-sh.uv   # PowerShell only, then restart terminal
uv sync                        # creates .venv and installs all dependencies
```

## Environment variables (`.env` file)

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

## Starting a similar Python + React project from scratch

1. Create the project folder, `git init`
2. Install uv: `winget install astral-sh.uv` (restart terminal after)
3. Run `uv init` in the project root — creates `pyproject.toml`
4. Add backend dependencies: `uv add fastapi uvicorn python-dotenv httpx pydantic`
5. Add dev dependencies: `uv add --dev pytest pytest-mock`
6. Scaffold the frontend: `npm create vite@latest frontend -- --template react-ts`
7. Create `.env` and add it to `.gitignore` immediately (before any first commit)
8. Write `CLAUDE.md` with architecture notes before you forget them
9. From day one: run everything from the project root, never from subdirectories
