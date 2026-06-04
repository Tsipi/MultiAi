# Codex Next-Step Plan

## Summary

This is a recommendation document only. It does not implement database, authentication, routing, or product changes.

After reviewing the README, docs, and current project structure, my recommendation is to move MultiAI forward in this order:

1. Stabilize the current app and documentation.
2. Add database infrastructure.
3. Add login/authentication and user isolation.
4. Add higher-level SaaS features such as saved templates, public sharing, and SEO pages.

The important sequencing point: do not start with login screens alone. Authentication becomes useful only when runs, sessions, files, and user-owned history have a durable persistence model underneath them.

## Current State

MultiAI is already a strong local prototype:

- React + TypeScript + Vite frontend.
- FastAPI backend.
- OpenRouter-powered multi-agent debate loop.
- Writer/Critic team configuration.
- Attachments and follow-up sessions.
- Session history saved as JSON files in `sessions/`.
- Usage, token, cost, and debate insight surfaces.

The main architectural limit is that the app is still local-first:

- No real database.
- No login/authentication.
- No user ownership model.
- Session IDs are timestamp-based JSON filenames.
- CORS is permissive for local development.
- Frontend API base URL is hardcoded to localhost.

## Recommended Next Work

### 1. Stabilize Docs And Current App

Before adding infrastructure, align the docs with the current reality.

- Update README and engineering docs so they clearly say JSON storage is the current implementation, while database/auth are the next infrastructure step.
- Keep the current JSON session behavior working during the transition.
- Document local setup consistently.
- Add notes for known verification blockers if they happen locally, such as Python policy restrictions or frontend build access issues.

### 2. Add A Storage Boundary

Before adding Postgres directly into API routes, introduce a clean storage abstraction.

Recommended shape:

- Keep the current JSON implementation as the first storage backend.
- Add a database-backed implementation behind the same interface.
- Make API and engine code call storage functions through that boundary instead of directly depending on JSON files.

This lowers the risk of the database migration and keeps existing sessions usable.

### 3. Add Database Infrastructure

After the storage boundary exists, add a real database.

Recommended production target:

- Railway Postgres.

Recommended backend tools:

- SQLAlchemy 2.x.
- Alembic migrations.
- `DATABASE_URL` environment variable.

Recommended first tables:

- `users`: account records, initially minimal.
- `runs`: one user prompt/session.
- `run_rounds`: debate rounds and scores.
- `run_usage`: model token and cost records.
- `run_attachments`: attachment metadata.

Start simple. It is fine to store some debate payloads as JSON/text fields first rather than over-normalizing everything immediately.

### 4. Add Login/Auth And User Isolation

Add auth after durable persistence is in place.

The first auth milestone should protect private data:

- Users can sign in.
- Runs belong to a user.
- Users can only list, load, and delete their own runs.
- Anonymous access is either disabled or limited to a temporary local/demo mode.
- CORS origins are configured explicitly instead of using wildcard production behavior.

Auth should be treated as infrastructure, not just UI.

### 5. Add SaaS Features After Auth

Once database and user ownership are stable, the next useful product features are:

- Saved team templates.
- User-created templates.
- Public sharing for selected runs.
- Public read-only pages for shared answers.
- SEO pages for templates and use cases.

These should come after private user isolation is working, because sharing and SEO depend on knowing what is private and what is intentionally public.

## Suggested Config Additions

```env
DATABASE_URL=
CORS_ORIGINS=http://localhost:5173
AUTH_SECRET=
AUTH_COOKIE_NAME=multiai_session
VITE_API_BASE_URL=http://localhost:8000
```

The frontend should eventually use `VITE_API_BASE_URL` instead of hardcoding `http://localhost:8000`.

## Suggested Verification

For this document-only task:

- Confirm `docs/codex/Codex_Plan.md` exists.
- Confirm the markdown is readable.

For future implementation work:

- Run backend tests with `uv run pytest tests`.
- Run frontend build with `npm.cmd run build` on Windows if PowerShell blocks `npm.ps1`.
- Add database storage tests before replacing JSON behavior.
- Add auth tests for owned and forbidden session access.

## Final Recommendation

The best next move is not to choose between database and auth as separate features. The correct sequence is:

1. Clean up docs and stabilize the current app.
2. Add the database foundation.
3. Add auth on top of that foundation.
4. Then build templates, sharing, and public growth features.

That path protects the working prototype while moving it toward a real multi-user SaaS product.
