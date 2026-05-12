# MultiAI 
Design your own AI thinking team.

Multiple AI agents debate, critique, and refine answers until consensus is reached.

Multi-agent LLM consensus app with a React frontend and FastAPI backend.

![Hero Screenshot](/docs/images/hero.png)

## Product summary
A configurable multi-agent orchestration platform where LLMs collaborate through iterative critique and consensus workflows.

MultiAI is a React + FastAPI multi-agent LLM orchestration app. The user sends a question or mission to a configurable AI team. The team can include one or more Writer agents and one or more Critic agents. Each agent can be assigned a model and role context from the UI. The backend runs the team through a structured debate/refinement loop until the answer reaches the configured agreement score or the maximum debate round limit is reached.

The product direction is **Agents Studio**: a workspace where users define an AI team, give each member a role and model, attach context files, run the team, inspect the debate, and save the final answer.

**Status: Work in Progress**
Core local architecture and multi-agent orchestration are implemented. 
UI/UX, deployment hardening, and advanced multi-agent capabilities are still evolving.

## Tech Stack

### Frontend at `localhost:8000`
- React
- TypeScript
- Vite

### Backend at `localhost:5173`
- FastAPI
- Python

### AI / LLM
- OpenRouter (one key → GPT, Claude, Gemini, Deepseek)
- Multi-agent orchestration
- Consensus scoring
- Structured debate workflows

### Infrastructure
- Railway
- JSON session persistence - JSON files in `sessions/`

## Features
The frontend supports a team-based setup and sends writers[] and critics[] arrays to the backend. The backend debate runner supports multiple writers drafting in parallel and multiple critics reviewing the answer in each round.

- User enters a question/mission in the main command area.
- User can open advanced setup.
- User can define team members as either `Writer` or `Critic`.
- Each team member has:
  - display name/avatar,
  - duty/seat: Writer or Critic,
  - selected LLM model,
  - role/expertise text.
- User can attach context files/images.
- Frontend builds a run payload from the configured team.
- Backend runs a multi-round debate loop.
- Writer drafts the opening answer.
- If there are multiple writers, they draft opening answers in parallel.
- Critics critique the current answer in parallel.
- The system scores agreement between revised answers.
- The primary writer rewrites based on all critic feedback.
- Each round is summarized into rolling context.
- The loop stops when consensus/relevance passes the threshold or max rounds are reached.
- Final answer is synthesized by the primary writer.
- Session metadata is saved, including question, final answer, rounds, model usage, cost, tokens, follow-up data, and attachments.
- UI displays:
  - saved sessions in the left sidebar,
  - final answer,
  - agreement score,
  - full debate / “Director’s Cut”,
  - session insights with token/cost usage by model.

## How It Works - The Flow

User question + context files
        ↓
User-defined AI team
        ↓
Configurable Writer and Critic agents
        ↓
Structured debate / critique / refinement loop
        ↓
Agreement score + relevance validation
        ↓
Final synthesized answer
        ↓
Saved session with debate transcript, cost, tokens, and model usage

Note: the backend supports multiple writers and critics. 
The frontend is optimized for the default Writer + Critic A/B setup, while broader N-agent visualization support is still in progress.

### Frontend

The frontend is a Vite React app written in TypeScript.

Main responsibilities:

- Team setup UI
- Prompt input / command bar
- Attachments UI
- Session sidebar
- Result display
- Debate transcript display
- Session insights drawer
- Dark mode support
- API calls to the FastAPI backend

Key frontend areas:

```text
frontend/src/App.tsx                    Main app state and orchestration
frontend/src/components/                UI components
frontend/src/components/AdvancedDrawer  Team setup, roles, files, rounds, models
frontend/src/components/InsightsDrawer  Cost, token, and per-model usage
frontend/src/components/ChatPanel       Final answer and full debate view
frontend/src/components/ConsensusRunsSidebar  Saved sessions sidebar
frontend/src/data/experts.ts            Team member structure and presets
frontend/src/data/models.ts             Model options
frontend/src/lib/consultHelpers.ts      Converts team setup into API payload
frontend/src/services/api.ts            Backend API wrapper
frontend/src/types.ts                   Shared frontend types
```

### Backend

The backend is a FastAPI Python service.

Main responsibilities:

- Receive consult requests
- Manage clarification flow
- Handle context attachments
- Run the debate/refinement loop
- Call OpenRouter models
- Score agreement
- Validate relevance
- Summarize rounds into rolling context
- Synthesize the final answer
- Track model usage/costs/tokens
- Save sessions as JSON files

Key backend areas:

```text
backend/api/app.py                  FastAPI routes
backend/consensus/engine.py         Main orchestration entry point
backend/consensus/debate_runner.py  Multi-round writer/critic loop
backend/consensus/prompts.py        Prompt templates
backend/consensus/scorer.py         Agreement scoring
backend/consensus/summarizer.py     Round summarization
backend/consensus/validator.py      Relevance validation
backend/consensus/usage_tracker.py  Token and cost tracking
backend/consensus/models.py         DebateSession and DebateRound models
backend/storage/session_store.py    JSON session persistence
backend/config.py                   App configuration and env values
```


## Debate loop — current behavior

1. User submits question, role context, team setup, max rounds, agreement threshold, and attachments.
2. Backend normalizes attachments and adds extracted text to the question context.
3. If image input is used, unsupported Deepseek image model selections are switched to Gemini Flash.
4. Intent is assessed. If the question is too ambiguous, the app returns a clarification state instead of running the debate.
5. Writer phase:
   - one writer drafts the opening answer, or
   - multiple writers draft opening answers in parallel.
6. Critic phase:
   - all critics critique the current answer in parallel.
7. Agreement scoring:
   - revised answers are extracted from critic outputs,
   - the scorer produces a consensus score and reason.
8. Refinement:
   - primary writer rewrites the answer using all critic feedback.
9. Relevance validation:
   - refined answer is checked against the original question.
10. Summarization:
   - round summary is appended to rolling context.
11. Loop continues until:
   - agreement score reaches threshold and relevance is acceptable, or
   - max rounds is reached.
12. Primary writer synthesizes the final answer.
13. Session is saved to JSON storage.

## What is currently user-configurable

| Area | Current status |
|---|---|
| Question / mission | Implemented |
| Lead expert role | Implemented |
| Context files | Implemented / in progress |
| Team members | Implemented in UI |
| Add/remove team members | In progress / UI direction exists |
| Agent seat: Writer/Critic | Implemented |
| Model per agent | Implemented |
| Agent expertise/role text | Implemented in UI, but backend currently sends mainly the selected writer role as global role context |
| Max debate rounds | Implemented |
| Consensus/agreement score | Implemented |
| Session history | Implemented through JSON sessions |
| Cost/token insights | Implemented |
| Full debate view | Implemented |
| Follow-up sessions | Implemented / in progress |
| Authentication / real SaaS accounts | Not implemented yet |
| Database persistence | Not implemented; current v1 uses JSON session storag |

## Known definition gap

The UI is moving toward true **per-agent role/tone/model configuration**, but the backend is not fully using every per-agent role/tone field yet. The current backend accepts arrays of writer models and critic models, but the role context is still mostly treated as one shared role/domain string.

## Screenshots

### 1. Team Workspace
![Hero Screenshot](/docs/images/hero.png)

### 2. Configure Your Agent Team
![Team set up screenshot](/docs/images/team-setup.png)

### 3. Debate & Consensus Process
![Debate screenshot](/docs/images/debate.png)

### 4. Usage & Agreement Metrics
![session insights screenshot](/docs/images/session-insights.png)


## Run locally

### Backend

```bash
pip install -r backend/requirements.txt
uvicorn backend.api.app:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.
