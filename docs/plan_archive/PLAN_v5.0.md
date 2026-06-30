# Version 5.0 - New Login, Auth, Admin, And User Settings

**Scope:** Upgrade the account experience after the current fastapi-users foundation: login polish, stronger auth flows, admin capabilities, and regular user settings.  
**Status:** Implemented.  
**Depends on:** Existing v4.1/v4.1.1 auth and persistence work.

---

## Ordering note

**Recommendation: Do v5.0 before v6.0 (Mobile).**

Reasons:
- TeamStoa marketing is starting. Users who sign up need password reset and proper session expiry handling on day one — these are table-stakes for any public SaaS. Mobile polish does not compensate for a broken forgot-password flow.
- The login and register screens will carry the TeamStoa brand for the first time. Redesigning them in v5.0 before v6.0 means the mobile-safe login work is done once, not patched twice.
- The admin area is needed before you onboard real users — you need visibility into who signed up and the ability to manage them.
- Phase 5.0.2 explicitly includes "make login/register fully mobile-safe," so v6.0's login experience depends on v5.0 being done first.


---

## Goal

TeamStoa already has a working login/auth foundation. v5.0 turns that foundation into a product-ready account system with a clear distinction between regular users and admins, a polished auth UX under the TeamStoa brand, and a foundation for a future free/paid tier.

---

## Phase 5.0.1 - Auth Audit And Role Model

**Goal:** Confirm what exists today and define the target account model before changing UI or permissions.

### Tasks

- [X] Audit current login, registration, JWT, logout, and `/api/users/me` behavior
- [X] Confirm whether `is_superuser` is enough for admin access or whether explicit roles are needed — yes, `is_superuser` is sufficient for MVP
- [X] Verify all session routes are correctly scoped by logged-in user (no data leakage between users)
- [X] Decide whether anonymous/unauthenticated sessions are still allowed after launch — no, login required everywhere except `/shared/*`
- [ ] Document admin, regular user, and public/shared-viewer permission matrix — decisions are in code; formal doc deferred
- [X] Identify what token lifetimes are currently set and whether they are appropriate — JWT 30-day lifetime, set in `auth.py`
- [X] Decide on email verification requirement: required-to-run vs optional vs deferred — optional; hooks exist but not enforced at run time

---

## Phase 5.0.2 - TeamStoa Rebrand And Login/Registration UX

**Goal:** Make the entry flow feel polished and on-brand, and production-ready for public launch.

### Tasks

- [X] Replace all "MultiAi" text in login, registration, and account-related UI with "TeamStoa"
- [X] Update page titles, browser tab titles, and any auth-related email templates to use "TeamStoa"
- [X] Redesign login/register screens with TeamStoa visual identity: clear branding, loading states, inline field errors, and success transitions
- [X] Add password reset: forgot-password email flow, reset token, new-password form (`ForgotPasswordPage`, `ResetPasswordPage`, `UserManager` hooks)
- [X] Add email verification if required: send verification on registration — hooks implemented (`on_after_request_verify`), not enforced as gate
- [X] Improve token expiry handling: 401 auto-logouts via `useAuth`; destination preserved by design (LoginPage renders in-place without URL change)
- [ ] Add Google OAuth (social login) — deferred; fastapi-users supports it but requires Google Console credentials
- [X] Make all auth screens fully mobile-safe (responsive layouts, keyboard-safe inputs)
- [X] Add clear loading and error states for every auth action

---

## Phase 5.0.3 - Regular User Settings

**Goal:** Give users a place to manage their account, personal defaults, and usage.

### Tasks

- [X] Add a user settings page accessible from the top nav user menu and sidebar settings button (`SettingsPage.tsx`)
- [X] Show account identity: email, display name, registration date ("Member since")
- [X] Add password change form (separate from forgot-password flow)
- [ ] Add Google account connection/disconnection — deferred (no OAuth yet)
- [ ] Add default run preferences: answer mode, web research mode, default team template — deferred to v5.1
- [X] Show usage summary: runs this month, total all-time runs, quota bar
- [ ] Add data and privacy controls: "Export my data", "Delete my account" — deferred to v5.1
- [ ] Add notification preferences — deferred (no email notifications yet)

---

## Phase 5.0.4 - Admin Area

**Goal:** Give admins controlled visibility and safe management tools for the growing user base.

### Tasks

- [X] Add admin-only routing with a distinct `/admin` prefix, guarded in both frontend (`isAdmin` check) and backend (`_require_admin` dependency)
- [X] Add user list with email search — search by email implemented; filter by date/active/verified deferred
- [X] Add user detail view: email, display name, verification status, total runs, runs this month, registration date shown in list
- [X] Add basic usage analytics per user: total runs (batch-fetched), runs this month — last active and models used deferred
- [X] Add safe admin actions: disable account, enable account, re-send verification email
- [ ] Reset password link for a user from admin — deferred
- [ ] Add an "impersonate / view as" capability — deferred (complex, security-sensitive)
- [ ] Add run/session visibility for admins — deferred

---

## Phase 5.0.5 - Usage Quotas And Billing Preparation

**Goal:** Lay the groundwork for a free/paid tier before the full billing integration (which belongs in a later version).

### Tasks

- [X] Define the free-tier run quota (20 runs/month) enforced backend-side via `CFG.free_tier_quota`
- [X] Add `runs_this_month`, `runs_reset_at`, `created_at` fields to User — Alembic migrations applied
- [X] Return quota info in `/api/me` response: `runs_this_month`, `runs_quota`, `total_runs`, `created_at`
- [X] Return clear 429 with user-friendly message and upgrade CTA when quota is hit (`_check_and_increment_quota`)
- [X] Add quota display to compose area (runs used / quota shown in CommandBar footer) and user settings page (progress bar + all-time total)
- [X] Mark Stripe billing integration as a future phase (v8.0 or later)

---

## Phase 5.0.6 - Permissions And API Hardening

**Goal:** Ensure frontend affordances and backend authorization agree, and the API is safe for real users.

### Tasks

- [X] Add backend admin guards (`_require_admin` dependency) for every `/admin/*` route
- [X] Return consistent 401 (unauthenticated) and 403 (unauthorized) errors
- [X] Prevent regular users from reading or mutating other users' sessions — enforced in `db_session_store` by `user_id` filter
- [X] Keep public shared runs accessible without login (`/shared/*` routes are public)
- [ ] Add rate limiting at the API level for auth endpoints — deferred; needs `slowapi` added to requirements
- [ ] Add tests for auth/admin/quota/scoping — deferred to v5.1

---

## Phase 5.0.7 - Deployment And Operations

**Goal:** Make account management safe, auditable, and maintainable in production on Railway.

### Tasks

- [X] Document required env vars: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `EMAIL_PROVIDER`, `RESEND_API_KEY`, `APP_URL`, `FREE_TIER_QUOTA` — in `config.py`, `seed_admin.py` docstring, and CLAUDE.md
- [X] Replace dev admin credentials with env-var-driven seed script (`ADMIN_EMAIL` / `ADMIN_PASSWORD` required; exits with error if not set)
- [X] Admin action logging: `_log.warning` on disable, `_log.info` on enable and verification resend
- [X] Idempotent seed script — skips existing admin user and already-migrated sessions
- [X] Update CLAUDE.md architecture table — backend and frontend tables updated

---

## Acceptance Criteria

- [X] Login/register/logout feel polished and on-brand (TeamStoa) on both desktop and mobile.
- [X] Password reset works end-to-end via email.
- [ ] Google OAuth sign-in works as an alternative to email/password. *(deferred)*
- [X] Expired or invalid tokens redirect cleanly to login (401 → auto-logout → LoginPage renders in-place).
- [X] Regular users can view and manage their own account, settings, and usage.
- [X] Admin users have a separate, protected surface to manage accounts and debug issues.
- [X] Backend authorization prevents privilege escalation even if frontend routes are bypassed.
- [X] Public shared runs still work without login.
- [X] Free-tier quota is enforced server-side with a clear message when exceeded.
- [ ] Tests cover auth state, user scoping, admin-only behavior, and quota enforcement. *(deferred to v5.1)*
