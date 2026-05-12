# Deployment

## Current Status

🚧 Work in Progress

The project currently supports local development and early deployment workflows.

Core orchestration, debate loops, and frontend/backend communication are implemented. Production hardening and SaaS infrastructure are still evolving.

---

## Current Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend | FastAPI + Python |
| LLM Gateway | OpenRouter |
| Persistence | JSON session storage |
| Deployment Target | Railway |

---

## Local Development

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

---

## Environment Variables

```env
OPENROUTER_API_KEY=your_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

---

## Planned Improvements

Planned future deployment improvements include:
- authentication
- database persistence
- cloud storage
- production monitoring
- multi-user isolation
- rate limiting
- deployment automation

---

## Railway

The intended deployment target is Railway.

Frontend and backend services are expected to run as separate deployments communicating through HTTP APIs.
