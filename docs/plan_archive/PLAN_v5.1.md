# Version 5.1 - Fixing - New Login, Auth, Admin, And User Settings

**Scope:** Fix some issues and complete Version 5.0 uncompleted itmes 
**Status:** TODO  
**Depends on:** Existing v5.0

---
## Phase 5.1.0 - Login Fixes

- [ ] When user set a Display Name on the Setting page - it should be visible as the greetingName
- [X] add TeamStoaIcon component and update branding in multiple pages


---

## Phase 5.1.1 - deffered item from Auth Audit And Role Model

- [ ] Document admin, regular user, and public/shared-viewer permission matrix — decisions are in code; formal doc deferred
- [ ] add avisibility icon or an Eye to view/hide the passwords inside input on the Setting page
- [ ] setting page should be visible in the main content area and replace the whole main section.

---

## Phase 5.1.2 - deffered item from TeamStoa Rebrand And Login/Registration UX

- [ ] Add Google OAuth (social login) — deferred; fastapi-users supports it but requires Google Console credentials
---

## Phase 5.1.3 - deffered item from Regular User Settings

- [ ] Add Google account connection/disconnection — deferred (no OAuth yet)
- [ ] Add default run preferences: answer mode, web research mode, default team template — deferred to v5.1
- [ ] Add data and privacy controls: "Export my data", "Delete my account" — deferred to v5.1
- [ ] Add notification preferences — deferred (no email notifications yet)

---

## Phase 5.1.4 - deffered item from Admin Area

- [ ] Reset password link for a user from admin — deferred
- [ ] Add an "impersonate / view as" capability — deferred (complex, security-sensitive)
- [ ] Add run/session visibility for admins — deferred

---

## Phase 5.1.6 - deffered item from Permissions And API Hardening

- [ ] Add rate limiting at the API level for auth endpoints — deferred; needs `slowapi` added to requirements
- [ ] Add tests for auth/admin/quota/scoping — deferred to v5.1


## Phase 5.2.0 - deffered item Acceptance Criteria

- [ ] Tests cover auth state, user scoping, admin-only behavior, and quota enforcement. 
