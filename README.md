# MultiAi

React-first multi-LLM consensus app with a FastAPI backend.

## What is implemented

- ChatGPT-style layout: left session sidebar, right chat workspace.
- Apple-like visual language: restrained palette, glass panels, subtle depth shadows.
- Full controls for Writer, Critic A/B, Max Rounds, and Consensus Score.
- Show/Hide full debate discussion beneath final answer.
- Backend consensus engine with fixed Deepseek scorer and summarizer routing.

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
