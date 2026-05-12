## Project Overview
MultiAi is a SaaS web app providing a multi-LLM consensus dashboard — better answers through structured AI agent collaboration. Users sign in, then view, manage, and interact with a live debate between AI agents.

The debate UX is a **Slack-style chatroom** (`ChatroomDebateView`). Each agent has a distinct avatar and name; they post messages into a single scrollable feed as the debate progresses. Round boundaries appear as channel dividers. The Scorer posts like a status-update bot. Typing indicators appear between messages. The final answer is pinned at the top of the channel — permanently visible. This layout scales naturally to any number of team members.

---

## Commands

Run all commands from the project root (`MultiAi`).

### Backend
```bash
uv run uvicorn backend.api.app:app --reload --port 8000
```

### Frontend
```bash
cd frontend && npm install
npm run dev        # Dev server at http://localhost:5173
npm run build      # tsc + vite build
npm test           # vitest run
```

### Python Tests
```bash
uv run pytest tests/                          # All tests
uv run pytest tests/test_scorer.py            # Single test file
uv run pytest tests/test_scorer.py::test_name # Single test
```

### uv setup (first time only)
```bash
winget install astral-sh.uv   # install uv (PowerShell)
uv sync                        # create .venv and install all dependencies
```

## Architecture

MultiAi is a multi-LLM consensus engine. 
The user poses a question; 
a Writer LLM answers it, two Critic LLMs critique it, and the loop continues until a Scorer (always Deepseek v3.2) rates agreement ≥ the configured threshold or max rounds is reached. 
A Summarizer (always Deepseek v3.2) compresses each round into a rolling context used in subsequent rounds. All LLM calls go through OpenRouter.

### Debate loop flow

```
POST /api/consult-stream
  → ConsensusEngine.run()
    → Round 1: Writer answers fresh
    → Loop:
        Critics A & B critique (use rolling_context, not full transcript)
        Scorer rates 1–10 (Deepseek v3.2 only, 600-char excerpts)
        Summarizer compresses round → appended to rolling_context (Deepseek v3.2, max_tokens=200)
        If score >= threshold → break
        Writer refines answer
    → Writer synthesizes final answer
  → Session saved as sessions/YYYYMMDD_HHMMSS.json
```

### Context management rule (critical)
Rolling context is **append-only summaries**, never full transcripts:
```python
rolling_context += f"\n[Round {round_num} summary]: {round_summary}"
```
This string — not the full answer/critique text — is passed to LLMs in subsequent rounds.

### Model routing
- Writers and Critics: user-selected from UI (N writers and N critics supported — see below)
- Scorer: always `deepseek/deepseek-chat-v3.2`
- Summarizer: always `deepseek/deepseek-chat-v3.2`
- Never route scorer/summarizer to user-selected models

### N-writer / N-critic support (implemented)
The engine accepts `writers: list[str]` and `critics: list[str]` (1–6 each). Behavior:
- **N writers:** All draft in parallel in round 1; their answers are merged and labeled `[Writer 1]`, `[Writer 2]`, etc. The primary writer (first) handles all refinements and final synthesis.
- **N critics:** All critique in parallel every round. Critiques are merged and labeled. Consensus score is the average of all pairwise scores across critics' revised answers. Single-critic sessions compare the writer's answer directly against the critic's suggestion.
- **Frontend:** `mergeTeamIntoPayload` sends `writers` and `critics` as full lists. Legacy `writer`/`critic_a`/`critic_b` fields are also sent for backward compat; the backend prefers the list fields.
- **Cap:** max 6 writers, max 6 critics (enforced in `schemas.py`).

### Key modules
| File | Responsibility |
|------|---------------|
| `backend/consensus/engine.py` | `ConsensusEngine` — main debate orchestrator |
| `backend/consensus/debate_runner.py` | Executes individual debate rounds |
| `backend/consensus/llm_clients.py` | OpenRouter wrapper; defines `LLMCallError` |
| `backend/consensus/scorer.py` | `score_consensus() → (float, str)` |
| `backend/consensus/summarizer.py` | `summarize_round() → str` |
| `backend/consensus/models.py` | `DebateRound`, `DebateSession` dataclasses |
| `backend/consensus/intent.py` | Intent ambiguity detection and clarification |
| `backend/config.py` | All constants and env var loading |
| `backend/api/app.py` | FastAPI routes (`/api/consult`, `/api/consult-stream`, `/api/health`) |
| `backend/storage/session_store.py` | Save/load sessions as JSON files |
| `frontend/src/App.tsx` | Main React component; session state, API calls |
| `frontend/src/services/api.ts` | Backend fetch wrapper |

## Coding standards

- Python 3.11+: type hints on all function signatures, dataclasses for models
- All constants and limits defined in `config.py` — no magic numbers
- All file paths use `pathlib.Path`
- `ConsensusEngine` takes `config` as constructor arg — no `os.environ` inside methods
- Session store functions are stateless — accept `sessions_dir` as parameter
- LLM clients are module-level singletons (lazy init) — the only allowed global state
- Return `DebateSession` or `DebateRound` from engine functions — never raw dicts
- Logging via `logging` module only (never `print()`): INFO for completions, WARNING for parse failures/budget exceeded, ERROR for API/IO failures

## Prompt templates

Do not modify scorer, summarizer, or debate prompt templates without explicit instruction — wording changes affect consensus behavior. Templates live in `backend/consensus/prompts.py`.

## Testing

- All tests mock LLM calls — never make live API calls in tests
- Use `pytest-mock` and `tmp_path` fixture for session storage tests
- Token budget: warn if any session exceeds 12,000 tokens total

## Token budget

| Call | Target |
|------|--------|
| Round 1 answer / critique / refinement / synthesis | ≤ 800 tokens each |
| Summarizer | ≤ 200 tokens (`max_tokens=200` enforced) |
| Scorer | ≤ 100 tokens (600-char excerpts only) |

## Environment variables

All secrets in `.env` (gitignored):
```
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
DEFAULT_WRITER_MODEL=openai/gpt-5.4
DEFAULT_CRITIC_MODEL_A=anthropic/claude-sonnet-4.6
DEFAULT_CRITIC_MODEL_B=google/gemini-3.1-pro
SCORER_MODEL=deepseek/deepseek-chat-v3.2
SUMMARIZER_MODEL=deepseek/deepseek-chat-v3.2
```

## What NOT to do

- Do not pass full round transcripts to subsequent rounds — rolling summaries only
- Do not alter scorer or summarizer prompts without explicit instruction
- Do not return raw dicts from engine functions
- Do not add a database — JSON file storage only
- Do not build a CLI entrypoint — React UI + backend API only
- Do not use `print()` for logging

---

## Current Plan

**Version:** v3 — Slack-Style Chatroom Debate Experience  
**Authored:** 2026-04-09  
**Scope:** Frontend only — no backend changes. Same existing NDJSON activity stream.

### Design vision

The debate feels like watching a team Slack channel in real-time. Agents post messages one after another as the debate progresses. Each has a distinct avatar and name. Round boundaries appear as Slack-style date dividers. The Scorer drops in like a bot posting a status update. Typing indicators appear between messages. The final answer appears as a pinned message at the top of the channel — the most important thing, permanently visible. This layout scales naturally to any number of team members.

### New components to create

| File | Description |
|------|-------------|
| `frontend/src/components/ChatroomDebateView.tsx` | Main chatroom container — replaces `DebateActivityFeed` during live runs and historical replay |
| `frontend/src/components/ChatMessage.tsx` | Individual Slack-style message row (avatar, name, role badge, timestamp, text) |
| `frontend/src/components/ScoreBadge.tsx` | Scorer bot post row — visually distinct from peer messages |
| `frontend/src/components/RoundDivider.tsx` | Round section separator, styled like Slack date dividers |
| `frontend/src/components/TypingRow.tsx` | Active speaker typing indicator with staggered bouncing dots |
| `frontend/src/components/ChannelHeader.tsx` | Top bar: channel name, Live badge, round counter, animated score, team avatars |
| `frontend/src/components/PinnedAnswer.tsx` | Sticky final answer card below header; collapsed by default, expands on toggle |
| `frontend/src/components/ConsensusReachedBanner.tsx` | Inline consensus-reached callout, styled as a Slack info callout |
| `frontend/src/lib/parseActivityMessages.ts` | Pure fn: `string[]` → `ChatroomState` — derives speaker, round, score, consensus from activity lines |

### Files to modify

| File | Change |
|------|--------|
| `frontend/src/components/ChatPanel.tsx` | Replace `DebateActivityFeed` with `ChatroomDebateView`; reorder result blocks |
| `frontend/src/index.css` | Agent color CSS custom properties |

### Agent color palette

| Agent | Color token |
|-------|-------------|
| Writer | `text-violet-600 / dark:text-violet-400` |
| Critic A | `text-blue-600 / dark:text-blue-400` |
| Critic B | `text-orange-600 / dark:text-orange-400` |
| Extra critics (future) | cycle: teal → rose → amber |

### Key constraints

- **Frontend only** — the NDJSON activity stream from the backend is unchanged.
- `parseActivityMessages` is a pure function with no React or side effects — all state derivation lives there.
- The `ChatroomDebateView` receives `activity: string[]`, `cast`, `team`, `loading`, `maxRounds`, `consensusThreshold`, and optionally `result`.
- `PinnedAnswer` is sticky below `ChannelHeader`; it only renders once `result` is populated.
- Auto-scroll to bottom while loading; snap to top when result arrives; pause auto-scroll if the user manually scrolls up and show a "Jump to live" button.
- Extra team members beyond the 3 engine slots are shown in the channel header avatar row with 50% opacity and a "(not in session)" tooltip — they do not post messages.
