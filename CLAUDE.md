## Project Overview
MultiAi is a SaaS web app providing a multi-LLM consensus dashboard — better answers through structured AI agent collaboration. Users view, manage, and interact with a live debate between AI agents. Authentication is not yet implemented.

The debate UX is a **Slack-style chatroom** (`ChatroomDebateView`). Each agent has a distinct avatar and name; they post messages into a single scrollable feed as the debate progresses. Round boundaries appear as channel dividers. The Scorer posts like a status-update bot. Typing indicators appear between messages. The final answer is pinned at the top of the channel — permanently visible. This layout scales naturally to any number of team members.

---

## Commands

Run all commands from the project root (`MultiAi`).

### Backend
```bash
uv run uvicorn backend.api.app:app --reload --port 8000
```

### Frontend
```bash
cd frontend && npm install
npm run dev        # Dev server at http://localhost:5173
npm run build      # tsc + vite build
npm test           # vitest run
```

### Python Tests
```bash
uv run pytest tests/                          # All tests
uv run pytest tests/test_scorer.py            # Single test file
uv run pytest tests/test_scorer.py::test_name # Single test
```

### uv setup (first time only)
```bash
winget install astral-sh.uv   # install uv (PowerShell)
uv pip install -r backend/requirements.txt  # install Python deps into .venv
```
Note: Python deps are in `backend/requirements.txt` (no version pins). There is no `pyproject.toml`. Use `uv pip install -r` rather than `uv sync`.

## Architecture

MultiAi is a multi-LLM consensus engine. 
The user poses a question; 
a Writer LLM answers it, two Critic LLMs critique it, and the loop continues until a Scorer (always Deepseek v3.2) rates agreement ≥ the configured threshold or max rounds is reached. 
A Summarizer (always Deepseek v3.2) compresses each round into a rolling context used in subsequent rounds. All LLM calls go through OpenRouter.

### Live web research

Phase 4.2.5 is implemented. Consult requests include `web_search_mode` (`off`, `auto`, or `on`;
default `auto`). Explicit search requests and clearly time-sensitive questions activate one
controlled OpenRouter web-plugin research call after clarification checks and before the debate.
The dated, source-linked packet is appended to the shared question context, so every Writer,
Critic, refinement, validator, and final-synthesis call receives the same evidence. Scorer and
summarizer do not search independently.

Search metadata is persisted on `DebateSession`, returned through the API, shown by
`WebResearchStatus` on live/saved/shared results, and included in PDF/Markdown exports. Failed
searches continue with a visible freshness warning. Never claim live search or current verification
occurred unless `web_search_performed` is true.

### Debate loop flow

```
POST /api/consult-stream
  → Attachments normalized (text extracted; images checked — Deepseek seats swapped to Gemini Flash if image input detected)
  → Intent assessed — returns clarification state if question is too ambiguous
  → ConsensusEngine.run()
    → Round 1: Writer(s) answer fresh (parallel if N writers)
    → Loop:
        Critics critique in parallel (use rolling_context, not full transcript)
        Scorer rates 1–10 (Deepseek v3.2 only, 600-char excerpts)
        Summarizer compresses round → appended to rolling_context (Deepseek v3.2, max_tokens=200)
        If score >= threshold → break
        Writer refines answer
        Relevance validation: refined answer checked against original question
    → Writer synthesizes final answer
  → Session saved as sessions/YYYYMMDD_HHMMSS.json
```

### Context management rule (critical)
Rolling context is **append-only summaries**, never full transcripts:
```python
rolling_context += f"\n[Round {round_num} summary]: {round_summary}"
```
This string — not the full answer/critique text — is passed to LLMs in subsequent rounds.

### Model routing
- Writers and Critics: user-selected from UI (N writers and N critics supported — see below)
- Scorer: always `deepseek/deepseek-chat-v3.2`
- Summarizer: always `deepseek/deepseek-chat-v3.2`
- Never route scorer/summarizer to user-selected models

### N-writer / N-critic support (implemented)
The engine accepts `writers: list[str]` and `critics: list[str]` (1–6 each). Behavior:
- **N writers:** All draft in parallel in round 1; their answers are merged and labeled `[Writer 1]`, `[Writer 2]`, etc. The primary writer (first) handles all refinements and final synthesis.
- **N critics:** All critique in parallel every round. Critiques are merged and labeled. Consensus score is the average of all pairwise scores across critics' revised answers. Single-critic sessions compare the writer's answer directly against the critic's suggestion.
- **Frontend:** `mergeTeamIntoPayload` sends `writers` and `critics` as full lists. Legacy `writer`/`critic_a`/`critic_b` fields are also sent for backward compat; the backend prefers the list fields.
- **Cap:** max 6 writers, max 6 critics (enforced in `schemas.py`).

### Key modules

**Backend**
| File | Responsibility |
|------|---------------|
| `backend/consensus/engine.py` | `ConsensusEngine` — main debate orchestrator |
| `backend/consensus/debate_runner.py` | Executes individual debate rounds |
| `backend/consensus/llm_clients.py` | OpenRouter wrapper; defines `LLMCallError` |
| `backend/consensus/scorer.py` | `score_consensus() → (float, str)` |
| `backend/consensus/summarizer.py` | `summarize_round() → str` |
| `backend/consensus/validator.py` | Relevance validation of refined answer vs original question |
| `backend/consensus/models.py` | `DebateRound`, `DebateSession` dataclasses |
| `backend/consensus/prompts.py` | All LLM prompt templates (locked — do not modify without instruction) |
| `backend/consensus/intent.py` | Intent ambiguity detection and clarification |
| `backend/consensus/attachments.py` | File/image attachment normalization; Deepseek→Gemini image fallback |
| `backend/consensus/web_research.py` | Live-search activation, OpenRouter web plugin, source packet formatting |
| `backend/consensus/usage_tracker.py` | Per-model token and cost tracking |
| `backend/consensus/costs.py` | Cost calculation |
| `backend/consensus/parsing.py` | LLM output parsing (extracts revised answers, scores) |
| `backend/consensus/text_excerpt.py` | `excerpt(text, limit)` — shortens prompt inputs keeping head **and** tail, so a trailing conclusion is never cut (used by scorer and validator) |
| `backend/consensus/activity_text.py` | Generates NDJSON activity stream lines |
| `backend/consensus/model_registry.py` | Model registry |
| `backend/consensus/export_title.py` | Short session title generation |
| `backend/config.py` | All constants and env var loading (`AppConfig`) |
| `backend/api/app.py` | FastAPI app — routes, CORS, lifespan, quota enforcement, `/api/me` |
| `backend/api/auth.py` | fastapi-users setup — JWT backend, UserManager, email hooks, schemas |
| `backend/api/admin.py` | Admin-only router (`/api/admin/*`) — user list, disable/enable, stats, resend-verification |
| `backend/api/schemas.py` | Pydantic request/response models (`ConsultRequest`, `ConsultResponse`) |
| `backend/api/sessions.py` | Sessions sub-router (`/api/sessions/*`) |
| `backend/services/email.py` | Email dispatch (log / Resend / SMTP) — password reset and verification emails |
| `backend/scripts/seed_admin.py` | One-time bootstrap: creates admin user (reads `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars) + migrates JSON sessions to DB |
| `backend/storage/db_models.py` | SQLAlchemy ORM models (`User`, `Run`, `TeamConfig`, `Output`, `File`) |
| `backend/storage/session_store.py` | Stateless JSON session persistence |
| `backend/storage/database.py` | Async SQLAlchemy engine/session factory (`get_async_session`) |
| `backend/api/shared.py` | Public read-only `/api/shared/:slug` route — no auth required |

**Frontend**
| File | Responsibility |
|------|---------------|
| `frontend/src/App.tsx` | Root component — orchestrates hooks, owns live run state (`result`, `loading`, `activity`) |
| `frontend/src/types.ts` | Shared TypeScript types (`ConsultPayload`, `ConsultResult`, `SessionPreview`, etc.) |
| `frontend/src/hooks/useDarkMode.ts` | Dark mode toggle — adds/removes `.dark` class on `<html>` |
| `frontend/src/hooks/useComposeForm.ts` | Form, team, attachments, activeCast state + related effects |
| `frontend/src/hooks/useSessionHistory.ts` | Session list, selected session, cached results |
| `frontend/src/hooks/useClarification.ts` | Clarification prompt/options/choice state |
| `frontend/src/hooks/useFollowup.ts` | Follow-up composition state |
| `frontend/src/hooks/useToast.ts` | Toast notification + auto-clear |
| `frontend/src/hooks/usePanelState.ts` | Drawer/panel open states + sidebar localStorage persistence |
| `frontend/src/hooks/useConsultRun.ts` | `useConsultRun()` — drives the live `/api/consult-stream` run (activity, result, session title) |
| `frontend/src/lib/consultHelpers.ts` | `mergeTeamIntoPayload`, `selectCastFromTeam`, `buildRunSignature` |
| `frontend/src/lib/parseActivityMessages.ts` | Pure fn: `string[]` → `ChatroomState` |
| `frontend/src/lib/detectActiveAgent.ts` | Infers current speaker from activity stream |
| `frontend/src/lib/utils.ts` | `cn()` — clsx + tailwind-merge |
| `frontend/src/lib/answerMode.ts` | `recommendedRoundsForAnswerMode()` |
| `frontend/src/lib/apiBaseUrl.ts` | `getApiBaseUrl()` |
| `frontend/src/lib/authToken.ts` | JWT localStorage helpers — `getAuthToken`/`setAuthToken`/`clearAuthToken` |
| `frontend/src/lib/modelProviderBadge.ts` | `modelProviderBadge()` — provider label for a model id |
| `frontend/src/lib/panelStyles.ts` | Shared panel heading style constant |
| `frontend/src/lib/promptDisplay.ts` | Prompt/attachment text formatting for display and export |
| `frontend/src/lib/sessionInsightsFormatters.ts` | `shortModel`/`fmtTokens`/`fmtUsd`/`fmtSeconds` formatters for Session Insights |
| `frontend/src/lib/teamRoster.ts` | `appendDefaultTeamMember()` |
| `frontend/src/lib/teamSharedRole.ts` | `sharedLeadExpertRole()` |
| `frontend/src/data/experts.ts` | Team member presets and `createDefaultTeam()` |
| `frontend/src/data/models.ts` | Model options list |
| `frontend/src/data/templates.ts` | `TEAM_TEMPLATES`, `TEMPLATE_ICONS`, role-summary/description helpers |
| `frontend/src/hooks/useAuth.ts` | Auth state — JWT in localStorage, `/api/me` profile fetch, login/register/logout/updateProfile/changePassword |
| `frontend/src/pages/LandingPage.tsx` | Public marketing landing page at `/` (logged-out) — hero, How it works stepper, persona cards + team-template chip strip, pricing banner |
| `frontend/src/pages/LoginPage.tsx` | Login + register form (TeamStoa branded); `initialMode` prop seeds login vs register; brand + "Back to home" link to `/` |
| `frontend/src/pages/ForgotPasswordPage.tsx` | Request password-reset email |
| `frontend/src/pages/ResetPasswordPage.tsx` | Set new password via token from email |
| `frontend/src/pages/SettingsPage.tsx` | User settings — display name, usage quota, change password |
| `frontend/src/pages/AdminPage.tsx` | Admin dashboard — user list, stats, disable/enable, resend verification |
| `frontend/src/pages/SharedRunPage.tsx` | Public read-only `/shared/:slug` view — no login required |
| `frontend/src/pages/AboutPage.tsx` | Public About page |
| `frontend/src/pages/PrivacyPage.tsx` | Public Privacy Policy page |
| `frontend/src/pages/TermsPage.tsx` | Public Terms of Service page |
| `frontend/src/components/compose/` | Compose bar, attachments, follow-up input — e.g. `CommandBar.tsx`, `Composer.tsx`, `ComposerAttachmentPanel.tsx` |
| `frontend/src/components/debate/` | Live chatroom debate UI — e.g. `ChatroomDebateView.tsx`, `ChatPanel.tsx`, `ChatMessage.tsx` |
| `frontend/src/components/drawers/` | Slide-in/bottom-sheet panels — e.g. `AdvancedDrawer.tsx`, `TemplateDrawer.tsx`, `InsightsDrawer.tsx` |
| `frontend/src/components/layout/` | App shell chrome — e.g. `TopNav.tsx`, `Sidebar.tsx`, `MobileBottomNav.tsx` |
| `frontend/src/components/session/` | Saved/live session view and actions — e.g. `PinnedAnswer.tsx`, `AnswersPanel.tsx`, `SessionPromptBlock.tsx` |
| `frontend/src/components/team/` | Team member cards and template pickers — e.g. `TeamMemberEditModal.tsx`, `TemplateShortcutRow.tsx`, `AgentStripCards.tsx` |
| `frontend/src/components/ui/` | Low-level styled primitives — e.g. `button.tsx`, `input.tsx`, `select.tsx` |
| `frontend/src/services/api.ts` | Backend fetch wrapper |
| `frontend/src/services/attachments.ts` | File/attachment handling |
| `frontend/src/services/pdf/` | PDF/Markdown export pipeline — e.g. `exporter.ts`, `pdfParticipants.ts`, `pdfMarkdown.ts` |

## Coding standards

**Python**
- Python 3.11+: type hints on all function signatures, dataclasses for models
- All constants and limits defined in `config.py` — no magic numbers
- All file paths use `pathlib.Path`
- `ConsensusEngine` takes `config` as constructor arg — no `os.environ` inside methods
- Session store functions are stateless — accept `sessions_dir` as parameter
- LLM clients are module-level singletons (lazy init) — the only allowed global state
- Return `DebateSession` or `DebateRound` from engine functions — never raw dicts
- Logging via `logging` module only (never `print()`): INFO for completions, WARNING for parse failures/budget exceeded, ERROR for API/IO failures

**Frontend**
- **Tailwind CSS v4** — uses `@import "tailwindcss"`, `@theme inline`, `@variant dark`. Not v3. Do not follow v3 config docs.
- **Routing: React Router v6** (`react-router-dom`). Routes: `/app/new` (empty compose), `/app/run/:id` (session view), `/shared/:slug` (public stub, v4.2). Navigate with `useNavigate`. Read URL params with `useParams`. Do not add SSR, file-based routing, or a second router without instruction.
- **No global state library** — state is held in custom hooks called from `App.tsx`. Do not add Redux, Zustand, Jotai, etc. without explicit instruction.
- Path alias `@` → `frontend/src/` (configured in both `vite.config.ts` and `tsconfig.json` — keep in sync if changed).
- Dark mode is class-based: `.dark` toggled on `<html>` by `useDarkMode` hook.

## Prompt templates

Do not modify scorer, summarizer, or debate prompt templates without explicit instruction — wording changes affect consensus behavior. Templates live in `backend/consensus/prompts.py`.

## Testing

- All tests mock LLM calls — never make live API calls in tests
- Use `pytest-mock` and `tmp_path` fixture for session storage tests
- Token budget: warn if any session exceeds 12,000 tokens total

## Token budget

| Call | Target |
|------|--------|
| Round 1 answer / critique / refinement / synthesis | ≤ 800 tokens each |
| Summarizer | ≤ 200 tokens (`max_tokens=200` enforced) |
| Scorer | ≤ 100 tokens (600-char excerpts only) |

## Environment variables

All secrets in `.env` (gitignored):
```
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
DEFAULT_WRITER_MODEL=openai/gpt-5.4
DEFAULT_CRITIC_MODEL_A=anthropic/claude-sonnet-4.6
DEFAULT_CRITIC_MODEL_B=google/gemini-3.1-pro
SCORER_MODEL=deepseek/deepseek-chat-v3.2
SUMMARIZER_MODEL=deepseek/deepseek-chat-v3.2
```

## What NOT to do

- Do not pass full round transcripts to subsequent rounds — rolling summaries only
- Do not alter scorer or summarizer prompts without explicit instruction
- Do not return raw dicts from engine functions
- Do not add a database — JSON file storage only
- Do not build a CLI entrypoint — React UI + backend API only
- Do not use `print()` for logging

---

## Current Plan

v3 (Slack-style chatroom debate view) — **complete**. All deliverables shipped.  
Active plan: see `PLAN.md` at the repo root.

---
## Session discipline

Claude updates `### Current Session State` automatically after:
- finishing any file edit
- being asked "what have you done?"
- any /compact is about to run

## Current Session State

### Branch: `PLAN_v8.0` (working branch for the current line — commits and pushes for multiple related sub-versions may land here even if a new sub-version's theme differs from the branch's original scope) — last verified 2026-07-23

- **Completed work:** see `docs/plan_archive/`
- **Active plan:** see `PLAN.md`
- **Architecture reference:** see `docs/engineering/`
- **In production:** v6.2 - Pre-Launch Polish, v6.3 - Mobile Follow-up & Debate View Fixes, v6.4 - Markdown Table Rendering, and v7.0 - Cleanup & Follow-up Flow Fixes (7.0.1-7.0.10) — merged to `main` and deployed. Known follow-up: `hello@teamstoa.com` has no inbound mail receiving configured yet (Resend's MX/SPF only covers the `send.` subdomain for outbound)
- **In development:** v8.0 - Marketing & Launch (on `PLAN_v8.0` branch; full spec `docs/plan_archive/PLAN_v8.0.md`). Launching **free** (billing deferred). Pre-marketing rebrand + SEO foundation already shipped in v6.2. **v8.1 (free-tier quota counter) Done:** live sidebar counter via `refreshProfile()`, `/api/me` monthly rollover (`_runs_reset_due`), split quota check/increment so a clarification no longer double-counts. **v8.2 (landing page) Done:** new public `LandingPage.tsx` at `/` (logged-out marketing surface; logged-in redirect to `/app/new`); `/login` + `/register` routes with `initialMode` on `LoginPage`; persona cards + an "Or pick a team" chip strip pre-select a template via a `pending_team_template` localStorage key; redesigned "How it works" 4-step stepper with per-step actor tags; copy scrubbed of "rival"/"verdict"; fixed a login-routing bug where `/login`/`/register` rendered the form even when already logged in; back-to-landing links on `LoginPage`. Also fixed search/share metadata in `index.html` (Google was scraping login-page text as the description): added `<meta description>`, a descriptive `<title>`, aligned OG/Twitter copy, and a corrected 1200×630 `MascotTeamStoa.png` share image. Google Search Console ownership verified via an HTML meta-tag in `index.html` (the HTML-file method failed because Railway 301-strips `.html` to the SPA). Debate preview image asset (`/landing-debate-preview.png`) not yet supplied — slot self-hides until it lands; user still needs to Request Indexing in Search Console + re-scrape the social card debuggers post-deploy. **v8.2.1 (follow-up relevance bug fix) Done:** follow-up runs were overwriting the final answer with the parent session's answer. `validate_relevance`, the fast-mode overlap guard, and the repair directive all read `question_with_context` (the packet the frontend builds at `App.tsx` `runFollowup`, which embeds the whole parent answer), and `validator.py` truncated it, so the follow-up instruction was never seen and the repair then told the writer to reproduce the parent answer. New `_build_user_request()` in `engine.py` feeds those call sites the follow-up instruction (or base question) instead; repair reuses `FINAL_SYNTHESIS` with `current_answer=session.final_answer` so it refines the team answer rather than regenerating flat prose. `run_rounds` still gets the full packet — the debate needs parent context. Task 5 also fixed two validator defects found by live diagnosis: the answer was truncated at 900 chars while `FINAL_SYNTHESIS` puts the deliverable last, so the validator never saw the actual answer (now `validator_answer_chars`, with `_excerpt()` keeping head **and** tail); and the `0.9/0.1` weighting meant an LLM verdict of 7 could not clear a 7.0 threshold (overlap is now a floor-guard, `validator_min_overlap`, and the score is the LLM verdict itself). Deferred: Task 4 — `assess_intent` still receives the packet, so `intent_scope` can describe the parent topic. **v8.2.2 (text-leak fixes) Done:** the same packet/attachment text was leaking into four more surfaces — the public `/shared/:slug` Question card (now built from structured fields via `lib/sharedPromptView.ts`), sidebar titles (lowercase; fixed in `AnswersPanel.tsx` — note `layout/Sidebar.tsx` is dead code and imported nowhere), attachment chips (whole chip was a delete button; `window.open()` on a `data:` URL opened a blank tab — now `lib/openAttachment.ts` converts to a Blob), and PDF/Markdown export (`ChatPanel.tsx` `originalPrompt` and `pdfTitleFromResult` dumped extracted attachment text). Also shared-page presentation: brand+tagline link, `Try for free`, `QUESTION - SHARED RUN` label, footer. Deferred: Task 3 — the `Note: Relevance remained imperfect after repair.` string is appended into `final_answer`, so pre-fix sessions still show it publicly. **v8.2.3 (Hebrew PDF export + presentation pass) Done:** PDF export rendered Hebrew as Latin-1 mojibake with reversed dates. jsPDF uses built-in Helvetica (Latin-1 only) and no font was ever embedded. Now `services/pdf/pdfFont.ts` registers Noto Sans Hebrew TTFs (from `@expo-google-fonts/noto-sans-hebrew` — `@fontsource` ships only WOFF, which jsPDF cannot parse), chosen **per document** via `pdfText.ts` `documentNeedsUnicodeFont()`, so Latin-only exports keep Helvetica and cannot regress. Critical gotcha: **jsPDF runs its own bidi engine on every `doc.text` call** (`isInputVisual` defaults to `true` = convert, `false` = pass through) — the correct combination is one `bidi-js` pass in `toVisualOrder()` **plus** `isInputVisual: false`; reordering with the default converts twice and reverses Latin runs inside Hebrew. Applied by patching `doc.text` on the instance so `jspdf-autotable` is covered too. Script detection uses numeric codepoints, not regex classes — a literal precomposed Hebrew character silently widened a class into a range that swallowed the bidi marks. Also fixed a pre-existing bug where `ensurePageSpace` left the page header's font active, shrinking the first line after every page break. Header now carries the TeamStoa lockup linking to teamstoa.com, `Exported DD/MM/YYYY hh:mm`, and section rules via a `sectionBreak()` helper. Known gaps: RTL right-alignment does not cover markdown-link lines or table cells; the mascot remains the centre-page watermark; and a Hebrew question still gets an English final answer (backend — `FINAL_SYNTHESIS`'s English section headings override language mirroring; noted in `PLAN_v8.2.3.md`). **v8.2.4 (scorer + intent truncation) Done:** two more cases of truncation hiding the decisive text. The scorer truncated `answer[:600]`, so with 800-token answers it graded preambles — and since the score gates loop termination, two answers with matching openings and opposite conclusions could score 9 and stop the debate. Measured over the 110 affected rounds in `sessions/`: every one exceeded the window, and the scorer read a mean 38.2% of the writer answer and 17.9% of the critic's revision; `20260518_171918` round 3 scored exactly 8.0 (the default threshold, so it broke the loop) on two 600-char windows that were 99.3% identical while the full texts were 21.4% similar — the critic had copied the writer's opening verbatim. `validator._excerpt` (head+tail, added in v8.2.1 Task 5) is now public `excerpt()` in `backend/consensus/text_excerpt.py`, used by both scorer and validator; the 600 moved to `cfg.scorer_excerpt_chars` and the **budget is unchanged** — only the shape of the cut (300 head + 300 tail), so CLAUDE.md's documented "600-char excerpts" still holds. Raising it is the cheapest accuracy buy in the system (scorer output is capped at 100 tokens regardless of input) but needs its own measurement pass. Also closed v8.2.1's deferred Task 4: `assess_intent` received the follow-up packet, so `intent_scope` could describe the parent topic and then propagate into every writer/critic prompt. New `_build_intent_subject()` in `engine.py` passes the instruction plus the parent prompt truncated to `cfg.intent_parent_anchor_chars` (300) — the anchor is required or short instructions like "make it shorter" read as ambiguous; the post-repair `assess_intent` retry reuses the same string; all non-follow-up paths unchanged. Full write-up incl. an out-of-scope list of known reliability gaps (no LLM retries, `asyncio.gather` without `return_exceptions`, silent parse/PDF fallbacks, no crash recovery, stream worker swallowing non-`LLMCallError`): `docs/plan_archive/PLAN_v8.2.4.md`. **v8.2.5 (follow-up web research) Done:** third instance of the same family — a follow-up of `make it shorter` searched the live web for the literal phrase and displayed text-summarizer tools as sources. `search_subject = followup_instruction or question` was passed straight to `research_web`, so the query had no topic; and the user's saved `pref_web_research_mode=on` (inherited by follow-ups because `runFollowup` spreads `...form`) made `should_search` return True without inspecting the text — under `auto` it would have skipped. Two fixes: `is_meta_instruction()` in `web_research.py` guards inside `should_search` **before** the `on` branch, matching the **whole** instruction so anything carrying a topic still searches (`add a table` is meta, `add a table comparing 2026 prices` is not); and `_build_search_query()` in `engine.py` anchors a follow-up's retrieval query with the parent prompt (`cfg.search_parent_anchor_chars` = 300). Critical: the search *decision* still uses the raw instruction while only *retrieval* uses the anchored query — anchoring first would break the whole-string guard. Flagged, not fixed: auto-mode detection on follow-ups still reads only the instruction, so a topical follow-up under `auto` is judged without parent context. Next: v8.3 team role refinements.
- **Not yet started / blocked:**
  - v5.2 - Deferred Auth And Account Features — Blocked
  - v_SEO - Next.js + SEO — Planned
  - Grounded data sources (SEC EDGAR + academic APIs) — Planned (`docs/local_only/Plan_grounded_sources.md`)

## Workflow Rules
- Before starting each plan section, STOP and wait for explicit "proceed" confirmation
- NEVER run git add, git commit, git revert, or git reset without explicit user approval
- When ready to commit, propose the commit message and wait for confirmation before executing
- Treat all git operations as requiring manual approval
