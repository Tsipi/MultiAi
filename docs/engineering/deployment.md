# Deployment (Railway)

Do these at deploy time — not before.

- Start command must use `--host 0.0.0.0 --port $PORT` (not `localhost:8000`)
- `sessions/` directory needs a Railway persistent volume (otherwise sessions vanish on redeploy)
- Tighten CORS in `app.py` — change `allow_origins=["*"]` to your actual frontend URL
- All `.env` variables go into Railway's dashboard environment settings (never in code)
- Frontend deploys separately (Vercel or Railway static site) with the backend URL configured 
Status: Work in progress. Core local architecture is implemented; deployment hardening is ongoing.
