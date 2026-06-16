# Version 6.0 - New Login, Auth, Admin, And User Settings

**Scope:** Upgrade the account experience after the current fastapi-users foundation: login polish, stronger auth flows, admin capabilities, and regular user settings.  
**Status:** Planning only. Do not implement until explicitly approved.  
**Depends on:** Existing v4.1/v4.1.1 auth and persistence work.

---

## Goal

MultiAi already has a basic login/auth foundation. v6.0 should turn that foundation into a product-ready account system with a clear distinction between regular users and admins.

---

## Phase 6.0.1 - Auth Audit And Role Model

**Goal:** Confirm what exists today and define the target account model before changing UI or permissions.

### Tasks

- [ ] Audit current login, registration, JWT, logout, and `/api/users/me` behavior
- [ ] Confirm whether `is_superuser` is enough for admin access or whether explicit roles are needed
- [ ] Verify all session routes are correctly scoped by logged-in user
- [ ] Decide whether anonymous sessions are still allowed
- [ ] Document admin, regular user, and public/shared viewer permissions

---

## Phase 6.0.2 - New Login And Registration UX

**Goal:** Make the entry flow feel polished, reliable, and production-ready.

### Tasks

- [ ] Redesign login/register screens with clear error, loading, and success states
- [ ] Add password reset or define the chosen recovery flow
- [ ] Add email verification if required for production
- [ ] Improve token expiry handling and expired-session messaging
- [ ] Make login/register fully mobile-safe

---

## Phase 6.0.3 - Regular User Settings

**Goal:** Give users a place to manage their account and personal defaults.

### Tasks

- [ ] Add a user settings page or drawer
- [ ] Show account identity and basic profile information
- [ ] Add password change or recovery entry point
- [ ] Add default run preferences where appropriate: answer mode, web research mode, default team/template
- [ ] Add data/privacy controls such as export my data or delete account if in scope

---

## Phase 6.0.4 - Admin Area

**Goal:** Give admins a controlled surface for operational visibility and safe management.

### Tasks

- [ ] Add admin-only routing and navigation
- [ ] Add user list with search/filter
- [ ] Add user detail view with account status and recent usage
- [ ] Add run/session visibility appropriate for admins
- [ ] Add safe admin actions with confirmations and audit-friendly behavior

---

## Phase 6.0.5 - Permissions And API Hardening

**Goal:** Ensure frontend affordances and backend authorization agree.

### Tasks

- [ ] Add backend admin dependencies/guards for every admin route
- [ ] Return consistent 401/403 errors and frontend messages
- [ ] Prevent regular users from reading or mutating other users' private sessions
- [ ] Keep public shared runs accessible without login
- [ ] Add tests for regular user, admin, anonymous, and public shared access

---

## Phase 6.0.6 - Deployment And Operations

**Goal:** Make account management safe in production.

### Tasks

- [ ] Document required Railway variables for auth and JWT behavior
- [ ] Replace development admin credentials with a safe production admin creation flow
- [ ] Add seed/admin scripts only where they are safe and idempotent
- [ ] Add admin action logging if destructive account actions are introduced
- [ ] Update user-facing and engineering docs after implementation

---

## Acceptance Criteria

- Login/register/logout feel polished on desktop and mobile.
- Regular users can manage their own account settings.
- Admin users have a separate, protected admin surface.
- Backend authorization prevents privilege escalation even if frontend routes are bypassed.
- Public shared runs still work without login.
- Tests cover auth state, user scoping, and admin-only behavior.
