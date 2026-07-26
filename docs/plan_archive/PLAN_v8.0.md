# TeamStoa — Marketing And Launch Plan

**Status:** In Progress (v7.0 merged to `main`; on `PLAN_v8.0` branch). Checkboxes audited against
shipped code on 2026-07-23. Pre-marketing rebrand (Section 2) and SEO foundation (Section 7) largely
done from v6.2. **Build phase 1 (Section 12 — free-tier quota counter) Done.** Landing page,
analytics, and content/SEO pages not started; billing deferred (launching free).  
**Domain:** TeamStoa — where AI teams deliberate and decide for you.

---

## 1. Brand Identity

### Name and meaning

**TeamStoa** — "Stoa" is the Greek colonnaded meeting place where Stoic philosophers gathered to debate and reach understanding. The name signals: a team of thinkers working together on your behalf, structured deliberation, trustworthy output. It is short, distinctive, and domain-registrable.

### Tagline options (pick one for launch, A/B test later)

| Option | Tone |
|--------|------|
| "Your AI decision council." | Authoritative, concise |
| "Expert AI consensus, instantly." | Feature-forward |
| "AI teams that think before they answer." | Process-forward |
| "Better answers through structured AI debate." | Descriptive, honest |

Recommendation for launch: **"Your AI decision council."** — memorable, differentiated from "just ask ChatGPT."

### Voice and tone

- **Decisive:** TeamStoa makes decisions, it does not waver. Copy should be confident and direct.
- **Trustworthy:** Multiple perspectives, one clear answer. Emphasise the process.
- **Human-scale:** The team metaphor (Writer, Critic, Scorer) maps to real workplace dynamics. Use it.
- **No hype:** Avoid "revolutionary," "game-changing," "10x." The product itself is the claim.

### Visual identity

- Keep the current brand violet as the primary color — it reads as intellectual, not corporate.
- Add a simple logomark: a geometric "stoa" or colonnaded shape, or an abstract "team circle" of dots (agents) around a central answer node.
- Update favicon, page title (`<title>TeamStoa</title>`), and `og:image` before any public launch.
- Replace all in-app "MultiAi" text, email subjects, and Railway service names with "TeamStoa."

---

## 2. In-App Rebrand Checklist (Pre-Marketing)

These must happen before any marketing outreach begins — a user who discovers TeamStoa and sees "MultiAi" in the app will lose trust immediately.

- [x] Replace "MultiAi" in all component copy, page titles, `<title>` tags, and meta descriptions — Done (no "MultiAi" left in `frontend/src` except one internal localStorage key `multiAi_castBySession`; `index.html` `<title>TeamStoa</title>`)
- [x] Update `manifest.json` `name` and `short_name` to "TeamStoa" — Done (PWA manifest in `vite.config.ts`: `name`/`short_name` = "TeamStoa")
- [x] Update the `og:title`, `og:description`, and `og:image` tags for the app — Done (`index.html` OG + Twitter card, `og:image` = `MascotTeamStoa.png` 1200×630). NOTE: per-**shared-run** dynamic OG (title from the question) still needs SSR → tracked in v_SEO, not done.
- [ ] Update the Railway service name and environment labels — infra-side, not verifiable from code; repo dir is still `MultiAi`. Cosmetic (not user-facing).
- [x] Update any auth-related email templates (verification, password reset) — sender should be TeamStoa / `@teamstoa.com` — Done (`EMAIL_FROM=TeamStoa <noreply@teamstoa.com>`; templates rebranded in v6.2.8; Resend live)
- [x] Update the PDF export footer/header from "MultiAi" to "TeamStoa" — Done (`pdfHeader.ts` prints "TeamStoa"; v6.2.1)
- [x] Confirm the public sharing URL (`/shared/:slug`) reads correctly as a TeamStoa link when previewed on social — Done at the app level (teamstoa.com link + TeamStoa OG card). Per-question preview text needs SSR (v_SEO).

---

## 3. Landing Page

The landing page is the highest-leverage marketing investment before SEO catches up. It lives at the root domain (`teamstoa.com` or `teamstoa.ai`) and gates access to the app (`/app`).

### Structure (single scrolling page for launch)

| Section | Purpose |
|---------|---------|
| **Hero** | Headline + one-sentence explanation + primary CTA ("Try it free") |
| **How it works** | 3-step visual: Ask → AI Team Debates → Consensus Answer |
| **Live demo or GIF** | 15–20 second recording of the chatroom debate view — the product sells itself visually |
| **Use cases** | 6 card grid, one per team template: Programming, Marketing, Research, Finance, Creative, Planning |
| **Why not just ask one AI?** | Contrast section: one LLM hallucinates, guesses, flatters. A team debates, critiques, and scores. |
| **Social proof** | When available: testimonial quotes, run count, number of AI models supported |
| **Pricing** | Simple: Free (N runs/month) / Pro ($X/month, unlimited). Add billing CTA even if Stripe is not wired yet — collect emails. |
| **Footer** | Blog, About, Privacy, Terms, Contact, GitHub (if open source), Twitter/X, LinkedIn |

### Hero copy example

> **Your AI decision council.**  
> Pose any question. A team of AI experts debates it across multiple rounds, challenges each other's reasoning, and delivers one clear consensus answer — with the full debate transcript if you want it.  
> [Start for free →]

---

## 4. Content Marketing

### Template-driven SEO pages (tied to v_SEO)

Each team template becomes a public landing page optimized for a long-tail query:

| Template | Target query |
|----------|-------------|
| Programmer Team | "AI code review tool", "AI pair programming" |
| Marketing Campaign Team | "AI marketing strategy tool", "AI campaign planner" |
| Research Assistant Team | "AI research assistant", "AI literature review" |
| Financial Analyst Team | "AI financial analysis tool", "AI investment research" |
| Creative Writing Team | "AI creative writing tool", "AI story planner" |
| Tourist Planner Team | "AI travel planner", "AI trip itinerary" |

Each page includes: what the template does, example questions, a sample output (a real exported answer), and a CTA to run one now.

### Blog topics for launch phase

- "Why asking one AI isn't enough: the case for structured debate"
- "How TeamStoa works: Writer, Critic, Scorer explained"
- "5 decisions we made better with an AI council"
- "AI consensus vs AI chatbots: what's the difference?"
- "Building a multi-agent debate loop in Python" (developer interest / HN audience)

### Distribution channels

| Channel | Audience | Content type |
|---------|---------|-------------|
| **Product Hunt** | Early adopters, builders | Launch day — prepare assets 2 weeks ahead |
| **Hacker News (Show HN)** | Developers, skeptics | Technical writeup of the debate loop |
| **LinkedIn** | Business decision-makers, managers | Use-case posts, before/after decision examples |
| **Twitter/X** | AI enthusiasts, founders | Short video of a live debate run |
| **Reddit** | r/ChatGPT, r/AItools, r/Entrepreneur, r/MachineLearning | Honest product post, not spam |
| **IndieHackers** | Indie founders | Product story, MRR updates once billing exists |

---

## 5. Pricing Strategy

### Free tier (launch)

- N runs per month (suggest 10–20 to allow genuine use without giving away the farm)
- All team templates included
- PDF and Markdown export included
- Public sharing included
- 1 writer + 2 critics max on free tier (or all configs — decide based on cost)

### Pro tier ($15–25/month, post v6.0 billing)

- Unlimited runs
- All model options (free tier could restrict to 3–5 model choices)
- Priority processing
- Follow-up threads
- Custom system roles / team templates saved to account

### Team tier ($X/seat/month, post v7.0 or later)

- Shared session history across a workspace
- Admin dashboard for team usage
- SSO/SAML (enterprise later)

### Freemium philosophy

Make the free tier generous enough that users get real value and share results (organic growth), but restrictive enough that power users convert. **Do not add a credit card requirement at signup** — it kills top-of-funnel for a product at this stage.

---

## 6. Analytics And Growth Metrics

Add analytics before launch so you know what is working.

### Recommended tool: Plausible Analytics (privacy-friendly, no cookie banner needed in EU)

Alternatively: PostHog (more powerful, self-hostable, free tier generous).

### Key events to track

| Event | Why it matters |
|-------|---------------|
| Landing page visit | Top of funnel |
| Sign-up started | Conversion intent |
| Sign-up completed | Acquisition |
| First run started | Activation |
| First run completed | Core value delivered |
| Session saved | Retention signal |
| Session shared | Virality signal |
| PDF exported | Power user signal |
| Return visit within 7 days | Early retention |
| Quota hit | Conversion opportunity |

### North star metric

**Weekly Active Runs** — the number of unique users who completed at least one run in the past 7 days. This captures both acquisition and retention in one number.

---

## 7. SEO Foundation (tied to v7.0)

SEO is a slow burn but compounds. Start the groundwork now even if the Next.js migration is months away.

- [x] Register `teamstoa.com` — Done (live domain: canonical, OG URLs, and `@teamstoa.com` email all use it). `.ai` unknown.
- [x] Set canonical URLs on public pages — Done (`index.html` `<link rel="canonical">`). NOTE: single static canonical (SPA); true per-page canonicals need SSR (v_SEO).
- [x] Add `og:title`, `og:description`, `og:image` (1200×630) to the app shell — Done (`index.html`). Per shared-run page → SSR (v_SEO), not done.
- [x] Add `robots.txt` allowing public pages, disallowing `/app/*` and `/api/*` — Done (`public/robots.txt`: allows `/`, disallows `/app/`, `/api/`, `/admin`, links the sitemap)
- [x] Add an XML sitemap — Done for existing public pages (`/`, `/about`, `/privacy`, `/terms`). Template/blog pages don't exist yet → add when they ship.
- [ ] Target primary keywords: "AI decision tool," "multi-agent AI," "AI consensus," "AI debate tool" — content/copy work, ongoing, not a code task.
- [ ] Shared-run pages should have human-readable `og:title` based on the session's question — Not done; requires SSR (v_SEO). High viral value.

---

## 8. Launch Sequence

| Week | Action |
|------|--------|
| **Before launch** | In-app rebrand complete (section 2). Password reset live. Landing page live. Analytics installed. |
| **Week 1** | Soft launch: share with personal network, IndieHackers, close friends. Collect first bug reports. |
| **Week 2** | Blog post "How TeamStoa works." Share on LinkedIn and Twitter. |
| **Week 3** | Product Hunt launch (requires 2 weeks of asset prep: screenshots, GIF, tagline, maker profile). |
| **Week 4** | Hacker News Show HN with the technical architecture writeup. |
| **Month 2** | First template SEO pages live. Begin Reddit community posts with real examples. |
| **Month 3** | Review funnel data. If activation is strong but retention is weak: improve follow-up UX. If sign-ups are weak: revisit landing page copy or pricing. |
| **Month 4+** | Stripe billing live, Pro tier available. Begin LinkedIn paid ads if organic is plateauing. |

---

## 9. What To Avoid

- **Do not launch marketing before password reset exists.** Users who can't recover their account churn immediately and leave negative impressions.
- **Do not promise "current information" unless web search is on.** The live web research feature is there — use it as a selling point honestly: "TeamStoa can search the web before debating when your question needs current data."
- **Do not claim "X AI models agree" if the consensus score is low.** The product is honest disagreement that converges — lean into the process, not a false unanimity.
- **Do not launch on Product Hunt before the mobile experience works.** PH voters are heavily mobile. A broken mobile layout will tank the rating.
- **Do not add a marketing cookie banner before actually installing tracking that requires one.** Plausible does not require consent under GDPR — use it to avoid the banner entirely.

---

## 10. Prioritization (audit 2026-07-23)

Launch prerequisites already satisfied: password reset live, mobile UX works (v6.0), in-app rebrand done, PDF/OG/robots/sitemap/canonical done, quota-gated free usage exists.

### Must-have before any marketing push
1. **Landing page (Section 3).** The single biggest gap. Today the root `/` drops visitors straight into the app compose — there is no marketing surface that explains the product or captures email. Without it, Product Hunt / HN / ads have nowhere to convert. Highest leverage.
2. **Analytics (Section 6).** ~1 hour (Plausible = one script tag, cookieless, no banner). You cannot optimize a funnel you can't measure. When added, update the Privacy page line that currently states "no third-party analytics scripts."

### Strongly recommended (higher effort, do soon after)
3. **Shared-run per-question OG / canonical (from Sections 2 & 7).** Shared answers are the main viral loop, but they currently preview as a generic "TeamStoa" card, not the actual question. Needs SSR — either the full v_SEO/Next.js migration, or a lighter targeted edge/SSR function just for `/shared/:slug` and the landing/template pages. High viral value; can ship interim without the full migration.

### Nice-to-have / defer
- **Billing + Pro tier (Section 5).** Free-tier quota (20/mo) already protects cost. Per the plan's own sequence this is a Month-4 item — launch free-only, collect Pro-interest emails on the landing page instead.
- **Content marketing (Section 4)** — blog, Product Hunt, HN, Reddit. These are activities that follow the landing page + analytics, not app features.
- **Template SEO pages (Sections 4 & 7)** — big long-tail payoff but slow burn; part of v_SEO, after the landing page.
- **Railway service rename + `multiAi_castBySession` localStorage key** — cosmetic, invisible to users; skip unless convenient (renaming the key would drop existing users' cached casts for no benefit).

**Shortest path to a credible launch:** landing page → analytics → (interim shared-run OG). Everything else can follow.

---

## 11. Landing/marketing site direction (colleague wireframe, 2026-07-23)

A high-fidelity wireframe (Modernist system, brand violet) proposes sharper positioning and a
fuller, multi-page site than Sections 1–5 (which described one long scrolling page). Adopt the
messaging, structure, and persona framing below — but treat the grounded-data and per-claim-confidence
claims as **product roadmap that gates the marketing** (see "Reality gap"), per the honesty rules in
Section 9.

### Adopt — positioning & messaging
- Hero hook: **"One AI's confident answer isn't a verified one."** Problem-first, stronger than the
  Section 1 taglines — keep as the launch hero candidate (A/B vs "Your AI decision council").
- Core promise: rival models argue a question out "until only the answer that survives is left
  standing" — a **verdict, not just an answer** (per-claim confidence, the strongest remaining
  disagreement, which source backed which claim). *(Confidence/verdict features are aspirational — see
  Reality gap.)*
- Differentiators, both crisp and true to the debate mechanic: **"Comparing isn't checking"** (vs
  side-by-side AI-comparison tools) and **"Most AI debates still argue from memory"** (i.e., from
  training data, not fresh/cited sources).
- Top-of-funnel CTA: **"No account, no card — one free debate on us."**

### Adopt — site structure (a multi-page site, not one long page)
- **Solutions = persona pages** (Investor, Researcher, Founder/Builder, Creator, Everyday) — each
  with its own hero, default team, and "who it's for" copy. This *is* the v_SEO template-page
  strategy (Section 4) — build these as the SEO landing pages.
- **How it works** — 5 steps (pick team → ask → debate → verdict → follow-up) + a worked example +
  "shows its work" (live token/cost, permalink replay — both already exist).
- **Live debates feed** — a public, persona-filterable feed of shared debates ("see what people are
  asking"). High viral + SEO value; pairs with the shared-run OG priority in Section 10. *(New
  product surface — see Reality gap.)*
- **Pricing, About, Sign up (Google), Account / debate history.**

### Adopt — persona segmentation as the marketing spine
Organize landing pages, ad copy, and default team presets around the four personas
(Investor / Researcher / Founder / Everyday). More concrete and higher-converting than the generic
"6 use cases" grid in Section 3.

### Pricing framing (option, still gated on billing)
Persona-priced tiers under one subscription — "every plan draws from the same model access; the
difference is which team loads by default": Free (Everyday) / Builder $9 / Creator $9 / Investor $18
/ Researcher $28 / Team $99. Cleaner story than Free/Pro/Team; revisit when billing lands (Section 5/10).

### Reality gap — product dependencies (do NOT market until built)
The wireframe assumes features the current product lacks. These are **product-roadmap items, not
marketing tasks**, and several conflict with Section 9:
- **Per-domain grounded data** (live quotes, insider trades, analyst estimates, earnings transcripts,
  SEC filings, academic literature). Today grounding is only the optional OpenRouter web-search plugin
  (`auto`/`on`/`off`). The wireframe's central claim "grounded in real data, not memory" is **not
  currently true** — either build the data integrations or soften copy to "can search the web when your
  question needs current data." Do not ship the finance-data claims as-is.
- **Confidence-per-claim ("conf 81%")** — the app returns a single 1–10 consensus score, not per-claim
  percentages. Any screenshot showing per-claim % is fabricated until built.
- **Persona default teams** (Bull / Bear / Risk Manager, Verifier Panel, etc.) — feasible **now** as
  new template presets; low effort, high payoff. Good early win to make the persona pages real.
- **Public "Live debates" feed** — needs an aggregated, moderated gallery (per-run sharing exists; a
  feed does not).
- **Anonymous "one free debate"** — a product/auth change to the current signup-gated flow.
- **Google sign-in** — already planned in v5.2 (blocked).
- The **"42–68% hallucination reduction"** stat needs a citable source before use.

### Grounding — recommended phased approach
> Full build plan: `docs/local_only/Plan_grounded_sources.md`.

The wireframe makes "grounded in real data" the *central* claim. Two problems: the product's real
differentiator is the multi-model **debate** (true today), and grounding today is only the optional
web-search plugin (`web_research.py`). So keep debate as the hero claim, and grow grounding per
persona over time — don't make it the central promise until it's built. Good news: `web_research.py`
already appends a **dated, source-linked packet** to the shared question context, so new data sources
plug into that same shape — this is an extension of an existing pattern, not a new architecture.

- **Phase 0 — now, no build.** Market the grounding that already exists: web search with dated, cited
  sources. Honest copy: *"searches the web and cites its sources when your question needs current
  data."* This unblocks the landing page today.
- **Phase 1 — cheap, high-credibility, mostly free.** Add a few free domain sources that reuse the
  existing source-packet mechanism, making "grounded per domain" genuinely true where it's wired:
  - **SEC EDGAR** (free API) → company filings, for the Investor/Researcher personas.
  - **arXiv / Semantic Scholar / PubMed** (free APIs) → academic literature, for the Researcher persona.
  Moderate build: a connector per source that formats results into the current web-research packet.
- **Phase 2 — revenue-gated.** Paid real-time market data, earnings transcripts, analyst estimates,
  insider trades — only once Pro revenue covers the licensing (these feeds are expensive and often
  restrict redistribution). Completes the Investor persona's full "real market data" promise.
- **Guardrails:** claim grounding only for the sources actually wired per persona; always show
  sources (already done); check each provider's redistribution/display terms before shipping.

### Recommendation
Adopt the positioning, IA, and persona framing now — they make the Section 3 landing page and Section
4 SEO pages materially stronger. Launch with **honest copy** (structured debate + optional web search
+ replayable transcripts), ship **persona default teams** as an early cheap win, and treat
grounded-data / per-claim-confidence / the live feed as roadmap that unlocks the stronger claims as
each ships.

---

## 12. Build phase 1 — Free-tier quota counter (live + correct) — Done

**Decision:** launch **free for now** (no billing / no Pro tier — Section 5 deferred), but keep the
free-tier quota as a **cost cap**. Before anything else, the "Runs this month N / 20" counter in the
left sidebar ([ConsensusRunsSidebar.tsx:104-115](frontend/src/components/layout/ConsensusRunsSidebar.tsx#L104-L115))
must be live and correct. Audit found three bugs; all fixed.

### Bug 1 — counter doesn't update after a run
`useAuth` fetches `/api/me` only when the token changes (login/page-load)
([useAuth.ts:34-56](frontend/src/hooks/useAuth.ts#L34-L56)); nothing re-fetches it when a run
finishes ([App.tsx](frontend/src/App.tsx) `onRunComplete`). The backend increments the count on the
server ([app.py:272](backend/api/app.py#L272)), but the sidebar stays frozen at the login-time value
until reload.

- [x] Exposed a `refreshProfile()` from `useAuth` (extracted the `/api/me` fetch into a callback).
- [x] Call it in `App.tsx` `onRunComplete` and in all three run-error catches (so a 429 also corrects
  the counter). Counter now increments live, no reload.

### Bug 2 — stale count at the start of a new month
The monthly reset only runs inside `_check_and_increment_quota` (on run start,
[app.py:255-263](backend/api/app.py#L255-L263)), but `/api/me` returns `user.runs_this_month` raw
([app.py:145](backend/api/app.py#L145)). So on the 1st of a new month, before starting a run, the
counter can still show last month's number (e.g. "20 / 20", amber) even though the quota reset.

- [x] Added `_runs_reset_due(reset_at, now)` helper; `/api/me` now returns `0` for `runs_this_month`
  when `runs_reset_at` is a prior month/year — corrected read without needing a run.

### Bug 3 — clarification double-counts
Both `/api/consult` and `/api/consult-stream` incremented the quota **before** the engine ran. A
question that returns a **clarification** does no debate, yet still incremented; answering the
clarification hits the endpoint again and increments a second time. So one clarified question counted
as 2 (user-confirmed: 2 questions showed "3 / 20").

- [x] Split `_check_and_increment_quota` into `_check_quota` (429 if over, applies rollover, no
  increment — called **before** the engine in both `/api/consult` and `/api/consult-stream`) and
  `_increment_quota` (called **after** the engine, only when `not session.needs_clarification`). A
  clarification return counts 0; the resumed debate counts 1.

### Verify — user-confirmed working
- [x] Run a debate → sidebar counter increments immediately (no reload).
- [x] Ask a question that triggers a clarification, then answer it → counter goes up by 1, not 2.
- [x] `npx tsc --noEmit` clean; `backend/api/app.py` parses. No existing tests reference the quota
  logic.
- [ ] Not re-verified this session: quota-limit 429, prior-month rollover, superuser (logic unchanged
  in behavior for these paths).
