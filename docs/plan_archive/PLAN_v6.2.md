# Version 6.2 - Pre-Launch Polish: Rebrand, SEO Foundation, Legal Pages, and OG Sharing

**Scope:** Close the remaining gaps from the Marketing rebrand checklist before any public launch.
**Status:** Phases 6.2.1–6.2.6 complete. Phase 6.2.7 (sitemap) deferred. Phase 6.2.8 (email) blocked. Phase 6.2.9 (SPA routing) in progress.
**Depends on:** v6.0 (mobile UX) stable. Domain `teamstoa.com` connected.

---

## Goal

Finish the in-app rebrand and lay the minimal SEO groundwork so that TeamStoa links look correct
when shared on WhatsApp, iMessage, LinkedIn, and Twitter — and so search crawlers see the right signals from day one.

---

## Phase 6.2.1 - PDF Export Rebrand

**Goal:** Remove the last "MultiAi" string visible to users.

### Tasks

- [x] Change PDF export header text from "MultiAi Consensus" to "TeamStoa" (`pdfHeader.ts` line 21)

---

## Phase 6.2.2 - Social Share OG Tags

**Goal:** Make any TeamStoa link show a branded image preview on WhatsApp, iMessage, Slack, LinkedIn, and Twitter.

### Tasks

- [x] Add Open Graph meta tags to `index.html`: `og:type`, `og:site_name`, `og:title`, `og:description`, `og:image`, `og:url`
- [x] Add Twitter Card meta tags: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- [x] Set `og:image` to `https://www.teamstoa.com/MascotTeamStoa.png` (image already in `frontend/public/`)
- [x] Confirm image accessible at production URL and preview visible in WhatsApp

---

## Phase 6.2.3 - SEO Foundation

**Goal:** Give search crawlers correct signals from day one without waiting for the v7.0 Next.js migration.

### Tasks

- [x] Add `robots.txt` to `frontend/public/` — allows all public pages, disallows `/app/` and `/api/`, references future sitemap
- [x] Add `<link rel="canonical" href="https://www.teamstoa.com/" />` to `index.html`

### Not done here (deferred)

- Sitemap XML — deferred to Phase 6.2.6 below; only useful once public pages exist to list
- Per-page canonical URLs for `/shared/:slug` — requires SSR (Next.js), deferred to v7.0.3
- Per-session OG title on shared pages — deferred to v7.0.3

---

## Phase 6.2.4 - Privacy Policy Page — complete

**Goal:** Satisfy legal requirements (GDPR, CCPA) that apply the moment real users sign up.
Required before any public marketing push or paid tier.

### Tasks

- [x] Add `/privacy` route to the React app (`App.tsx` public routes)
- [x] Write Privacy Policy: data collected, Railway/PostgreSQL storage, OpenRouter third-party disclosure, localStorage, no tracking cookies, user deletion rights, contact email
- [x] Link "Privacy" in the registration form consent line (`LoginPage.tsx`)
- [x] Link "Privacy" in each page's header nav and footer
- [ ] Link "Privacy" in the landing page footer (when built)

---

## Phase 6.2.5 - Terms of Service Page — complete

**Goal:** Protect the product legally and set user expectations before any paid tier or Product Hunt launch.

### Tasks

- [x] Add `/terms` route to the React app (`App.tsx` public routes)
- [x] Write Terms of Service: acceptable use, AI accuracy disclaimer, quota limits, account suspension, content ownership, limitation of liability
- [x] Link "Terms" in the registration form: "By creating an account you agree to our Terms of Service and Privacy Policy" (`LoginPage.tsx`)
- [x] Link "Terms" in each page's header nav and footer
- [ ] Link "Terms" in the landing page footer (when built)

---

## Phase 6.2.6 - About Page — complete

**Goal:** Give visitors a trust signal — who built this, why, and how to contact you.

### Tasks

- [x] Add `/about` route to the React app (`App.tsx` public routes)
- [x] Write About page: product origin (the Stoa), how the debate loop works (Writer/Critic/Scorer/Summarizer), team templates explained, contact email
- [x] Link "About" in each page's header nav and footer
- [ ] Link "About" in the landing page footer (when built)

**Note:** Contact email is temporary — update to `hello@teamstoa.com` once teamstoa.com email is configured (see Phase 6.2.8).

---

## Phase 6.2.7 - Sitemap

**Goal:** Help search crawlers discover all public pages once they exist.

### Tasks

- [ ] Create `frontend/public/sitemap.xml` listing: `/`, `/about`, `/privacy`, `/terms`, plus any future `/templates/*` pages
- [ ] Add `<lastmod>` dates and `<changefreq>` hints
- [ ] Submit to Google Search Console after the landing page is live

**Note:** The `robots.txt` already references `https://www.teamstoa.com/sitemap.xml`. Do not create the sitemap until at least the landing page and legal pages exist — an empty or stub sitemap sends a negative signal to crawlers.

---

## Phase 6.2.8 - Production Email (Resend) — blocked

**Goal:** Real transactional emails (password reset, account verification) delivered to users.

**Current state:** `EMAIL_PROVIDER` defaults to `"log"` on Railway — emails print to server log only. Real users cannot reset passwords or verify accounts.

### Tasks

- [ ] Sign up at resend.com
- [ ] Add and verify `teamstoa.com` domain in Resend (choose region: US East)
- [ ] Create API key
- [ ] Set Railway env vars: `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM=TeamStoa <noreply@teamstoa.com>`, `APP_URL=https://www.teamstoa.com`
- [ ] Test password reset and verification emails end-to-end
- [ ] Update contact email in `PrivacyPage.tsx`, `TermsPage.tsx`, `AboutPage.tsx` to `hello@teamstoa.com`

---

## Phase 6.2.9 - SPA Routing Fix (nginx on Railway) — in progress

**Goal:** Make every app route work on hard navigation (typing a URL directly, opening a shared
link in a new tab, refreshing a deep page) — not just on in-app clicks.

### Why this matters

TeamStoa is a Single-Page Application (SPA): React renders every route in the browser, but the
server only has one real file — `index.html`. When a user navigates inside the app, React Router
handles it silently. But when the browser makes a fresh HTTP request for a route like `/admin`,
`/privacy`, or `/shared/abc123`, the server must return `index.html` for the app to boot and
take over. If it returns a 404 — or worse, returns `index.html` for the JS bundle too — the page
is blank.

This is a **launch blocker** for two reasons:

1. **Shared debate links** (`/shared/:slug`) are the product's primary viral loop. If a recipient
   opens a shared link in a new browser tab, they get a blank page. No one will share the product.
2. **Legal and marketing pages** (`/privacy`, `/terms`, `/about`) added in Phases 6.2.4–6.2.6
   must work as direct links — they are referenced in registration forms, emails, and footers.

### What was tried first and why it failed

A `frontend/public/_redirects` file with `/* /index.html 200` (Netlify-style rewrite) was added
as a quick workaround. Railway's static file server partially supported it — the HTML document
was served correctly — but then applied the catch-all to the JS bundle requests too
(`/assets/index-BqZJMeSN.js` → returned `index.html` → MIME type error → blank page).
Railway has no "404 fallback page" setting in its dashboard to fix this properly.

### Solution: nginx Dockerfile

Replace Railway's built-in static file server with an nginx container built from a
`frontend/Dockerfile`. nginx's `try_files $uri $uri/ /index.html` directive is the industry
standard for SPA routing: it serves real files (JS, CSS, images) directly, and only falls back
to `index.html` for paths that have no matching file — exactly what is needed.

**Files added:**

- `frontend/Dockerfile` — multi-stage build: Node 20 builds the Vite app, nginx alpine serves it
- `frontend/nginx.conf` — SPA routing config with long-cache headers for hashed assets

**Railway change required:** In the frontend Railway service, set the root directory to
`frontend/` so Railway finds and builds the `Dockerfile`. The service type changes from
Railway's built-in static server to a Docker-based service.

### Tasks

- [x] Add `frontend/Dockerfile` (multi-stage: node build → nginx serve)
- [x] Add `frontend/nginx.conf` (SPA `try_files` + 1-year asset cache)
- [ ] Update Railway frontend service: set root directory to `frontend/`, trigger redeploy
- [ ] Verify: hard-navigate to `/admin`, `/privacy`, `/shared/:slug` — all should load correctly
- [ ] Remove `frontend/public/_redirects` once nginx is confirmed working (it is now unused)

---

## What is the Landing Page?

The **landing page** is a public marketing page at `https://www.teamstoa.com/` (the root domain) that
explains what TeamStoa does and converts visitors into signed-up users.

Right now, visiting `teamstoa.com` shows the app login screen directly — there is no page for
someone who has never heard of TeamStoa and wants to understand it before signing up.

### Why it matters

- It is the single highest-leverage marketing investment before paid ads or SEO kick in.
- Every link you share (WhatsApp, LinkedIn, Twitter, Product Hunt) lands here first.
- Without it, the product is invisible to anyone who is not already referred by you personally.

### What it contains (from PLAN_Marketing.md Section 3)

| Section | Purpose |
|---------|---------|
| Hero | Headline + one-sentence explanation + "Try it free" CTA |
| How it works | 3-step visual: Ask → AI Team Debates → Consensus Answer |
| Live demo or GIF | 15–20 second screen recording of the chatroom debate — the product sells itself visually |
| Use cases | 6-card grid, one per team template |
| Why not just ask one AI? | Contrast section: one LLM hallucinates; a team debates, critiques, and scores |
| Social proof | Run count, model count, testimonials when available |
| Pricing | Free tier / Pro tier — even before Stripe is wired, to set expectations |
| Footer | Privacy, Terms, Contact, social links |

### Implementation options

| Option | Effort | Notes |
|--------|--------|-------|
| Static HTML at root (simplest) | 1–2 days | No framework needed; deploy alongside the app |
| React page in current Vite app | 1–2 days | Add a `/` route that renders before auth; fast to ship |
| Next.js (v7.0) | Weeks | Best for SEO/SSR; too heavy for launch — do this after the product is validated |

**Recommendation:** ship a React page at `/` in the current Vite app first. It gets you to market in
days. Migrate to Next.js later if SEO traffic justifies it.
