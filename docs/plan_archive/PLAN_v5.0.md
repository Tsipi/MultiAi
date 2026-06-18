# Version 5.0 - New Login, Auth, Admin, And User Settings

**Scope:** Upgrade the account experience after the current fastapi-users foundation: login polish, stronger auth flows, admin capabilities, and regular user settings.  
**Status:** Planning only. Do not implement until explicitly approved.  
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

- [ ] Audit current login, registration, JWT, logout, and `/api/users/me` behavior
- [ ] Confirm whether `is_superuser` is enough for admin access or whether explicit roles are needed
- [ ] Verify all session routes are correctly scoped by logged-in user (no data leakage between users)
- [ ] Decide whether anonymous/unauthenticated sessions are still allowed after launch
- [ ] Document admin, regular user, and public/shared-viewer permission matrix
- [ ] Identify what token lifetimes are currently set and whether they are appropriate for a public product
- [ ] Decide on email verification requirement: required-to-run vs optional vs deferred

---

## Phase 5.0.2 - TeamStoa Rebrand And Login/Registration UX

**Goal:** Make the entry flow feel polished and on-brand, and production-ready for public launch.

### Tasks

- [ ] Replace all "MultiAi" text in login, registration, and account-related UI with "TeamStoa"
- [ ] Update page titles, browser tab titles, and any auth-related email templates to use "TeamStoa"
- [ ] Redesign login/register screens with TeamStoa visual identity: clear branding, loading states, inline field errors, and success transitions
- [ ] Add password reset: forgot-password email flow, reset token, new-password form
- [ ] Add email verification if required: send verification on registration, block login or gate features until verified
- [ ] Improve token expiry handling: clear expired-session messaging, automatic redirect to login, preserve intended destination after re-login
- [ ] Add Google OAuth (social login) — dramatically reduces registration friction for the target audience; the fastapi-users library supports OAuth backends
- [ ] Make all auth screens fully mobile-safe (keyboard-safe inputs, correct viewport meta, safe-area insets, visible CTAs above fold)
- [ ] Add clear loading and error states for every auth action (submit spinner, server error message, network error message)

---

## Phase 5.0.3 - Regular User Settings

**Goal:** Give users a place to manage their account, personal defaults, and usage.

### Tasks

- [ ] Add a user settings page or drawer (accessible from the top nav or bottom nav on mobile)
- [ ] Show account identity: name, email, avatar/initials, registration date
- [ ] Add password change form (separate from forgot-password flow)
- [ ] Add Google account connection/disconnection if OAuth is added in 5.0.2
- [ ] Add default run preferences: answer mode, web research mode, default team template
- [ ] Show usage summary: runs this month, total runs, sessions saved — useful context before billing is introduced
- [ ] Add data and privacy controls: "Export my data" (sessions as JSON/PDF), "Delete my account" (with confirmation and data deletion)
- [ ] Add notification preferences if email notifications are introduced (completed run summary, weekly digest)

---

## Phase 5.0.4 - Admin Area

**Goal:** Give admins controlled visibility and safe management tools for the growing user base.

### Tasks

- [ ] Add admin-only routing with a distinct `/admin` prefix, guarded in both frontend and backend
- [ ] Add user list with search by email/name and filter by date joined, active/inactive, verified/unverified
- [ ] Add user detail view: account info, registration date, email verification status, recent session count
- [ ] Add basic usage analytics per user: total runs, last active, models used — to identify power users and churned accounts
- [ ] Add safe admin actions with explicit confirmations: disable account, re-send verification email, reset password link
- [ ] Add an "impersonate / view as" capability (read-only) so admins can debug user-reported issues without exposing credentials
- [ ] Add run/session visibility appropriate for admins: ability to view any session for support purposes, with audit trail

---

## Phase 5.0.5 - Usage Quotas And Billing Preparation

**Goal:** Lay the groundwork for a free/paid tier before the full billing integration (which belongs in a later version).

### Tasks

- [ ] Define the free-tier run quota (e.g., 20 runs/month per user) and where it is enforced (backend)
- [ ] Add a `usage` field to user records: runs this calendar month, reset date
- [ ] Return quota info in `/api/users/me` response so the frontend can show "X of 20 runs used this month"
- [ ] Return a clear 429 / quota-exceeded response with a user-friendly message and upgrade CTA when quota is hit
- [ ] Add a quota display to the compose area and user settings page
- [ ] Mark the Stripe billing integration as a future phase (v8.0 or later) — this phase only puts the data model in place

---

## Phase 5.0.6 - Permissions And API Hardening

**Goal:** Ensure frontend affordances and backend authorization agree, and the API is safe for real users.

### Tasks

- [ ] Add backend admin dependencies/guards for every `/admin/*` route — never trust frontend-only role checks
- [ ] Return consistent 401 (unauthenticated) and 403 (unauthorized) errors with clear frontend messages
- [ ] Prevent regular users from reading or mutating other users' private sessions — confirm no route gap exists
- [ ] Keep public shared runs accessible without login, but confirm they never expose non-public data
- [ ] Add rate limiting at the API level for auth endpoints (login, register, password-reset) to prevent brute force
- [ ] Add tests for: regular user access, admin access, anonymous access, public shared access, quota enforcement, and privilege escalation attempts

---

## Phase 5.0.7 - Deployment And Operations

**Goal:** Make account management safe, auditable, and maintainable in production on Railway.

### Tasks

- [ ] Document all required Railway environment variables for auth and JWT behavior (JWT secret, token lifetimes, OAuth credentials, email provider)
- [ ] Replace any development admin credentials with a safe production admin creation flow (CLI script or first-run wizard)
- [ ] Add admin action logging for any destructive operations (account deletion, disabling a user) — at minimum log to the standard logger with user ID and timestamp
- [ ] Add idempotent seed scripts for initial setup only (no scripts that accidentally re-seed in production)
- [ ] Update engineering docs and the CLAUDE.md architecture table after implementation

---

## Acceptance Criteria

- Login/register/logout feel polished and on-brand (TeamStoa) on both desktop and mobile.
- Password reset works end-to-end via email.
- Google OAuth sign-in works as an alternative to email/password.
- Expired or invalid tokens redirect cleanly to login with a clear message, not a broken screen.
- Regular users can view and manage their own account, settings, and usage.
- Admin users have a separate, protected surface to manage accounts and debug issues.
- Backend authorization prevents privilege escalation even if frontend routes are bypassed.
- Public shared runs still work without login.
- Free-tier quota is enforced server-side with a clear message when exceeded.
- Tests cover auth state, user scoping, admin-only behavior, and quota enforcement.
