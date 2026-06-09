# Backend Stack — What It Is and Why We Use It

This document explains the four core libraries that power MultiAi's persistence and authentication layer.

---

## The big picture

Before v4.1, every debate session was saved as a JSON file in a `sessions/` folder. That is fine for a single developer on a laptop, but it breaks the moment two things are true:

1. The app runs in the cloud (Railway containers are ephemeral — files disappear on every deploy)
2. More than one user exists (file names cannot enforce that User A cannot read User B's sessions)

The four libraries below solve those two problems together.

---

## 1. SQLAlchemy

**What it is:** The standard Python toolkit for talking to relational databases (PostgreSQL, SQLite, MySQL, etc.). It has two layers:

- **Core** — builds and executes SQL (`SELECT`, `INSERT`, etc.) in Python
- **ORM** (Object-Relational Mapper) — lets you write Python classes that map directly to database tables so you never write raw SQL

MultiAi uses the **async ORM** (`sqlalchemy[asyncio]`), which is required because FastAPI is async and blocking the event loop on a database query would freeze the server.

**How it is used in this app:**

`backend/storage/db_models.py` defines five Python classes. Each class becomes a database table:

```python
class Run(Base):
    __tablename__ = "runs"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    prompt: Mapped[str] = mapped_column(Text, default="")
    # ... more columns
```

When you call `await save_session(session, db)` in `db_session_store.py`, SQLAlchemy translates that into `INSERT INTO runs ...` automatically — no SQL written by hand.

**Why it matters:**

- Sessions survive container restarts and re-deploys (they are in PostgreSQL, not on disk)
- You can query and filter sessions (e.g. "all runs for this user, newest first") without writing SQL
- One Python model definition is the single source of truth — no separate SQL schema files to keep in sync (Alembic handles that — see below)

---

## 2. Alembic

**What it is:** A database migration tool built for SQLAlchemy. A "migration" is a versioned script that describes how to change the database schema — adding a column, renaming a table, adding an index, etc.

**The problem it solves:** Your Python models in `db_models.py` and the actual tables in PostgreSQL can get out of sync. If you add a column in Python but forget to run `ALTER TABLE` in production, the app crashes. Alembic tracks which migrations have been applied and applies the missing ones in order.

**How it is used in this app:**

```
alembic/
  versions/
    31b7529ae8f0_initial.py          ← creates all 5 tables
    305e347906e1_make_user_id_nullable.py  ← makes runs.user_id optional
```

Each file has an `upgrade()` and `downgrade()` function. To create a new migration after changing a model:

```bash
uv run alembic revision --autogenerate -m "add public_slug to runs"
```

Alembic compares your Python models to the live database, detects the difference, and generates the SQL for you. You review it, commit it, and the deploy command `alembic upgrade head` applies it to production automatically.

**Why it matters:**

- Schema changes are version-controlled alongside the code that uses them
- You never have to remember to manually run `ALTER TABLE` in production
- You can roll back a bad migration with `alembic downgrade -1`
- The Railway deploy command is simply `alembic upgrade head && uvicorn ...` — zero manual steps

---

## 3. FastAPI-Users

**What it is:** A library that adds a complete authentication system to FastAPI in about 30 lines of configuration. It handles:

- User registration (email + password)
- Login → returns a JWT token
- `GET /users/me` — returns the currently logged-in user
- Password hashing (uses bcrypt — see below)
- Token validation on every protected route

**How it is used in this app:**

`backend/api/auth.py` configures the library. Three router groups are registered in `app.py`:

| Route | What it does |
|---|---|
| `POST /api/auth/register` | Create a new account |
| `POST /api/auth/login` | Returns a JWT Bearer token |
| `POST /api/auth/logout` | Invalidates the token |
| `GET /api/users/me` | Returns the logged-in user's info |

The debate routes use a dependency called `optional_current_user`:

```python
@app.post("/api/consult-stream")
async def consult_stream(
    payload: ConsultRequest,
    user: User | None = Depends(optional_current_user),
):
```

`optional_current_user` reads the `Authorization: Bearer <token>` header. If there is a valid token it sets `user` to the logged-in `User` object. If there is no token it sets `user = None` (the session is saved as anonymous). This means the app works both for logged-in and anonymous users without two separate code paths.

**Why it matters:**

- Without it you would need to write registration, login, password hashing, JWT generation, JWT validation, and session middleware yourself — roughly 400+ lines of security-critical code
- It follows OWASP best practices by default (no plain-text passwords, short token lifetimes, email uniqueness enforced)
- The frontend stores the token in `sessionStorage` and sends it with every request via `apiFetch` in `api.ts` — users see only their own sessions

---

## 4. Bcrypt

**What it is:** A password hashing algorithm designed to be deliberately slow. When a user registers, bcrypt transforms their password into a one-way hash that is stored in the `users.hashed_password` column. The original password is never stored.

**How passwords work:**

```
Registration:  "mypassword123" → bcrypt → "$2b$12$Xy..." (stored in DB)
Login:         "mypassword123" → bcrypt → compare with stored hash → ✓ match
```

Even if an attacker steals the database, the hashes are useless — bcrypt is intentionally slow (takes ~100ms to compute), making brute-force cracking impractical.

**How it is used in this app:**

Bcrypt is used internally by FastAPI-Users — you do not call it directly. It is listed in `requirements.txt` as a dependency that FastAPI-Users needs at runtime:

```
fastapi-users[sqlalchemy]
bcrypt
```

**Why it matters:**

- This is a non-negotiable security requirement for any app that stores passwords
- If `bcrypt` is missing, the app raises an error on startup
- FastAPI-Users will refuse to store a plain-text password — it always hashes first

---

## How the four libraries work together

Here is the full path of a user saving a debate session:

```
1. User logs in
   POST /api/auth/login  →  FastAPI-Users validates email+password
                         →  bcrypt compares "mypassword" against stored hash
                         →  returns JWT token

2. Frontend stores token in sessionStorage

3. User runs a debate
   POST /api/consult-stream  →  optional_current_user reads Bearer token
                             →  FastAPI-Users validates JWT, returns User object
                             →  ConsensusEngine runs debate
                             →  save_session(session, db, user_id=user.id)
                             →  SQLAlchemy writes Run + Output + TeamConfig rows
                             →  Alembic had already ensured those tables exist

4. User refreshes the page
   GET /api/sessions  →  list_sessions(db, user_id=user.id)
                      →  SQLAlchemy SELECT WHERE user_id = ?
                      →  returns only that user's sessions
```

---

## Quick reference

| Library | Package name | Used in |
|---|---|---|
| SQLAlchemy | `sqlalchemy[asyncio]` | `backend/storage/database.py`, `db_models.py`, `db_session_store.py` |
| Alembic | `alembic` | `alembic/` folder, deploy command |
| FastAPI-Users | `fastapi-users[sqlalchemy]` | `backend/api/auth.py`, `app.py` |
| Bcrypt | `bcrypt` | Used internally by FastAPI-Users |
