# Version 7.0 - Next.js, SEO, Template Pages, SSR/SSG

**Scope:** Move public and SEO-sensitive surfaces to Next.js while preserving the private app workflow.  
**Status:** Planning only. Do not implement until explicitly approved.  
**Depends on:** v5.0 mobile UX and v6.0 account/admin foundations should be stable.

---

## Goal

MultiAi's private app can remain a client-heavy workspace, but public pages need crawlability, metadata, fast first load, and share-friendly previews. v7.0 should introduce Next.js for the public surface and decide whether the private app also migrates or remains separate.

---

## Phase 7.0.1 - Architecture Decision

**Goal:** Decide the safest migration shape before code moves.

### Options

| Option | Description |
|--------|-------------|
| Public-only Next.js | Keep the current React app for `/app/*`; add Next.js for marketing, templates, and shared pages |
| Full Next.js migration | Move private app and public pages into one Next.js App Router project |
| Hybrid transition | Start public-only, then migrate private app later if useful |

### Tasks

- [ ] Choose the migration option and deployment topology
- [ ] Decide whether Railway hosts one service or separate frontend services
- [ ] Define API boundaries between Next.js pages and FastAPI backend
- [ ] Preserve current shared-run URLs or define redirects
- [ ] Document rollback strategy

---

## Phase 7.0.2 - Template Page System

**Goal:** Turn team templates and use cases into crawlable pages.

### Tasks

- [ ] Define template page data model: slug, title, use case, agents, prompts, examples
- [ ] Create SEO-friendly template page layout
- [ ] Generate pages for existing starter templates
- [ ] Add related templates and use-case navigation
- [ ] Keep template pages connected to app launch/create-run flow

---

## Phase 7.0.3 - SSR Shared Run Pages

**Goal:** Make public shared runs fast, link-preview friendly, and crawlable where appropriate.

### Tasks

- [ ] Implement `app/shared/[slug]/page.tsx` or equivalent
- [ ] Fetch public shared run data server-side
- [ ] Generate metadata and Open Graph tags from public run title/summary
- [ ] Keep unshared/private runs returning proper not-found behavior
- [ ] Preserve read-only debate/final-answer rendering

---

## Phase 7.0.4 - Marketing And SEO Foundation

**Goal:** Build the public discovery surface without weakening the private product.

### Tasks

- [ ] Add public homepage or product page only if it serves SEO/product discovery
- [ ] Add use-case pages for high-intent queries
- [ ] Add `generateMetadata()` for key pages
- [ ] Add sitemap and robots configuration
- [ ] Add canonical URLs and structured data where useful

---

## Phase 7.0.5 - App Router And Private App Integration

**Goal:** Keep authenticated app behavior stable during the migration.

### Tasks

- [ ] Decide whether `/app/*` remains Vite/React or moves into Next.js
- [ ] Preserve auth token/session behavior across public and private surfaces
- [ ] Keep route parity for `/app/new`, `/app/run/:id`, and `/shared/:slug`
- [ ] Confirm export, sharing, follow-up, and live streaming flows still work
- [ ] Add redirects for any changed route names

---

## Phase 7.0.6 - Deployment, Analytics, And Verification

**Goal:** Ship the SEO surface with reliable hosting and measurable outcomes.

### Tasks

- [ ] Update Railway deployment docs for Next.js service(s)
- [ ] Add build and preview commands
- [ ] Add basic web analytics or search performance tracking if desired
- [ ] Verify metadata, Open Graph previews, sitemap, and crawlability
- [ ] Run smoke tests for public pages, shared pages, and private app entry

---

## Acceptance Criteria

- Template/use-case pages are crawlable and have useful metadata.
- Public shared pages can render server-side or statically where appropriate.
- Private app routes remain stable and usable.
- SEO pages do not expose private user data.
- Deployment docs explain the new frontend topology clearly.
