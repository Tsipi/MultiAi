# AUDIT_MAP.md

**Generated:** 2026-05-14  
**Sources:** package.json, requirements.txt, vite.config.ts, tsconfig.json, backend/api/app.py, frontend/src/App.tsx, frontend/src/index.css, .gitignore, filesystem scan

---

## Top-level structure

| Path | What it is |
|---|---|
| `backend/` | Python FastAPI service |
| `docs/` | Documentation — engineering/, plan_archive/, product/, reviews/ |
| `frontend/` | React/TypeScript/Vite SPA |
| `sessions/` | JSON session storage — gitignored, 43 files locally |
| `tests/` | Python test suite |
| `CLAUDE.md` | Claude Code instructions + embedded (stale) v3 plan |
| `DRIFT_REPORT.md` | Drift audit (generated 2026-05-14) |
| `README.md` | Product overview — contains port numbers swapped (see inconsistencies) |

---

## Frontend

**Root:** `frontend/`

| Path | Purpose |
|---|---|
| `src/App.tsx` | Root component — owns all application state (20+ `useState` declarations) |
| `src/main.tsx` | React entry point |
| `src/index.css` | Tailwind v4 CSS + design token definitions |
| `src/types.ts` | Shared TypeScript types (`ConsultPayload`, `ConsultResult`, `SessionPreview`, etc.) |
| `src/assets.d.ts` | Asset type declarations |
| `src/components/` | 50+ UI components (see below) |
| `src/components/ui/` | Primitive wrappers: `button.tsx`, `input.tsx`, `label.tsx`, `select.tsx`, `textarea.tsx` |
| `src/data/experts.ts` | Team member presets and `createDefaultTeam()` |
| `src/data/models.ts` | Model options list |
| `src/hooks/useDarkMode.ts` | Only custom hook — toggles `.dark` class on `<html>` |
| `src/lib/` | 10 utility modules (see below) |
| `src/services/api.ts` | Backend fetch wrapper |
| `src/services/api.test.ts` | Frontend API tests (collocated with source — see inconsistencies) |
| `src/services/attachments.ts` | File/attachment handling |
| `src/services/exporter.ts` | Export logic |
| `src/services/pdfMarkdown.ts` | PDF + markdown export helper |
| `vite.config.ts` | Vite config — React plugin, Tailwind v4 plugin, `@` alias → `./src` |
| `tsconfig.json` | TypeScript config — strict mode, `@/*` paths alias |
| `package.json` | npm manifest |
| `avatars/` | Static avatar image assets |
| `dist/` | Build output — gitignored |

### Frontend component inventory (50+ files)

| Group | Components |
|---|---|
| **Chatroom debate (v3 plan — all complete)** | `ChatroomDebateView`, `ChatMessage`, `ScoreBadge`, `RoundDivider`, `TypingRow`, `ChannelHeader`, `PinnedAnswer`, `ConsensusReachedBanner` |
| **Command / compose area** | `CommandBar`, `CommandBarHeaderRow`, `CommandBarTeamAvatars`, `CommandContextFooter`, `Composer`, `ComposerAdvanced`, `ComposerAttachmentPanel` |
| **Team setup** | `AdvancedDrawer`, `TeamMemberCard`, `TeamMemberDutyModelRow`, `TeamMemberEditForm`, `TeamMemberEditModal`, `AgentStrip`, `AgentStripCards` |
| **Session / result display** | `ChatPanel`, `AnswersPanel`, `FinalAnswerAvatarStrip`, `CollapsiblePanel`, `DebateActivityFeed`, `DebateActivityPrimitives` |
| **Session sidebar** | `ConsensusRunsSidebar`, `Sidebar` |
| **Follow-up** | `FollowupComposer` |
| **Insights** | `InsightsDrawer`, `SessionInsightsTableView`, `ModelUsageTable` |
| **Attachments** | `AttachmentChipList`, `AttachmentFileLinks`, `QuickPasteZone`, `SessionAttachmentList` |
| **Session metadata** | `SessionPromptBlock`, `SessionPromptActions`, `SessionPromptDownloads`, `DebateOptionsTable`, `DebateSettings` |
| **UI primitives** | `FieldLabelWithTip`, `InfoTip`, `MarkdownView`, `ModelProviderIcon`, `LeadRoleField`, `V2SectionHeader` |
| **Marketing / misc** | `QuestionActionBanner`, `SavedAnswerMarketingCard`, `ClarificationBox` |
| **Navigation** | `TopNav`, `SettingsBar` |

### Frontend lib modules

| File | Purpose |
|---|---|
| `lib/consultHelpers.ts` | `mergeTeamIntoPayload`, `selectCastFromTeam`, `buildRunSignature`, `toPreview` |
| `lib/parseActivityMessages.ts` | Pure fn: `string[]` → `ChatroomState` |
| `lib/detectActiveAgent.ts` | Infers current speaker from activity stream |
| `lib/modelProviderBadge.ts` | Provider icon/label mapping |
| `lib/panelStyles.ts` | Shared panel CSS class helpers |
| `lib/promptDisplay.ts` | Prompt display formatting |
| `lib/sessionInsightsFormatters.ts` | Token/cost formatting |
| `lib/teamRoster.ts` | Team roster helpers including `appendDefaultTeamMember` |
| `lib/teamSharedRole.ts` | Shared role text derivation |
| `lib/utils.ts` | `cn()` — clsx + tailwind-merge utility |

---

## Backend

**Root:** `backend/`

| Path | Purpose |
|---|---|
| `api/app.py` | FastAPI app — main router, CORS middleware, `ConsensusEngine` singleton |
| `api/schemas.py` | Pydantic request/response models (`ConsultRequest`, `ConsultResponse`) |
| `api/sessions.py` | Sessions sub-router (`/api/sessions/*`) |
| `config.py` | `AppConfig` — all env vars + constants |
| `consensus/engine.py` | `ConsensusEngine` — main debate orchestrator |
| `consensus/debate_runner.py` | Executes individual debate rounds |
| `consensus/llm_clients.py` | `call_openrouter()` — OpenRouter HTTP wrapper; defines `LLMCallError` |
| `consensus/scorer.py` | `score_consensus() → (float, str)` |
| `consensus/summarizer.py` | `summarize_round() → str` |
| `consensus/validator.py` | Relevance validation of refined answer against original question |
| `consensus/models.py` | `DebateRound`, `DebateSession` dataclasses |
| `consensus/prompts.py` | All LLM prompt templates (locked — do not modify without instruction) |
| `consensus/intent.py` | Intent ambiguity detection and clarification flow |
| `consensus/attachments.py` | File and image attachment normalization; Deepseek image fallback |
| `consensus/usage_tracker.py` | Token and cost tracking per model |
| `consensus/costs.py` | Cost calculation |
| `consensus/parsing.py` | LLM output parsing (extracts revised answers, scores, etc.) |
| `consensus/activity_text.py` | Generates NDJSON activity stream text lines |
| `consensus/model_registry.py` | Model registry |
| `consensus/export_title.py` | Short session title generation for exports and sidebar |
| `storage/session_store.py` | Stateless JSON session persistence functions |
| `requirements.txt` | Python dependencies (no version pins — see inconsistencies) |

### API routes

| Method | Path | Handler |
|---|---|---|
| `GET` | `/api/health` | `health()` in `app.py` |
| `POST` | `/api/title` | `generate_title()` in `app.py` |
| `POST` | `/api/consult` | `consult()` in `app.py` |
| `POST` | `/api/consult-stream` | Streaming variant in `app.py` |
| `*` | `/api/sessions/*` | `sessions_router` from `api/sessions.py` |

---

## Python test suite

**Root:** `tests/`

| File | Covers |
|---|---|
| `conftest.py` | Shared fixtures |
| `test_engine.py` | `ConsensusEngine` |
| `test_scorer.py` | `score_consensus()` |
| `test_parsing.py` | LLM output parsing |
| `test_intent.py` | Intent detection |
| `test_validator.py` | Relevance validation |
| `test_llm_clients.py` | OpenRouter wrapper |
| `test_usage_tracker.py` | Token/cost tracking |
| `test_model_registry.py` | Model registry |
| `test_session_store.py` | JSON session persistence |
| `test_export_title.py` | Title generation |
| `test_api_contract.py` | API contract / schema tests |

---

## Frameworks and libraries — confirmed from source files

### Frontend (`package.json` + `vite.config.ts` + `index.css`)

| Library | Version | Role |
|---|---|---|
| React | 18.3 | UI framework |
| TypeScript | 5.6 | Language |
| Vite | 5.4 | Build tool / dev server (port 5173) |
| **Tailwind CSS** | **4.2** | **Styling — v4, not v3. Uses `@import "tailwindcss"`, `@theme inline`, `@variant dark`** |
| @tailwindcss/vite | 4.2 | Vite plugin for Tailwind v4 |
| @radix-ui/react-select | 2.2 | Only Radix UI primitive in use |
| lucide-react | 1.7 | Icons |
| react-markdown | 9.0 | Markdown rendering |
| jspdf | 2.5 | PDF export |
| class-variance-authority | 0.7 | Variant class construction for `ui/` components |
| clsx | 2.1 | Class name conditionals |
| tailwind-merge | 3.5 | Merge conflicting Tailwind classes |
| vitest | 2.1 | Test runner |
| **No routing library** | — | No react-router, wouter, or TanStack Router installed |
| **No global state library** | — | No Redux, Zustand, Jotai, Recoil, or MobX; all state in App.tsx |
| **No form library** | — | No React Hook Form, Formik, etc. |

### Backend (`backend/requirements.txt`)

| Library | Version pinned? | Role |
|---|---|---|
| fastapi | No | Web framework |
| uvicorn | No | ASGI server |
| httpx | No | Async HTTP client (OpenRouter calls) |
| pydantic | No | Data validation / schemas |
| python-dotenv | No | `.env` loading |
| pypdf | No | PDF text extraction from uploaded files |
| pytest | No | Test runner |
| pytest-mock | No | Mock fixtures for LLM calls in tests |

---

## Inconsistencies and flags

| # | Severity | Area | Issue |
|---|---|---|---|
| I-1 | **High** | Frontend | **No routing library installed.** PLAN_v4.0 requires `/app/new` and `/app/run/:id` routes. These are unimplementable without first adding a router (react-router-dom, TanStack Router, or wouter). |
| I-2 | **High** | Frontend | **State monolith.** All global state lives in `App.tsx` as 20+ `useState` calls. No Context, no external store. Will become a bottleneck as features grow. |
| I-3 | **High** | Backend | **Python dependencies have no version pins.** `requirements.txt` lists bare package names with no versions. Builds are not reproducible — a dependency update can silently break the app. |
| I-4 | **High** | Backend | **`uv sync` in CLAUDE.md but no `pyproject.toml` exists.** The command will fail for any contributor who follows CLAUDE.md. Only `requirements.txt` is present. |
| I-5 | **Medium** | Docs | **README ports are swapped.** README says "Frontend at localhost:8000, Backend at localhost:5173." Actual: frontend = 5173 (confirmed by `vite.config.ts`), backend = 8000. |
| I-6 | **Medium** | Frontend | **Default writer model in `App.tsx` does not match `CLAUDE.md` env vars.** `App.tsx` line 27 hardcodes `deepseek/deepseek-chat-v3.2` as the writer default. `CLAUDE.md` lists `DEFAULT_WRITER_MODEL=openai/gpt-5.4`. The UI ignores the backend env var. |
| I-7 | **Medium** | Frontend | **Tailwind v4 in use but undocumented everywhere.** `index.css` uses `@import "tailwindcss"`, `@theme inline`, `@variant dark` — all v4-only APIs. README and CLAUDE.md never mention v4. Anyone scaffolding with Tailwind v3 docs will be confused. |
| I-8 | **Medium** | Frontend | **`DebateActivityFeed.tsx` still exists alongside `ChatroomDebateView.tsx`.** The v3 plan replaced `DebateActivityFeed` with the chatroom. Both files are present — unclear if `DebateActivityFeed` is still wired up anywhere or is dead code. |
| I-9 | **Medium** | Backend | **CORS wildcard in production-bound code.** `app.py` uses `allow_origins=["*"]`. Acceptable for local dev; a security risk on any public deployment. |
| I-10 | **Low** | Frontend | **Test file colocated with source.** `frontend/src/services/api.test.ts` lives alongside `api.ts`. No consistent test directory strategy on the frontend side. |
| I-11 | **Low** | Docs | **CLAUDE.md "Current Plan" is stale.** All v3 plan deliverables are complete. The plan section in CLAUDE.md should be replaced with v4 or removed. |
| I-12 | **Low** | Frontend | **`@` alias configured in two places.** Both `vite.config.ts` (runtime) and `tsconfig.json` (type-checking) define `@/*`. They are consistent, but must be kept in sync manually if the alias is ever changed. |
| I-13 | **Low** | Backend | **Two FastAPI routers with no prefix documentation.** `app.py` has inline routes and also mounts `sessions_router`. The session route prefixes are defined in `sessions.py` and not visible from `app.py` alone. |
