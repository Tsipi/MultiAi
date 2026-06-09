# Railway Deployment Guide

A step-by-step guide for deploying MultiAi to Railway — written for someone who has never used Railway before.

---

## What is Railway?

Railway is a cloud hosting platform. You give it your GitHub code and it:
- Builds your app automatically every time you push a commit
- Runs it on a server somewhere in the cloud
- Gives you a public URL (e.g. `https://multiai-backend.up.railway.app`)
- Can also give you a managed PostgreSQL database

You do not need to set up a server, install Linux, configure Nginx, or use Docker. Railway handles all of that.

---

## What we are deploying

MultiAi has two parts that need to run in the cloud:

| Part | What it is | How Railway runs it |
|---|---|---|
| **Backend** | Python / FastAPI server | Runs `uvicorn` as a long-running process |
| **Frontend** | React app (static HTML/CSS/JS files) | Built once with `npm run build`, then served as static files |
| **Database** | PostgreSQL | Railway provides this as a managed "plugin" — you just click to add it |

In Railway terms each of these is called a **service**. You will have 3 things in your Railway project: backend service + frontend service + PostgreSQL database.

---

## Before you start — what you need

- A **Railway account** — sign up free at [railway.app](https://railway.app). You can log in with your GitHub account.
- Your **MultiAi repo on GitHub** — the code must be in a GitHub repository. If it is only on your laptop, push it first: `git push origin main`.
- Your **OpenRouter API key** — from [openrouter.ai](https://openrouter.ai) → Keys.

---

## Step 1 — Create a new Railway project

A "project" in Railway is a container that holds all your services together (backend, frontend, database). They share environment and can talk to each other privately.

1. Log in to [railway.app](https://railway.app)
2. Click the **"New Project"** button (top right of the dashboard)
3. A menu appears — choose **"Empty project"**
   - Do NOT choose "Deploy from GitHub repo" yet — we want to set up the database first
4. Railway creates a blank project and opens it. You will see an empty canvas.

**What you see:** A grey empty workspace. At the top it shows your project name (something random like "luminous-eagle"). You can rename it by clicking the name.

---

## Step 2 — Add the PostgreSQL database

The database is where all debate sessions, user accounts, and results are stored permanently. Railway manages it for you — you never have to install or configure PostgreSQL yourself.

1. Inside your project, click the **"+ New"** button (top right of the canvas)
2. Choose **"Database"**
3. Choose **"Add PostgreSQL"**
4. Railway spins up a PostgreSQL database in about 10–20 seconds. You will see a purple box appear on the canvas labelled "Postgres".

**What just happened:** Railway created a real PostgreSQL database server and generated a secret connection URL for it. That URL (called `DATABASE_URL`) will be automatically available to any service in this project — you do not need to copy/paste it manually.

**Why database first:** We add the database before the backend so that when the backend deploys it can immediately connect to it.

---

## Step 3 — Add the backend service

The backend service runs your FastAPI Python server. This is what handles API requests from the frontend.

### 3a — Connect your GitHub repo

1. Click **"+ New"** again
2. Choose **"GitHub Repo"**
3. Railway will ask you to authorise access to GitHub if you have not already — click "Authorise Railway" and follow the GitHub prompt
4. After authorising, a list of your repos appears — find and click **"MultiAi"**
5. Railway starts trying to deploy it immediately. **Stop it for now** — click the service box that appeared, go to **"Settings"**, and we will configure it properly before it runs.

### 3b — Set the root directory

By default Railway thinks the whole repo is the Python app. We need to tell it the root is `/` (the repo root — not the `backend/` subfolder). Alembic and all Python code work relative to the repo root.

1. Click your backend service box
2. Click the **"Settings"** tab
3. Find **"Root Directory"** — leave it as `/` (empty = root, which is correct)

**Why this works:** The repo root contains a `requirements.txt` file (one line: `-r backend/requirements.txt`) so that Railpack's auto-detector can find Python dependencies. The actual packages live in `backend/requirements.txt`; the root file just points to it. You never need to move files.

### 3c — Set the build command

The build command runs once when Railway installs your app. It installs all Python dependencies.

1. Still in **Settings**, find **"Build Command"**
2. Enter exactly:
   ```
   pip install uv && uv pip install --system -r backend/requirements.txt
   ```
   - `pip install uv` installs the `uv` package manager (it is faster than plain pip)
   - `uv pip install --system -r backend/requirements.txt` installs all your Python libraries into the system Python (Railway requires `--system` since there is no virtualenv in the build container)

   > **Tip:** If Railway auto-detected the build and already filled in a build command, replace it with the line above.

### 3d — Set the start command

The start command is what Railway runs to actually start your server. It runs every time the service starts or re-deploys.

1. Still in **Settings**, find **"Start Command"**
2. Enter exactly:
   ```
   uv run alembic upgrade head && uv run uvicorn backend.api.app:app --host 0.0.0.0 --port $PORT
   ```

   Breaking this down:
   - `uv run alembic upgrade head` — runs database migrations first. This creates your tables (users, runs, outputs, etc.) if they do not exist, or applies any new changes if they do. Safe to run every deploy.
   - `&&` — only continue if the migrations succeeded
   - `uv run uvicorn backend.api.app:app` — starts the FastAPI server
   - `--host 0.0.0.0` — makes the server accept connections from outside (required on Railway — `127.0.0.1` would only accept local connections)
   - `--port $PORT` — Railway assigns a port number automatically and puts it in `$PORT`. Do not hardcode `8000` here.

---

## Step 4 — Set environment variables for the backend

Environment variables are secret configuration values that your app reads at runtime. They are never stored in your code (especially secrets like API keys). Railway has a "Variables" tab for each service where you set them.

1. Click your backend service box
2. Click the **"Variables"** tab
3. Add the following variables one by one using the **"+ New Variable"** button:

### Required variables

**`OPENROUTER_API_KEY`**
- Value: your OpenRouter API key (starts with `sk-or-...`)
- Why: without this the LLM calls fail. Every debate session calls OpenRouter.

**`OPENROUTER_BASE_URL`**
- Value: `https://openrouter.ai/api/v1`
- Why: tells the backend where to send LLM requests. This is the OpenRouter API endpoint.

**`JWT_SECRET`**
- Value: a long random string — you need to generate one. Use this command on your local machine:
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
  Copy the output (it will look like `a3f92bc1d...`). Paste it as the value.
- Why: this secret is used to sign login tokens. If someone knows it, they can forge login credentials. Never use the default `"change-me-in-production"`.
- Important: once set, **never change this value** — if you change it, all logged-in users get logged out immediately because their old tokens become invalid.

**`DATABASE_URL`**
- **Do not add this manually.** Railway automatically injects it from the PostgreSQL plugin you added in Step 2. Just confirm it is there: look in the Variables tab for a variable named `DATABASE_URL` — it should already be present. If it is missing, see the "Common issues" section at the bottom.

### After adding variables

Click **"Deploy"** (or it may deploy automatically). Watch the **"Deployments"** tab — click the latest deployment to see the build logs.

A successful deploy ends with logs showing something like:
```
Applied migration 31b7529ae8f0 (initial)
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:XXXX
```

---

## Step 5 — Get your backend URL

Once the backend is deployed, Railway gives it a public URL.

1. Click your backend service box
2. Click the **"Settings"** tab
3. Scroll down to **"Networking"** → **"Public Networking"**
4. Click **"Generate Domain"** if no domain is shown yet
5. Copy the URL — it will look like `https://multiai-backend-production.up.railway.app`

**Test it:** Open a browser and go to `https://YOUR-BACKEND-URL/api/health`. You should see:
```json
{"status": "ok"}
```
If you see that, the backend is running correctly.

---

## Step 6 — One code change before deploying the frontend

Right now the frontend is hardcoded to call `http://localhost:8000` for the backend. In production it needs to call the Railway backend URL instead. This is a one-line change.

Open [frontend/src/services/api.ts](../../frontend/src/services/api.ts) and find the line that sets the API base URL. Change it to read from an environment variable:

```ts
// Change this line:
const API_BASE = "http://localhost:8000";

// To this:
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
```

`import.meta.env.VITE_API_BASE_URL` is how Vite (the frontend build tool) reads environment variables at build time. The `?? "http://localhost:8000"` part means "if the variable is not set, fall back to localhost" — so local development still works without any changes.

**Commit and push this change to GitHub before continuing.**

---

## Step 7 — Add the frontend service

The frontend is a React app. Railway builds it into static HTML/CSS/JS files and then serves them to users' browsers.

### 7a — Connect the repo (again, as a second service)

1. Click **"+ New"** in your Railway project
2. Choose **"GitHub Repo"**
3. Select **"MultiAi"** again — yes, the same repo as the backend. Railway will create a second, separate service from the same codebase.

### 7b — Set the root directory to `frontend`

This is the most important setting for the frontend service. It tells Railway to only look inside the `frontend/` folder.

1. Click the new service box
2. Go to **"Settings"**
3. Find **"Root Directory"** — type `frontend`
   - This means Railway will run all commands from inside the `frontend/` folder, so `npm install` will find `package.json` correctly.

### 7c — Set build and start commands

**Build Command:**
```
npm install && npm run build
```
- `npm install` — installs all JavaScript packages (React, Vite, etc.)
- `npm run build` — runs Vite which compiles your TypeScript/React code into static HTML/CSS/JS files and puts them in a folder called `dist/`

**Start Command:**
```
npx serve dist -l $PORT
```
- `serve` is a simple static file server — it just sends files from the `dist/` folder to browsers
- `-l $PORT` — listens on the port Railway assigns

### 7d — Set environment variables for the frontend

1. Click the frontend service box → **"Variables"** tab
2. Add one variable:

**`VITE_API_BASE_URL`**
- Value: the backend URL you got in Step 5 — e.g. `https://multiai-backend-production.up.railway.app`
- **No trailing slash**
- Why: this gets baked into the frontend at build time so all API calls go to your live backend instead of localhost.

After adding the variable, click **"Deploy"** (or redeploy if it already tried to build).

---

## Step 8 — Get your frontend URL and test everything

1. Click the frontend service box → **"Settings"** → **"Networking"** → **"Generate Domain"**
2. Copy the frontend URL — e.g. `https://multiai-frontend-production.up.railway.app`
3. Open it in a browser

**What you should see:** The MultiAi login page.

**Full test checklist:**
- [ ] The login page loads
- [ ] Register a new account (click Register, enter email + password)
- [ ] You are redirected into the app and the sidebar is empty (no sessions yet)
- [ ] Ask a question — the debate runs and a result appears
- [ ] Refresh the page — you are still logged in and the session appears in the sidebar
- [ ] Log out and log back in — the session is still there (confirms DB persistence works)

---

## Step 9 — Rename your services (optional but helpful)

By default Railway names services after your repo with random suffixes. You can rename them:

1. Click a service box
2. Click the pencil icon next to the service name at the top
3. Rename to `backend` and `frontend` respectively

---

## Step 10 — Set up automatic deploys

Railway deploys automatically every time you push to your GitHub repo's `main` branch by default. You can configure which branch triggers a deploy:

1. Click a service → **"Settings"** → **"Source"**
2. Confirm **"Branch"** is set to `main` (or whichever branch you want to deploy from)

From now on: `git push origin main` → Railway rebuilds and redeploys automatically.

---

## How to see logs and debug problems

**Build logs:** Click a service box → **"Deployments"** tab → click the latest deployment. You see the full output of the build and start commands. This is where you look first when something goes wrong.

**Runtime logs:** Click a service box → **"Logs"** tab. This shows what the running server is printing (FastAPI request logs, errors, etc.). Useful after the app is running.

---

## Common problems and fixes

### Railpack says "no requirements.txt found" / detects the wrong language
**What it means:** Railpack (Railway's build detector) scanned the repo root and did not find a Python project.  
**Fix:** Make sure `requirements.txt` exists at the repo root (one line: `-r backend/requirements.txt`). Commit and push it — it is already present in this repo. Then trigger a new deploy. The root file is just a pointer; all actual packages stay in `backend/requirements.txt`.

### "asyncpg.exceptions.InvalidCatalogNameError"
**What it means:** The backend cannot connect to the database.  
**Fix:** Go to backend service → Variables. Check if `DATABASE_URL` is present. If it is missing: click the PostgreSQL plugin in your project → "Connect" tab → copy the `DATABASE_URL` value → paste it into the backend service Variables manually.

### "ModuleNotFoundError: No module named 'backend'"
**What it means:** The Python server is starting from the wrong folder.  
**Fix:** Go to backend service → Settings → Root Directory. Make sure it is `/` or empty (not set to `backend`).

### Frontend shows "Network Error" or the debate never starts
**What it means:** The frontend cannot reach the backend.  
**Fix:** Go to frontend service → Variables. Check that `VITE_API_BASE_URL` is set to your exact backend URL (no trailing slash). Then go to **Deployments** and click "Redeploy" — the variable gets baked in at build time so you need a fresh build after changing it.

### Auth returns 401 / login fails after a redeploy
**What it means:** The `JWT_SECRET` changed between deploys, invalidating all tokens.  
**Fix:** Make sure `JWT_SECRET` is set as a permanent Railway variable (not left as the code default `"change-me-in-production"`). Set it once and never change it.

### "alembic upgrade head" fails in the build log
**What it means:** Database migration failed — likely `DATABASE_URL` is not set yet.  
**Fix:** Confirm `DATABASE_URL` is in the backend service Variables (see above), then trigger a new deploy.

### Frontend deployed but login redirects to localhost
**What it means:** `VITE_API_BASE_URL` was not set when the frontend was built.  
**Fix:** Add the variable, then click **"Redeploy"** in the frontend service Deployments tab.

---

## Updating the app after making code changes

Normal workflow once deployed:

1. Make changes locally and test with `npm run dev` / `uvicorn ... --reload`
2. `git add` + `git commit` + `git push origin main`
3. Railway detects the push and automatically rebuilds both services
4. Watch the Deployments tab to confirm success

If you changed a database model (`db_models.py`), run this locally first to generate the migration:
```bash
uv run alembic revision --autogenerate -m "describe what changed"
```
Then commit the generated file in `alembic/versions/` along with your code change. The deploy command (`alembic upgrade head`) will apply it automatically.
