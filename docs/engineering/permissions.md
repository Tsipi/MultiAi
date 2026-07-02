# Permission Matrix

| Action | Admin (`is_superuser`) | Regular user | Public viewer (no login) |
|---|---|---|---|
| Start a run | ✅ (no quota) | ✅ (quota enforced) | ❌ |
| View own sessions | ✅ | ✅ | ❌ |
| View another user's sessions | ✅ (admin panel only) | ❌ | ❌ |
| Delete own sessions | ✅ | ✅ | ❌ |
| Update own profile / password | ✅ | ✅ | ❌ |
| Save run preferences | ✅ | ✅ | ❌ |
| Export own data | ✅ | ✅ | ❌ |
| Delete own account | ✅ | ✅ | ❌ |
| View shared run (`/shared/:slug`) | ✅ | ✅ | ✅ |
| Access `/admin/*` routes | ✅ | ❌ (403) | ❌ (401) |
| List / search all users | ✅ | ❌ | ❌ |
| Disable / enable a user account | ✅ | ❌ | ❌ |
| Send verification email for a user | ✅ | ❌ | ❌ |
| Send password-reset email for a user | ✅ | ❌ | ❌ |

## Key rules

- **Quota:** Free-tier users are limited to `FREE_TIER_QUOTA` runs per calendar month (default 20). Admins are exempt.
- **Session scoping:** All session queries filter by `user_id`. A regular user can never read or mutate another user's session, even if they know the session ID. Shared runs are the only exception — they are readable by anyone via a public slug.
- **Auth endpoints** (`/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`) are rate-limited to 10 POST requests per IP per minute.
- **Admin guard:** `_require_admin` dependency in `backend/api/admin.py` is applied to every `/api/admin/*` route. A non-superuser gets HTTP 403.
- **Unauthenticated access:** A missing or expired JWT token returns HTTP 401 on any protected route. The frontend auto-logs-out on 401 and renders the login page in-place.
