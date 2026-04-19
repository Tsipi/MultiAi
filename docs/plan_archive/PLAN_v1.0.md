# VERSION1.md

## Project Overview
This will be a saas web app that will provide a multi-LLM consensus dashboard - gives Better answers through structured AI agents collaboration.

Users will sign in View, Manage and interact with this dashboard.

---

## Version 1 - 29 March 2026 - 3 Main content areas: 

### 1. Left Sidebar - "Team answers" - previous runs

  User sessions history - user can navigate and see the different answers he got.
  
  Includes 
  * Section Title
    * Label: Team Answers
    * Subtitle: Previous runs
  * Runs List - Array of past runs
    Each item includes:
    * truncated prompt (string)
    * clickable container (loads run answes fot from the previous run of the question)
    * delete icon (optional action)

### 2. MULTI-LLM Definitions Board (3 sections) 
processing - Multi-agent loop: writer → critics → refinement → repeat

#### 1. Task Definition Section
Includes
* Title - "What should your AI squad solve?"
* Lead Expert Role - Type Text Input (define the mindset, tone and it will be constraint for all team Agents)
* Task/prompt - text area (Define the mission, expected output format, and constraints)
* Context Files - file input + clipboard input (upload files txt/pdf/images), paste content - files are parsed and injected into prompt context.
* UX notes - includes inline tips (static helper text) encourage structured prompts

#### 2. Team configuration

Includes
* title: "Your Team of Experts"
* The team member list (array of objects) - each card represent one agent

  ```
  TeamMember 
    { id: string 
      name: string
      persona_title: string 
      description: string 
      seat: "writer" | "critic" 
      model: string 
      specialty: string }
  
* UI Elements per Member
    * Identity - avatar, name (dropdown)
    * Persona - title (e.g. "BOARD GAME BOSS")
    * description (static or editable)
    * Seat Selection: Writer / Critic
    * Model Selection - LLM provider/model (e.g. Deepseek, Gemini)
    * Specialty Input - free text describing expertise 
    * Action buttons -
      * Adopt Main Expert Role
      * Delete Team mamber

* Add Team member button - append new TeamMember to array
* Debate Controls
  Includes
  * Debate passes - selection of number - it will redefine the number of refinement loops
  * Agreement Score: Selection of number - it wiil thresold stopping iterations
  * Explanation text describing the Blocks - 
    "Debate passes = how many critique-and-rewrite loops your team can run before wrapping.Agreement score = how aligned the writer and critics must be before the team stops.Scorer + Summarizer stay on Deepseek v3.2, the unshakeable backstage manager.Under the hood, one writer + two critics perform each run (first matching seats from your lineup)."
* Excecution Layer
  Includes
  * primary CTA - "ASK TEAM" that triggers the backend orchestration and multi-agent loop execution

#### 3. Excecution Section

drop the mission and you will see the Squad Brainstorm, roas ideas and sheip the cleen answer

This is how this board looks today

![MULTI-LLM Definitions Screen](image-2.png)

### 3. History Main Board (5 sections) 

#### 1. Header Bar - session state + navigation
    
Includes
  * Label: Viewing saved session
  * Action button: New question  

Behavior
  * “New question” resets state
  * Header changes based on session mode (new / saved)

#### 2. Session Metadata Section - Display run metrics + context

Includes
  1. Metrics Row
      * Total Cost
      * Total Tokens
      * Agreement Score
      * Session id - TO Be added
  2. Context Block
      * Role (string)
      * Prompt (string)
      * Uploaded files (array of filenames)
            
#### 3. Output Section - Final Answer From The Crew this is the primary product output

Includes

  * Title - "Final Answer from the Crew"
  * Answer Container - Markdown-rendered content

#### 4. Followup Section - Continue Thread - allow iterative usage (retention driver) 

Includes
* label "Want to continue this thread?"
* Description text
* CTA button "Ask follow-up" which will sends the original prompt, final answer

#### 5. Action Section - Export + advanced inspection 

Includes 
* Export Buttons
  * Download Markdown
  * download pdf
* Technical Info - Collapsible 
  * Model Token & cost Breakdown
  * Director's Cut: full Debate (title only)
* Session Info
  * session ID / timestamp

This is how the sidebar and History Main board looks today - 

![Sidebar and History Main Board screen](image-1.png)

## Commands

### Backend
```bash
pip install -r backend/requirements.txt
uvicorn backend.api.app:app --reload --port 8000
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
pytest tests/                          # All tests
pytest tests/test_scorer.py            # Single test file
pytest tests/test_scorer.py::test_name # Single test
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
- Writer, Critic A, Critic B: user-selected from UI
- Scorer: always `deepseek/deepseek-chat-v3.2`
- Summarizer: always `deepseek/deepseek-chat-v3.2`
- Never route scorer/summarizer to user-selected models

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
