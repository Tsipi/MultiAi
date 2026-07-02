# Version 5.1 - Auth And Settings Polish

**Scope:** Fix issues and complete actionable deferred items from v5.0.  
**Status:** Complete  
**Depends on:** v5.0 complete

---

## Phase 5.1.0 - Login Fixes

- [X] Display Name saved in Settings is now used as the greetingName in the compose bar
- [X] Add TeamStoaIcon component and update branding across pages

---

## Phase 5.1.1 - Settings Polish

- [X] Add a password visibility toggle (eye icon) on all password inputs — Settings and Login pages
- [X] Settings page renders inside the main app shell (sidebar + TopNav stay visible) instead of replacing the whole screen
- [X] Document admin / regular user / public-viewer permission matrix as a short `.md` file (`docs/engineering/permissions.md`)

---

## Phase 5.1.2 - Regular User Settings

- [X] Add default run preferences: answer mode, web research mode, default team template — stored on the user record, applied when the compose form initializes
- [X] Add data and privacy controls: "Export my data" (download sessions as JSON) and "Delete my account" (permanent, with confirmation)

---

## Phase 5.1.3 - Admin Improvements

- [X] Admin can trigger a password-reset email for any user (button in the user list → calls existing `UserManager.forgot_password()` flow; admin never sees the token)
- [X] Admin can browse any user's sessions from the admin panel (read-only)

---

## Phase 5.1.4 - API Hardening And Tests

- [X] Add rate limiting on auth endpoints (`/auth/login`, `/auth/register`, `/auth/forgot-password`) — `slowapi` added to `requirements.txt`
- [ ] Add automated tests covering: auth state, user session scoping, admin-only behavior, and quota enforcement — deferred pending user approval


