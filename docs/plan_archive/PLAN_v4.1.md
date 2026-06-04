# Version 4.1 — Backend Persistence & Authentication

**Scope:** Replace JSON file storage with a real database. Add user accounts.  
**Depends on:** v4.0 complete (routing must exist before per-user session URLs work)  
**Next:** v4.2 (public sharing + export)

---

## Out of scope for v4.1

* Public sharing, shareable slugs → **v4.2**
* SEO pages, Next.js → **v5.0**

---

## Phase 3 — Backend Persistence

**Goal:** Make runs durable in a real database so sessions survive server restarts, are per-user, and can later be made public.

### Database schema

#### Runs
Stores one question/mission session.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → Users |
| `title` | string | Short auto-generated title |
| `prompt` | text | Original question |
| `status` | enum | `running`, `done`, `error` |
| `visibility` | enum | `private`, `public` |
| `public_slug` | string? | Nullable — set when made public |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

#### TeamConfigs
Stores the team setup used for a run.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | |
| `run_id` | UUID | FK → Runs |
| `members_json` | JSON | Array of team members |

#### Outputs
Stores the generated result for a run.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | |
| `run_id` | UUID | FK → Runs |
| `final_answer_markdown` | text | |
| `debate_logs_json` | JSON | All rounds |
| `score` | float | Consensus score |
| `tokens` | int | Total tokens used |
| `cost` | float | Total cost |

#### Files
Stores metadata for uploaded context files.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | |
| `run_id` | UUID | FK → Runs |
| `user_id` | UUID | FK → Users |
| `filename` | string | |
| `storage_url` | string | |
| `mime_type` | string | |

### API routes

| Method | Route | Action |
|--------|-------|--------|
| `POST` | `/api/runs` | Create a new run |
| `GET` | `/api/runs` | List runs for sidebar |
| `GET` | `/api/runs/:id` | Fetch a full run |
| `DELETE` | `/api/runs/:id` | Delete a run |
| `POST` | `/api/files/upload` | Upload a context file |
| `DELETE` | `/api/files/:id` | Delete a file |

### Subtasks

**1. Choose and set up the database**
- [ ] Decide on DB — SQLite for local dev / Postgres for Railway deploy (recommendation: Postgres via SQLAlchemy)
- [ ] Add `sqlalchemy`, `alembic` to `backend/requirements.txt`
- [ ] Create initial migration with the 4 tables above

**2. Backend — replace JSON session store**
- [ ] New module `backend/storage/db_session_store.py` — replaces `session_store.py` functions with DB equivalents
- [ ] `backend/api/sessions.py` — swap calls from file store to DB store
- [ ] Keep the old JSON store path as a one-time import utility (migrate existing sessions on first boot)

**3. Backend — new run API**
- [ ] `POST /api/runs` — create run record when debate starts
- [ ] `GET /api/runs` — return list for sidebar (id, title, created_at)
- [ ] `GET /api/runs/:id` — return full run with outputs
- [ ] `DELETE /api/runs/:id` — delete run and associated outputs

**4. Frontend — fetch sidebar from backend**
- [ ] `useSessionHistory` hook — replace local JSON load with `GET /api/runs`
- [ ] Session list items come from backend; no local file reads

**5. Frontend — load full run by ID**
- [ ] When navigating to `/app/run/:id` — fetch `GET /api/runs/:id` if not already cached
- [ ] Cache result in `resultsById` as today

---

## Phase 3b — Authentication

**Goal:** Gate the app behind a login so sessions are per-user.  
**Provider decision required before starting** — options: Supabase Auth or Clerk (both JWT-based, no extra DB needed for session storage).

### Subtasks

**1. Choose auth provider**
- [ ] Decide: Supabase Auth vs Clerk
- [ ] Supabase: free tier, self-hostable, Postgres already included — good fit if using Supabase DB
- [ ] Clerk: better DX, faster to integrate, but separate service

**2. Backend — auth middleware**
- [ ] Add JWT verification middleware to FastAPI
- [ ] All `/api/runs/*` routes require a valid token
- [ ] Extract `user_id` from token and scope all queries to that user

**3. Frontend — login flow**
- [ ] Add login / signup screen (or modal)
- [ ] Store JWT in memory (not localStorage) for security
- [ ] Attach token to all API requests
- [ ] Redirect unauthenticated users to login

**4. Per-user sessions**
- [ ] Session storage path / DB queries scoped by `user_id`
- [ ] Sidebar only shows runs belonging to the logged-in user
