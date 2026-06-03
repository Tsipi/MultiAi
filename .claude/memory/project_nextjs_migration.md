---
name: project-nextjs-migration
description: Frontend is currently Vite + React but planned migration to Next.js in the future
metadata:
  type: project
---

The frontend (currently Vite + React SPA) is planned to be migrated to Next.js at some point.

**Why:** User mentioned this as a likely future direction; no specific timeline given.

**How to apply:** When writing new frontend code, avoid patterns that are hard to port to Next.js:
- Don't rely on Vite-specific APIs (`import.meta.env` is fine — Next.js has env too, but keep usage minimal)
- Keep routing logic thin and centralised (currently React Router v6 in App.tsx) — don't scatter `useNavigate`/`useParams` deep into components
- Avoid browser-only code at the top level of components (wrap in `useEffect` or check `typeof window`) so components can be server-rendered later
- `vite-env.d.ts` (`/// <reference types="vite/client" />`) will need to be replaced with `next-env.d.ts` on migration
- CSS approach (`@import "tailwindcss"` in index.css, imported in main.tsx) maps cleanly to Next.js `globals.css` in `_app.tsx` or `layout.tsx`
