# Version 5.2 - Deferred Auth And Account Features

**Scope:** Items moved from v5.1 that are blocked by missing infrastructure, high implementation effort, or not yet needed.  
**Status:** TODO — do not implement until explicitly approved.  
**Depends on:** v5.1 complete

---

## Phase 5.2.1 - Google OAuth

**Blocked until:** Production domain is set and a Google Cloud Console OAuth client is created with the correct callback URL.

- [ ] Add Google OAuth social login — fastapi-users supports it via `httpx-oauth`; requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars and an authorized redirect URI in Google Console
- [ ] Add Google account connection/disconnection in Settings — links or unlinks a Google identity to an existing email/password account

---

## Phase 5.2.2 - Notification Preferences

**Blocked until:** A notification delivery system (email digests, push, or in-app) is designed and built.

- [ ] Add notification preferences UI in Settings — no-op until a notification system exists to back it

---

## Phase 5.2.3 - Impersonate / View As

**Deferred:** High implementation effort and security-sensitive. Needs careful design (audit log, session isolation, clear UI indicator that you are impersonating).

- [ ] Admin can temporarily act as another user and view their sessions — requires a separate impersonation token flow, not a simple role switch
