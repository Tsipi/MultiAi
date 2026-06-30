# PLAN.md

**Active version:** v4.4 - Live Debate Experience Polish  
**Previous:** `docs/plan_archive/PLAN_v4.3.md` (completed)

---

## Active roadmap

| Version | Theme | Scope | Status |
|---------|-------|-------|--------|
| v4.0 | UI Foundation | React Router v6 + Team Templates (frontend only) | **Complete** |
| v4.1 | Persistence & Auth | PostgreSQL, Alembic, fastapi-users, login UI | **Complete** |
| v4.1.1 | Cleanup & Reorganisation | Component folder move, CORS, session scoping, PLAN sync | **Complete** |
| v4.2 | Sharing, Export, Roles, and Live Web Research | Public sharing, full debate export, per-agent roles, live web research | **Complete** |
| **v4.3** | Reduce Run Latency | Fast/Balanced/Deep mode, fewer unnecessary calls, timing instrumentation | **Complete** |
| **v4.4** | Live Debate Experience Polish | Compact progress notes, named teammate copy, typing polish, clearer repair/error notes | **Planning** |
| v5.0 | New Login, Auth, Admin, and User Settings | Product-ready account UX, admin area, regular user settings, permission hardening | Planned |
| v6.0 | Mobile UX | Responsive app shell, mobile compose, mobile sessions, mobile run experience | Planned |
| v7.0 | Next.js + SEO | Template pages, public/shared SSR/SSG, metadata, sitemap, SEO architecture | Planned |
| Marketing | TeamStoa Brand, Launch, And Growth | In-app rebrand, landing page, content, analytics, Product Hunt, pricing | Planned |

---

## v4.2 completed subphases

Full spec: `docs/plan_archive/PLAN_v4.2.md`

| Phase | Goal | Status |
|-------|------|--------|
| 4.2.1 | PDF Export Polish | **Done** |
| 4.2.2 | Public Sharing | **Done** |
| 4.2.3 | Full Debate Export | **Done** |
| 4.2.4 | Per-Agent Writer and Critic Roles | **Done** |
| 4.2.5 | Live Web Research for Current Questions | **Done** |

### v4.2 highlights

**PDF and Markdown export polish**  
Exports now support fuller run context, better document structure, and optional full-debate output.

**Public sharing**  
Saved runs can be shared publicly, unshared again, and loaded through a read-only shared-run route.

**Full debate export**  
Users can include the Director's Cut / full debate transcript in exported Markdown and PDF files.

**Per-agent roles**  
Writer and Critic role arrays are passed through the frontend payload, API schemas, persisted sessions, follow-up runs, and debate prompts. Each agent's role now influences that specific agent instead of relying only on one shared role.

**Live web research**  
The app supports `Auto / Search web / No web`, retrieves one controlled OpenRouter web-plugin research packet when needed, injects that evidence into the debate context, and preserves source metadata in saved/shared/exported results.

---

## v4.3 planned subphases

Full spec: `docs/plan_archive/PLAN_v4.3.md`

| Phase | Goal | Status |
|-------|------|--------|
| 4.3.1 | Add Answer Mode | **Done** |
| 4.3.2 | Reduce Default Rounds | **Done** |
| 4.3.3 | Skip Unnecessary Support Calls in Fast Mode | **Done** |
| 4.3.4 | Use Faster Models for Utility Roles | **Done** |
| 4.3.5 | Make Web Search Strictly Conditional | **Done** |
| 4.3.6 | Defer Non-Essential Work | **Done** |
| 4.3.7 | Improve Perceived Speed | **Done** |
| 4.3.8 | Measure Before and After | **Done** |

---

## v4.4 planned subphases

Full spec: `docs/plan_archive/PLAN_v4.4.md`

| Phase | Goal | Status |
|-------|------|--------|
| 4.4.1 | Compact Routine Progress Messages | **Done** |
| 4.4.2 | Remove Generic Critic Labels From User-Facing Copy | **Done** |
| 4.4.3 | Simplify Typing And Loading States | **Done** |
| 4.4.4 | Preserve Compatibility For Saved And Larger Debates | **Done** |
| 4.4.5 | Avatar Fetch And Render Audit | **Done** |
| 4.4.6 | Minimal Verification | Manual check pending |
| 4.4.7 | Clear Repair And Provider-Limit Notes | **Done** |

---

## v5.0 planned subphases

Full spec: `docs/plan_archive/PLAN_v5.0.md`

| Phase | Goal | Status |
|-------|------|--------|
| 5.0.1 | Auth Audit And Role Model | **Done** |
| 5.0.2 | New Login And Registration UX | **Done** |
| 5.0.3 | Regular User Settings | **Done** |
| 5.0.4 | Admin Area | **Done** |
| 5.0.5 | Usage Quotas And Billing Preparation | **Done** |
| 5.0.6 | Permissions And API Hardening | **Done** |
| 5.0.7 | Deployment And Operations | **Done** |

---

## v5.1 fixes subphase

Full spec: `docs/plan_archive/PLAN_v5.1.md`

---

## v6.0 planned subphases

Full spec: `docs/plan_archive/PLAN_v6.0.md`

| Phase | Goal | Status |
|-------|------|--------|
| 6.0.1 | Mobile Information Architecture | Planned |
| 6.0.2 | Responsive App Shell | Planned |
| 6.0.3 | Mobile Compose Experience | Planned |
| 6.0.4 | Mobile Live Debate And Final Answer | Planned |
| 6.0.5 | Mobile Session History | Planned |
| 6.0.6 | Mobile QA And Accessibility | Planned |


---

## v7.0 planned subphases

Full spec: `docs/plan_archive/PLAN_v7.0.md`

| Phase | Goal | Status |
|-------|------|--------|
| 7.0.1 | Architecture Decision | Planned |
| 7.0.2 | Template Page System | Planned |
| 7.0.3 | SSR Shared Run Pages | Planned |
| 7.0.4 | Marketing And SEO Foundation | Planned |
| 7.0.5 | App Router And Private App Integration | Planned |
| 7.0.6 | Deployment, Analytics, And Verification | Planned |

---

## v4.0 tasks

| Phase | Goal | Status |
|-------|------|--------|
| 1 | Empty-state UX: `New Run` button in TopNav | **Done** |
| 1b | Client-side routing: React Router v6; `/app/new`, `/app/run/:id` | **Done** |
| 2 | Team Templates: template chips + drawer; 8 starter templates | **Done** |
| 3 | Backend performance and accuracy: speed fixes, live pricing, follow-up root anchor | **Done** |

### v4.0 Phase 3 - Backend performance and accuracy

**Speed - parallel scorer and writer refinement**  
Scorer and writer refinement were running sequentially each round despite being independent. Both now run inside `asyncio.gather`, saving time per round.

**Speed - remove per-round relevance validation**  
`validate_relevance` was removed from the per-round loop. The final-answer check in the engine is kept, eliminating redundant validation calls per session.

**Pricing - live rates from OpenRouter**  
`costs.py` fetches `/api/v1/models` at backend startup and caches prices in memory. It falls back to the hardcoded table if the fetch fails.

**Follow-up - root question anchor**  
Follow-up chains now keep a `root_question`, so follow-ups anchor to the first question in the thread instead of drifting through immediate parent prompts.

Full spec: `docs/plan_archive/PLAN_v4.0.md`

---

## Version archive

| Version | Theme | Plan |
|---------|-------|------|
| v1.0 | Initial architecture | `docs/plan_archive/PLAN_v1.0.md` |
| v1.1 | Unified dashboard UX | `docs/plan_archive/PLAN_v1.1.md` |
| v2.0 | Dark tech minimal redesign | `docs/plan_archive/PLAN_v2.0.md` |
| v3.0 | Slack-style chatroom debate | `docs/plan_archive/PLAN_v3.0.md` |
| v3.1 | Codebase cleanup | `docs/plan_archive/PLAN_v3.1.md` |
| v3.2 | Engagement and threading | `docs/plan_archive/PLAN_v3.2.md` |
| v3.3 | Documentation sync | `docs/plan_archive/PLAN_v3.3.md` |
| **v4.0** | UI Foundation | `docs/plan_archive/PLAN_v4.0.md` |
| **v4.1** | Persistence and Auth | `docs/plan_archive/PLAN_v4.1.md` |
| **v4.1.1** | Cleanup and Reorganisation | `docs/plan_archive/PLAN_v4.1.1.md` |
| **v4.2** | Sharing, Export, Roles, and Live Web Research | `docs/plan_archive/PLAN_v4.2.md` |
| **v4.3** | Reduce Run Latency | `docs/plan_archive/PLAN_v4.3.md` |
| **v4.4** | Live Debate Experience Polish | `docs/plan_archive/PLAN_v4.4.md` |
| v5.0 | New Login, Auth, Admin, and User Settings | `docs/plan_archive/PLAN_v5.0.md` |
| v6.0 | Mobile UX | `docs/plan_archive/PLAN_v6.0.md` |
| v7.0 | Next.js + SEO | `docs/plan_archive/PLAN_v7.0.md` |
| Marketing | TeamStoa Brand, Launch, And Growth | `docs/local_only/PLAN_Marketing.md` |
