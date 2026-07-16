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
| `frontend/src/pages/LoginPage.tsx` | Login + register form (TeamStoa branded) |
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

### Branch: `PLAN_v6.0` (working branch for this version line — commits and pushes for multiple related sub-versions may land here even if a new sub-version's theme differs from the branch's original scope) — last verified 2026-07-16

- **Completed work:** see `docs/plan_archive/`
- **Active plan:** see `PLAN.md`
- **Architecture reference:** see `docs/engineering/`
- **In production:** v6.3 - Mobile Follow-up & Debate View Fixes (6.3.1 shipped)
- **In development:** v6.3 - Mobile Follow-up & Debate View Fixes (working on 6.3.2; v6.2 remaining items 6.2.7/6.2.8/6.2.9 still open in parallel; v6.4 queued next)
- **Not yet started / blocked:**
  - v5.2 - Deferred Auth And Account Features — Blocked
  - v6.2 - Pre-Launch Polish: Rebrand, SEO Foundation, Legal Pages, and OG Sharing — In Progress (6.2.7 Sitemap, 6.2.8 Production Email, 6.2.9 SPA Routing Fix remaining)
  - v6.3 - Mobile Follow-up & Debate View Fixes — In Progress (6.3.2 Follow-up Thread History & Ordering remaining)
  - v6.4 - Markdown Table Rendering (App + PDF Export) — Planned
  - v7.0 - Next.js + SEO — Planned
  - Marketing - TeamStoa Brand, Launch, And Growth — Planned

## Workflow Rules
- Before starting each plan section, STOP and wait for explicit "proceed" confirmation
- NEVER run git add, git commit, git revert, or git reset without explicit user approval
- When ready to commit, propose the commit message and wait for confirmation before executing
- Treat all git operations as requiring manual approval
