# Version 6.2 - Pre-Launch Polish: Rebrand, SEO Foundation, Legal Pages, and OG Sharing

**Scope:** Close the remaining gaps from the Marketing rebrand checklist before any public launch.
**Status:** All phases (6.2.1–6.2.9) Done.
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

## Phase 6.2.4 - Privacy Policy Page — Done

**Goal:** Satisfy legal requirements (GDPR, CCPA) that apply the moment real users sign up.
Required before any public marketing push or paid tier.

### Tasks

- [x] Add `/privacy` route to the React app (`App.tsx` public routes)
- [x] Write Privacy Policy: data collected, Railway/PostgreSQL storage, OpenRouter third-party disclosure, localStorage, no tracking cookies, user deletion rights, contact email
- [x] Link "Privacy" in the registration form consent line (`LoginPage.tsx`)
- [x] Link "Privacy" in each page's header nav and footer
- [ ] Link "Privacy" in the landing page footer (when built)

---

## Phase 6.2.5 - Terms of Service Page — Done

**Goal:** Protect the product legally and set user expectations before any paid tier or Product Hunt launch.

### Tasks

- [x] Add `/terms` route to the React app (`App.tsx` public routes)
- [x] Write Terms of Service: acceptable use, AI accuracy disclaimer, quota limits, account suspension, content ownership, limitation of liability
- [x] Link "Terms" in the registration form: "By creating an account you agree to our Terms of Service and Privacy Policy" (`LoginPage.tsx`)
- [x] Link "Terms" in each page's header nav and footer
- [ ] Link "Terms" in the landing page footer (when built)

---

## Phase 6.2.6 - About Page — Done

**Goal:** Give visitors a trust signal — who built this, why, and how to contact you.

### Tasks

- [x] Add `/about` route to the React app (`App.tsx` public routes)
- [x] Write About page: product origin (the Stoa), how the debate loop works (Writer/Critic/Scorer/Summarizer), team templates explained, contact email
- [x] Link "About" in each page's header nav and footer
- [ ] Link "About" in the landing page footer (when built)

**Note:** Contact email is `hello@teamstoa.com` (Phase 6.2.8 confirmed outbound sending is production-ready; inbound delivery to this address itself still needs separate mail-forwarding setup — see the "Known gap" note in Phase 6.2.8).

---

## Phase 6.2.7 - Sitemap — Done

**Goal:** Help search crawlers discover all public pages once they exist.

### Tasks

- [x] Create `frontend/public/sitemap.xml` listing: `/`, `/about`, `/privacy`, `/terms`, plus any future `/templates/*` pages
- [x] Add `<lastmod>` dates and `<changefreq>` hints
- [ ] Submit to Google Search Console after the landing page is live (deferred — no landing page exists yet, tracked separately, not part of this phase's scope)

**Note:** The `robots.txt` already references `https://www.teamstoa.com/sitemap.xml`. `/` currently
resolves to the login screen rather than a marketing landing page (the landing page itself is
tracked separately — see "What is the Landing Page?" below) but is still the canonical URL and is
listed. `/shared/:slug` is intentionally excluded — those are per-user dynamic pages, not stable
crawlable content.

**Verified:** `npm run build` succeeds; confirmed `dist/sitemap.xml` and `dist/robots.txt` are
present in the build output and `dist/_redirects` is gone.

---

## Phase 6.2.8 - Production Email (Resend) — Done

**Goal:** Real transactional emails (password reset, account verification) delivered to users.

**Previous state:** `EMAIL_PROVIDER` defaulted to `"log"` on Railway — emails printed to server log only. Real users could not reset passwords or verify accounts.

### Tasks

- [x] Sign up at resend.com
- [x] Add and verify `teamstoa.com` domain in Resend (region: North Virginia / us-east-1). DNS records
      (DKIM on `resend._domainkey`, MX + SPF TXT on `send.teamstoa.com`) added at GoDaddy, verified in Resend
- [x] Create API key (Full access, all domains)
- [x] Set Railway backend service env vars: `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`,
      `EMAIL_FROM=TeamStoa <noreply@teamstoa.com>`, `APP_URL=https://www.teamstoa.com`
- [x] Test password reset end-to-end, both locally (`APP_URL=http://localhost:5173`) and on the live
      Railway deployment — email delivered, reset link worked, password changed successfully in both
- [x] Contact email in `PrivacyPage.tsx`, `TermsPage.tsx`, `AboutPage.tsx` — already `hello@teamstoa.com`,
      no change needed (the "temporary placeholder" note below was already stale)
- [x] Rebrand the transactional email template (`backend/services/email.py`): extracted a shared
      `_branded_email()` wrapper (logo, white card on light-lavender background, footer tagline) and
      `_cta_button()` helper used by both `send_password_reset_email` and `send_verification_email`,
      replacing the previous bare-text template. Solid button color kept (not a gradient) for
      cross-client email rendering safety
- [x] Rebrand the "Password updated" success state (`ResetPasswordPage.tsx`): replaced the plain `✅`
      emoji with a Lucide `Check` icon in the same violet-gradient rounded box used for the brand icon
      elsewhere on the page

**Known gap, not a blocker for this phase:** Resend's MX/SPF setup only covers the `send.teamstoa.com`
subdomain (outbound sending). The root `teamstoa.com` domain has no MX record, so the `hello@teamstoa.com`
mailto links on the Privacy/Terms/About pages currently have nowhere to deliver incoming mail — any reply
sent there would bounce. Fixing this needs separate mail-receiving setup (e.g. free forwarding via
Cloudflare Email Routing/ImprovMX, GoDaddy's own forwarding if available, or a paid mailbox) — tracked as
a follow-up, not required for transactional sending to work.

**Verified:** `python -m py_compile backend/services/email.py` and `npx tsc --noEmit` both clean. Manual
end-to-end test of the password-reset flow (not verification-email specifically — same `_dispatch`/
`_send_resend` code path, but the verification-email content itself wasn't separately exercised) locally
and on the live Railway backend: email received via Resend, reset link correct for each environment,
password change succeeded.

---

## Phase 6.2.9 - SPA Routing Fix (Railway) — Done

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
as a quick workaround. Railway's built-in static file server partially supported it — the HTML
document was served correctly — but then applied the catch-all to the JS bundle requests too
(`/assets/index-BqZJMeSN.js` → returned `index.html` → MIME type error → blank page).
Railway has no "404 fallback page" setting in its dashboard to fix this properly.

### What was tried second: nginx Dockerfile (abandoned)

An nginx container built from `frontend/Dockerfile` + `frontend/nginx.conf` (`try_files $uri $uri/
/index.html`) was added, then reverted a few commits later (`8ac57bc`, `f1bf488`) in favor of the
simpler solution below. Neither file exists in the repo anymore — do not resurrect them without
checking why they were dropped first.

### Solution actually shipped: `serve -s` as the Railway start command

Instead of a custom Docker/nginx image, the frontend Railway service build stays on Railway's
default static build, and the **Start Command** (set in the Railway dashboard, frontend service →
Settings → Deploy) is:

```
npx serve -s dist -l $PORT
```

`serve` is pinned as a normal dependency in `frontend/package.json` (not installed via `npm install
-g` at start time) so `npx` resolves it locally instead of re-fetching it from the registry on
every restart. The `-s` (single-page-app) flag makes `serve` fall back to `index.html` for any
path that isn't a real file in `dist/`, while still serving real files (JS/CSS bundles, images,
`sitemap.xml`, `robots.txt`) directly — exactly the same guarantee `try_files` would have given,
without a custom Docker image. This is documented as the standing configuration in
`docs/engineering/railway-deployment.md` (Step 7c).

The old `frontend/public/_redirects` file had no effect under `serve` (that syntax is
Netlify-specific) and has been removed as dead weight.

### Bug found during manual verification: PWA navigateFallback pointed at the wrong page

While verifying hard-navigation, a second, unrelated bug was found in `frontend/vite.config.ts` was set to
`/offline.html` instead of `/index.html`.


### Tasks

- [x] ~~Add `frontend/Dockerfile` / `frontend/nginx.conf`~~ — superseded, removed from repo
- [x] Railway frontend service: root directory `frontend/`, start command `npx serve -s dist -l
      $PORT` — documented in `docs/engineering/railway-deployment.md`
- [x] Remove `frontend/public/_redirects` (unused under `serve`)
- [x] Fix `navigateFallback` in `frontend/vite.config.ts` (`/offline.html` → `/index.html`)
- [x] Manual verification on the live Railway deployment: hard-navigated to `/about`, `/privacy`,
      `/terms`, and `/sitemap.xml`

**Verified:** `npm run build` succeeds locally. Live manual test on `www.teamstoa.com` a hard reload / "Clear site data" and a fresh hard-navigation test to `/about`, `/privacy`, `/terms`, and `/sitemap.xml` tsolve the problem of hard navigation (when typing into the url those pages)

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
