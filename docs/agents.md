# Multi-LLM Consensus Engine
## Cursor Agent Rules — Phase 1

---

## Project Overview

A Python system that improves answer quality by running a question through multiple LLMs in a structured debate loop. 
One LLM generates an answer, a second and third LLM critique and improve it, the first refines based on the critique, and the loop continues until the three models reach consensus or a maximum round limit is hit. The final answer is synthesized from the converged positions.

No financial logic. No MCP. No database. Phase 1 is a clean, standalone consensus engine.

---
## User Input

The user will see a screen with the following inputs:

Five dropdown menus:

Writer - a dropdown menu of Claude Sonnet 4.6, OpenAI 5.4, Gemini 3.1 Pro, Deepseek v3.2. In the dropdown show the model name and cost (Sonnet 4.6 $1/$15, GPT-5.4 $0.9/$15, Gemini 3.1 Pro $1.15/$12, Deepseek v3.2 $0.2/$0.4)
Critic A - a dropdown menu with costs of Claude Sonnet 4.6, OpenAI 5.4, Gemini 3.1 Pro, Deepseek v3.2
Critic B - a dropdown menu with costs of Claude Sonnet 4.6, OpenAI 5.4, Gemini 3.1 Pro, Deepseek v3.2
Max Rounds - a dropdown menu with values: 1,2,3,4,5,6
Consensus score - a dropdown menu with values: 6,7,8,9,10
Show Full Discussion - a dropdown/toggle with values: On/Off

Role: a field up to 255 characters.

Your question/task: a field up to 2048 characters. 

## UI Screen

Similar to ChatGPT, the left sidebar holds previous questions and answers. The right area holds the current question or result. Mimic a ChatGPT-style interface.
Show the cost of the answer per model beneath the answer.
Add an option to expand the full discussion and show all debate messages, not only the final result.

## Project Structure

```
multi-llm-consensus/
│
├── agents.md                    ← this file (Cursor rules)
│
├── backend/
│   ├── consensus/
│   │   ├── __init__.py
│   │   ├── engine.py            ← main debate loop, ConsensusEngine class
│   │   ├── llm_clients.py       ← LLM wrappers
│   │   ├── summarizer.py        ← compresses each round into a short summary
│   │   ├── scorer.py            ← consensus scoring logic (always Deepseek v3.2)
│   │   └── models.py            ← dataclasses: DebateRound, DebateSession
│   │
│   ├── storage/
│   │   ├── __init__.py
│   │   └── session_store.py     ← save/load sessions as JSON files
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── app.py               ← API entrypoint used by React UI
│   │
│   ├── config.py                ← constants, env var loading, model names
│   └── requirements.txt
│
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.tsx
│       ├── components/
│       └── services/
│
├── tests/
│   ├── test_engine.py
│   ├── test_scorer.py
│   └── test_summarizer.py
│
└── .env                         ← API keys (gitignored)
```

---

## Tech Stack

| Component | Choice | Reason |
|---|---|---|
| Language | Python 3.11+ | Primary language |
| LLM Gateway | OpenRouter | Single API surface for all configured models |
| Session storage | JSON files | Simple, human-readable, no DB needed in Phase 1 |
| Config | python-dotenv | .enhttps://code.claude.com/docs/en/overviewock | Mock all LLM calls |
| Frontend | React | Chat-style UI and results rendering |

The software will be run locally in the beginning and then on Railway.

---

## Environment Variables

Never hardcode API keys. All secrets live in `.env`:

```
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
DEFAULT_WRITER_MODEL=openai/gpt-5.4
DEFAULT_CRITIC_MODEL_A=anthropic/claude-sonnet-4.6
DEFAULT_CRITIC_MODEL_B=google/gemini-3.1-pro
SCORER_MODEL=deepseek/deepseek-chat-v3.2
SUMMARIZER_MODEL=deepseek/deepseek-chat-v3.2
```

## Model Routing Policy

- Writer and Critic A/Critic B are selected by the user from the UI dropdowns.
- Scorer must always use Deepseek v3.2.
- Summarizer must always use Deepseek v3.2.
- Do not route scorer or summarizer to user-selected writer/critic models.

---

## Data Models (`consensus/models.py`)

```python
from dataclasses import dataclass, field, asdict
from datetime import datetime

@dataclass
class DebateRound:
    round_num:       int
    answer:          str
    critique:        str
    consensus_score: float
    consensus_reason: str
    summary:         str       # compressed ~150 word summary of this round

@dataclass
class DebateSession:
    session_id:   str
    question:     str
    domain:       str
    rounds:       list[DebateRound] = field(default_factory=list)
    final_answer: str = ""
    final_score:  float = 0.0
    timestamp:    str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> dict:
        d = asdict(self)
        return d
```

All functions that return session data must return a `DebateSession`, never a raw dict.

---

## Debate Loop (`consensus/engine.py`)

### Flow

```
React UI calls backend API (`/api/consult`) with question, role, model selections, max rounds, and consensus threshold
    │
    ▼
Round 1: LLM writer generates initial answer
    │
    ▼
Loop (up to MAX_ROUNDS or until consensus score is reached):
    ├── LLM critic A and B critiques current answer  (uses rolling summary context; critics are user-selected)
    ├── Scorer rates consensus 1–10 (use Deepseek v3.2)
    ├── Summarizer compresses this round → rolling_context (use Deepseek v3.2)
    ├── If score >= CONSENSUS_THRESHOLD → break
    └── LLM Writer refines answer            (uses rolling summary context)
    │
    ▼
LLM Writer synthesizes final answer from converged positions
    │
    ▼
Session saved to JSON file
    │
    ▼
DebateSession returned to caller
```

### Context Management — Critical Rule

Each round must use **rolling summaries only**, never the full transcript of previous rounds.

```
Round 1:  No prior context          → Writer answers fresh
Round 2:  Summary of Round 1        → LLMs critiques, Writer refines
Round 3:  Summary of Rounds 1 + 2   → LLMs critiques, Writer refines
Round N:  Summary of all prior rounds (concatenated, not re-summarized)
```

Rolling context is built by appending each round's summary string:

```python
rolling_context += f"\n[Round {round_num} summary]: {round_summary}"
```

This string is passed to LLMs in subsequent rounds — not the full answer or critique text.

### Prompt Templates

**Round 1 — Writer initial answer:**
```
You are a careful and thorough expert. Answer the following question in full.  Base answer on web search and studies if needed.

Question: {question}
```

**Subsequent rounds — LLM critique:**
```
You are a rigorous critic. Your job is to find weaknesses in an answer and suggest how to improve it.

Debate history so far:
{rolling_context}

Current answer to critique:
{current_answer}

Original question: {question}

Provide:
1. Your critique (what is missing, wrong, or could be stronger)
2. A fully revised and improved answer
```

**Subsequent rounds — Writer refinement:**
```
You are refining your answer based on a colleague's critique.

Debate history so far:
{rolling_context}

Original question: {question}

Critique of your last answer:
{critique}

Provide your refined answer, incorporating valid points from the critique:
```

**Final synthesis — Writer:**
```
Two expert reviewers have debated a question and converged on an answer.
Synthesize the single best final answer, clean and well-structured.

Question: {question}

Final position A:
{current_answer}

Final critique / position B:
{critique}

Provide the definitive synthesized answer:
```

Do not alter these prompt templates without explicit instruction. Wording changes affect consensus behavior.

---

## Scorer (`consensus/scorer.py`)

The scorer calls a fixed Deepseek v3.2 model with trimmed excerpts (max 600 chars each) — never full answer text.
Use Deepseek v3.2 model for scorer.

### Scorer Prompt (do not modify)

```
Rate the consensus between two answers on a scale of 1 to 10.

10 = fully aligned, no meaningful disagreement
7+ = minor wording or emphasis differences only
5-6 = partial agreement, some substantive gaps
Below 5 = significant disagreement

Answer A:
{answer_a[:600]}

Answer B:
{answer_b[:600]}

Respond ONLY in this exact format:
SCORE: [number]
REASON: [one sentence]
```

### Scorer Return

```python
def score_consensus(answer_a: str, answer_b: str) -> tuple[float, str]:
    # returns (score: float, reason: str)
```

Parse strictly — if the response does not match `SCORE: N` format, log a warning and return `(5.0, "parse error")`. Do not crash.

---

## Summarizer (`consensus/summarizer.py`)

Compresses a full round into up to 300 words for use in rolling context.
Use Deepseek v3.2 model for summarizer.

### Summarizer Prompt (do not modify)

```
Summarize this debate round in 3-4 sentences. Capture:
- The core position taken in the answer
- The main point of the critique
- What changed or was agreed upon

Answer:
{answer[:800]}

Critique:
{critique[:800]}

Write a concise summary only. No preamble.
```

Call with `max_tokens=200` — enforce this hard limit to keep rolling context tight.

### Summarizer Return

```python
def summarize_round(answer: str, critique: str) -> str:
    # returns summary string, max ~200 tokens
```

---

## LLM Clients (`consensus/llm_clients.py`)

### Rules for LLM clients

- Clients are singletons — instantiated once, reused across calls
- All calls wrapped in try/except — on failure, log the error and raise a `LLMCallError`
- Never pass `temperature` unless explicitly told to — use model defaults
- Never stream responses in Phase 1 — use standard blocking calls only
- Use the OPENROUTER_API_KEY in the .env file to access the models
- Writer and critics use user-selected models from the UI
- Scorer and summarizer ignore UI selection and always use Deepseek v3.2


---

## Session Storage (`storage/session_store.py`)

Sessions are saved as individual JSON files, one per session.

```
sessions/
    20260315_143022.json
    20260315_160811.json
    ...
```



### Rules

- Session ID format: `YYYYMMDD_HHMMSS` generated at the start of `consult()`
- Save after the session completes — never during the loop
- If the sessions directory does not exist, create it automatically
- `load_session` must reconstruct the full `DebateSession` dataclass, not return a raw dict

---



## Token Budget

Target per session:

| Component | Target |
|---|---|
| Round 1 answer | ≤ 800 tokens |
| Each critique | ≤ 800 tokens |
| Each refinement | ≤ 800 tokens |
| Each summary | ≤ 200 tokens |
| Each scoring call | ≤ 100 tokens |
| Final synthesis | ≤ 800 tokens |
| **Total (4 rounds)** | **≤ 8,000 tokens** |

Log a warning if any single session exceeds 12,000 tokens total.

---

## Coding Standards

### General

- Python 3.11+ — use dataclasses, type hints on all function signatures
- Docstrings on all public functions and classes
- No magic numbers anywhere — all thresholds and limits defined in `config.py`
- All file paths use `pathlib.Path`, never string concatenation

### Error Handling

- Wrap every LLM API call in try/except
- Define a custom `LLMCallError(Exception)` in `consensus/llm_clients.py`
- On LLM failure mid-debate: log the error, return the last valid `DebateSession` with a note in `final_answer`
- On scorer parse failure: log warning, use fallback score of `5.0`, continue the loop

### Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
```

| Level | When |
|---|---|
| INFO | Round completions, scores, session saved |
| WARNING | Token budget exceeded, scorer parse failure, score < 5 |
| ERROR | LLM API failure, file I/O failure |

### No Global State

- LLM clients use module-level singletons (lazy init) — this is the only allowed global state
- `ConsensusEngine` takes `config` as constructor argument — no reading from `os.environ` inside methods
- Session store functions are stateless — they take `sessions_dir` as a parameter

---

## Testing Rules

- All tests in `tests/` — mirror the `consensus/` and `storage/` structure
- Use `pytest` and `pytest-mock`
- **Never make live API calls in tests** — always mock LLM client calls
- DB not used in Phase 1 — no DB mocking needed
- Use `tmp_path` pytest fixture for session storage tests

### Example test pattern

```python
# tests/test_scorer.py

def test_scorer_returns_float_and_string(mocker):
    mocker.patch(
        "consensus.scorer.call_openrouter",
        return_value="SCORE: 7.5\nREASON: Minor differences in framing only."
    )
    from consensus.scorer import score_consensus
    score, reason = score_consensus("Answer A text", "Answer B text")
    assert score == 7.5
    assert isinstance(reason, str)

def test_scorer_handles_parse_failure(mocker):
    mocker.patch("consensus.scorer.call_openrouter", return_value="I cannot rate this.")
    from consensus.scorer import score_consensus
    score, reason = score_consensus("A", "B")
    assert score == 5.0   # fallback
    assert reason == "parse error"
```

---

## What NOT to Do

- **Do not pass full round transcripts** to subsequent rounds — rolling summaries only
- **Do not hardcode API keys** anywhere in source files
- **Do not build or maintain a CLI entrypoint in Phase 1** — React UI + backend API only
- **Do not add a database** in Phase 1 — JSON file storage only
- **Do not alter scorer or summarizer prompts** without explicit instruction
- **Do not make live API calls in tests** — always mock
- **Do not use `print()` for logging** — use the `logging` module throughout
- **Do not return raw dicts** from engine functions — always return `DebateSession` or `DebateRound`
- **Do not stream LLM responses** in Phase 1

---

## .gitignore

```
.env
sessions/
__pycache__/
*.pyc
.venv/
*.log
```

