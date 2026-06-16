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
| `backend/api/app.py` | FastAPI app — routes, CORS, engine singleton |
| `backend/api/schemas.py` | Pydantic request/response models (`ConsultRequest`, `ConsultResponse`) |
| `backend/api/sessions.py` | Sessions sub-router (`/api/sessions/*`) |
| `backend/storage/session_store.py` | Stateless JSON session persistence |

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
| `frontend/src/lib/consultHelpers.ts` | `mergeTeamIntoPayload`, `selectCastFromTeam`, `buildRunSignature` |
| `frontend/src/lib/parseActivityMessages.ts` | Pure fn: `string[]` → `ChatroomState` |
| `frontend/src/lib/detectActiveAgent.ts` | Infers current speaker from activity stream |
| `frontend/src/lib/utils.ts` | `cn()` — clsx + tailwind-merge |
| `frontend/src/data/experts.ts` | Team member presets and `createDefaultTeam()` |
| `frontend/src/data/models.ts` | Model options list |
| `frontend/src/services/api.ts` | Backend fetch wrapper |
| `frontend/src/services/attachments.ts` | File/attachment handling |
| `frontend/src/services/pdf/exporter.ts` | Export (markdown/PDF) |

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

### Branch: `PLAN_v4.2` — last updated 2026-06-14

### v4.2 (Phases 4.2.1–4.2.3) COMPLETE & COMMITTED
- `31a451c` polish: improve PDF export with page headers, footers, and bold wrapping (Phase 4.2.1)
- `598d25a` feat: add public sharing for consensus runs (Phase 4.2.2)
- `458cdcf` feat: add full debate transcript to exports (Phase 4.2.3)
- `e9b3189` fix: widen color/margin parameter types in PDF helper modules
- Verified on final HEAD `e9b3189`: `pytest` 32/33 (1 pre-existing unrelated failure), `tsc --noEmit` clean, `npm run build` clean, `vitest run` 4/4

### PDF export visual polish — rounds 2 & 3 COMPLETE (uncommitted)
Round 2 (6 fixes, from PDF screenshot + template-tooltip review): header top margin (`pdfHeader.ts`), smaller `h1` title (`pdfTheme.ts`), "Team Members" section title in brand violet, per-participant template role summary via new `roleSummaryFromText()` (`templates.ts`, reused in `TemplateShortcutRow.tsx`), vertical participants list redesign (`pdfParticipants.ts`), right-aligned/colored Score+round+cost meta line (`exporter.ts`).

Round 3 (5 more fixes from a follow-up screenshot):
1. "Exported {date}" moved into the page header, right-aligned above the divider (`drawPageHeader` in `pdfHeader.ts` gains optional `exportDate` param, first page only).
2. Round-count/cost in `drawMeta` now use new `PDF.colors.gray` (`#616B7B`, matches app's `--muted-foreground`) instead of the purple-toned `PDF.colors.muted`.
3. Participants section title is now the active team template's name (e.g. "Programmer Team") when one is active, falling back to "Team Members" — new `ExportData.teamName`, passed from `ChatPanel.tsx`'s `runExport` via `props.teamTemplateName`.
4. Fixed missing per-participant role summaries: `runExport` now builds `participants` from `cast` (accurate for the viewed session) and looks up each person's template role text via `TEAM_TEMPLATES.find(t => t.name === teamTemplateName)`, instead of the possibly-stale `team` state.
5. "Role" and "Prompt" section labels now render via new shared `drawSectionLabel()` helper (`pdfUtils.ts`) — bold, brand-violet, same styling as "Team Members" — instead of markdown `## ` headings. "Answer" heading unchanged.

Files touched (rounds 2+3 combined): `pdfTheme.ts`, `pdfUtils.ts`, `pdfHeader.ts`, `pdfParticipants.ts`, `exporter.ts`, `templates.ts`, `TemplateShortcutRow.tsx`, `ChatPanel.tsx`.

Round 4 (color cleanup): removed `PDF.colors.muted` (`#6E5AA0`), `soft` (`#A08CC8`), and `providerFallback` (`#645A82`) from `pdfTheme.ts` entirely — all 5 usages (Exported-date label, role-summary text, page numbers, provider-badge fallback color) now use `PDF.colors.gray` (`#616B7B`) for a single consistent gray across the PDF.

Round 5: `pdfProvider()` in `pdfParticipants.ts` now mirrors `ModelProviderIcon.tsx`'s `resolveProvider()` badge colors instead of separately-invented hexes: OpenAI `#059669` (emerald-600), Claude `#B45309` (amber-700), Gemini `#3B82F6` (blue-500, gradient start), DeepSeek `#2563EB` (blue-600); Llama/Mistral were already matching (`#4F46E5`/`#EA580C`).

Round 6: removed `PDF.colors.critic` (`#3B82F6`) — Critic avatar fallback circle now uses `PDF.colors.criticAccent` (`#0284C7`, sky-600, same as the "CRITIC" duty label, matching the in-app tooltip). `divider`/`dividerStrong` changed from invented lavender hexes to standard Tailwind `violet-100`/`violet-200` (`#EDE9FE`/`#DDD6FE`), consistent with `brand`=violet-700 and `writer`=violet-600 already in the theme. Also fixed a Round-3 regression in `ChatPanel.tsx`'s `runExport`: `roleSummaryFor` now checks the live `team` member's own `.role` first (carries full template text for fresh template selections) before falling back to the `activeTemplate` lookup (for viewed/saved sessions) — previously the template-only lookup could silently return no role summary (e.g. "Creative director" missing for Marketing Campaign Team's writer) when `teamTemplateName` didn't resolve.

Verified: `npx tsc --noEmit` clean, `npm run build` clean (only pre-existing >500kB chunk warning), `npx vitest run` 4/4 passed. Not yet verified visually — ask user to export a real PDF (canvas/jsPDF output can't be screenshot-tested headlessly).

### Avatar resolution bug fix (uncommitted)
User reported: "John" (Writer) and "Sandy" (Critic) showed the SAME avatar (John's photo) in both the Team Members editor and the PDF export, for a Marketing-Campaign-Team-derived session.

Root cause: `App.tsx`'s `panelCast` useMemo (used when viewing a saved session with no `castBySession` snapshot, e.g. after a page reload) tried to recover each critic's name/avatar by matching `res.model_critics[i]` against the *current* `team` state's member models. When no model matched (common — the live team often uses different models than the viewed session), it fell back to `writerMember.avatar` for that critic, i.e. an unmatched critic borrowed the writer's photo.

Fix: replaced the model-matching fallback with name-based resolution via `findFaceByName()` (`experts.ts`), using the session's own `writer_names`/`critic_names` (non-optional on `ConsultResult`) as the source of truth for both writer and critics — every displayed name now maps to its own canonical avatar via `FACE_OPTIONS`, never borrowed from someone else. File: `App.tsx` (added `findFaceByName` import; rewrote the `panelCast` useMemo body).

Verified: `npx tsc --noEmit` clean, `npm run build` clean, `npx vitest run` 4/4 passed. Not yet visually verified.

### PDF participants section — round 7 (uncommitted)
3 fixes from a "Tourist Planner Team" PDF screenshot:
1. Template icon (the same Lucide icon shown in `TemplateShortcutRow`'s `TEMPLATE_ICONS` map, e.g. `Plane` for Tourist Planner) now renders to the left of the participants section title, in brand violet — only when a template is active; "Team Members" (no template) gets no icon. `TEMPLATE_ICONS` moved from `TemplateShortcutRow.tsx` into `templates.ts` (exported) so `exporter.ts` can reuse it; `TemplateShortcutRow.tsx` now imports it from there.
2. The active template's `description` (e.g. "Travel itineraries, where to stay, day trips, and practical logistics.") now renders below the section title, in `PDF.colors.gray`.
3. Each participant row now shows the specific model label (from `MODEL_OPTIONS`, e.g. "OpenAI 5.4", "Gemini 2.5 Flash") right after the WRITER/CRITIC role badge, in gray — in addition to the existing colored provider badge on the right.

New file `pdfIcons.tsx`: `loadIconDataUrl(Icon, color, sizePx)` renders a Lucide icon to a PNG data URL via `react-dom/server`'s `renderToStaticMarkup` + canvas (same pattern as avatar/logo loading), for use with jsPDF's `addImage`. `drawSectionLabel()` (`pdfUtils.ts`) gained an optional `xOffset` param to make room for the icon. `drawParticipants()` (`pdfParticipants.ts`) gained `sectionDescription?`/`iconDataUrl?` params; `exporter.ts`'s `downloadPdf` resolves both from `data.teamName` via `TEAM_TEMPLATES`/`TEMPLATE_ICONS`.

Files touched: `templates.ts`, `TemplateShortcutRow.tsx`, `pdfIcons.tsx` (new), `pdfUtils.ts`, `pdfParticipants.ts`, `exporter.ts`.

Verified: `npx tsc --noEmit` clean, `npm run build` clean (chunk warning grew slightly, ~993kB, due to `react-dom/server` now being bundled — expected), `npx vitest run` 4/4 passed. **Visually confirmed by user** — "it looks much better", with 2 follow-up tweaks (round 8).

### PDF participants section — round 8 (uncommitted)
2 fixes from user feedback on round 7's "Tourist Planner Team" PDF export:
1. Section description now comes from the active template's **writer role's description** (the part after "—" in the writer member's `role` text, e.g. "designs itineraries, recommends where to stay, and maps day trips by region and transport") instead of the template's short `description` field (e.g. "Travel itineraries, where to stay, day trips, and practical logistics."), and renders at 9.5pt (up from 8.5pt) with line-wrapping via `doc.splitTextToSize`. New exported helper `roleDescriptionFromText()` in `templates.ts` (counterpart to `roleSummaryFromText()`, returns the text after the em-dash instead of before it). Falls back to `activeTemplate.description` if the writer's role has no "—" pattern.
2. Removed the gray model-name label (from `MODEL_OPTIONS`) that round 7 added next to the WRITER/CRITIC badge. The colored provider badge (OpenAI/Claude/Gemini/etc.) moved from the row's right edge to directly below each participant's role-summary line, left-aligned under their name — `drawProviderBadge()` now takes an `x`/`y` (left-aligned) instead of `rightEdge`. Row height increased 32pt → 38pt to fit the extra line. `pageW` param removed from `drawParticipantText` (no longer needed for right-alignment); `MODEL_OPTIONS` import removed from `pdfParticipants.ts`.

Files touched: `templates.ts` (new `roleDescriptionFromText`), `exporter.ts` (computes `sectionDescription` from writer role), `pdfParticipants.ts` (description font/wrapping, badge repositioning, row height).

Verified: `npx tsc --noEmit` clean, `npm run build` clean, `npx vitest run` 4/4 passed. Not yet visually verified.

### PDF participants section — round 9 (uncommitted)
4 more fixes from user feedback (round 8 not yet visually checked when these arrived):
1. More vertical space between team members: single-column row height 38pt → 44pt; new 3-column grid (see #3) uses 50pt.
2. Section description's first letter is now capitalized via new `capitalizeFirst()` helper in `exporter.ts` (applied to whichever text wins — writer-role description or template `description` fallback).
3. **3-column grid layout** for >3 participants: `drawParticipants()` (`pdfParticipants.ts`) now computes `numColumns = participants.length > 3 ? 3 : 1`, splits `contentWidth(doc)` into `numColumns` columns with a 16pt gap, and lays out participants in a `col = i % numColumns` / `row = Math.floor(i / numColumns)` grid. `drawParticipantText()` gained a `maxTextWidth` param so the role-summary text wraps (`doc.splitTextToSize`) within its column instead of the full page width; the provider badge's y-position is now derived from `summaryLines.length` (`y + 14 + summaryLines.length * 9`) so it sits correctly below 1- or 2-line summaries. ≤3 participants still render as a single column (unchanged visually apart from the new row height).
4. "Role" section (label + `data.role` markdown) is now **skipped entirely** when a team template is active (`activeTemplate` truthy) — the writer-role description already shown under the participants title makes it redundant. `activeTemplate` lookup moved from inside the `participants` block to top-of-function scope in `downloadPdf()` so both the participants block and this check can use it.

Files touched: `exporter.ts` (`activeTemplate` hoisted, `capitalizeFirst`, conditional "Role" section), `pdfParticipants.ts` (grid layout, text wrapping, badge y-position).

Verified: `npx tsc --noEmit` clean, `npm run build` clean, `npx vitest run` 4/4 passed. Not yet visually verified.

### No-emoji prompt constraint (uncommitted)
User asked: "I want to give all prompt both in the Final answer and in the full debate to ask the llm not to add any emojis at all." Added `- Do not use emojis.` to the Hard constraints list of `WRITER_INITIAL`, `CRITIQUE`, and `WRITER_REFINEMENT` in `backend/consensus/prompts.py` — these drive the "Writer's Answer"/"Critique"/refinement content shown in the "Full Debate" PDF/markdown export section. `FINAL_SYNTHESIS` already had "No emojis." in its hard constraints (used for the pinned "Answer"/"Final answer" section) — left unchanged.

Deliberately NOT touched: summarizer/scorer prompts (per CLAUDE.md, locked without explicit instruction — "Round Summary" in the Full Debate export comes from the summarizer, which the user didn't explicitly call out).

Verified: `uv run pytest tests/` → 32 passed, 1 failed (`test_load_legacy_session_without_list_fields`, pre-existing/unrelated per earlier session notes).

### Full Debate PDF/markdown export — round 10 (uncommitted)
User feedback (screenshots of an exported "Full Debate" PDF section and the in-app chatroom Full Debate view): "1. When Exporting the full debate please make titles of 'Full debate' same color as prompt and answer 2. Make the round look like in the app full debate 3. Each member team add it's avatar image title, role and llm badge on the full debate pdf export."

1. "Full Debate" heading now uses `drawSectionLabel()` (brand violet, bold) — same styling as "Role"/"Prompt"/"Answer" — instead of a markdown `## ` heading.
2. & 3. Each debate message (the writer's answer and each critic's critique) now renders with a chat-style header mimicking the in-app chatroom bubble: avatar image, first name, WRITER/CRITIC role badge (violet/sky, matching the in-app tooltip colors), and a colored LLM provider badge — via new `drawMessageHeader()` in `pdfParticipants.ts`. "Round N" and "Round Summary" headings are unchanged (plain markdown headings) — the in-app pill-style round divider ("─ Round N of M ─") was deliberately NOT replicated, to avoid over-engineering; flag to user if they want that too.

New shared types: `ExportDebateMessage` (`{ name, role: "Writer"|"Critic", model, avatar, text }`, `pdfParticipants.ts`) and a restructured `ExportDebateRound` (`{ round_num, writerMessage, criticMessages: ExportDebateMessage[], summary }`, `exporter.ts`, replacing the old `{ answer, critique }` shape). `ChatPanel.tsx`'s `runExport` now builds `writerMessage`/`criticMessages` per round using the existing `splitCritiques()` helper, `cast`, `result.writer_names`/`critic_names`/`model_critics`, `MODEL_OPTIONS`, and `DEBATE_SYSTEM_AVATAR` as the critic-avatar fallback — mirroring the in-app "Director's Cut" panel's per-critic resolution logic. `buildMarkdownBody()` (markdown export) updated to match: each message renders as `**Name (Role)**` followed by its text.

Exported several previously-private helpers from `pdfParticipants.ts` (`drawAvatar`, `drawProviderBadge`, `pdfProvider`, `loadCircularAvatar`, `PdfProvider` type) and `pdfMarkdown.ts` (`ensurePageSpace`) so `drawMessageHeader` could reuse them without duplication.

Files touched: `exporter.ts`, `pdfParticipants.ts`, `pdfMarkdown.ts`, `ChatPanel.tsx`.

Verified: `npx tsc --noEmit` clean, `npm run build` clean (~995kB chunk warning, expected), `npx vitest run` 4/4 passed, `uv run pytest tests/` 32/33 (same pre-existing unrelated failure). Not yet visually verified.

### PDF participants grid — round 11 (uncommitted)
User: "make the team spread into 3 columns even if only 3 team members on pdf". `drawParticipants()` (`pdfParticipants.ts`) — `numColumns` condition changed from `participants.length > 3 ? 3 : 1` to `participants.length >= 3 ? 3 : 1`, so exactly 3 participants now use the 3-column grid (50pt row height) instead of falling back to the single-column layout (44pt). 1–2 participants unchanged (single column).

Verified: `tsc --noEmit` clean, `npm run build` clean, `npx vitest run` 4/4 passed.

### Phase 4.2.4 - per-agent writer and critic roles (complete, uncommitted)
Previously, the team editor stored a separate `role`/Expert focus for every member, but `mergeTeamIntoPayload()` sent only the writer's role as the shared API `role`. The backend then formatted every writer and critic prompt with that same shared role, so critic-specific focuses were visible in the UI but did not affect the debate.

Implemented position-aligned `writer_roles` and `critic_roles` arrays end to end:
- `mergeTeamIntoPayload()` sends roles in the same order as `writers`/`critics`.
- `ConsultRequest`, `ConsultResponse`, `DebateSession`, API routes, normalized frontend results, and DB team/session persistence retain the role arrays.
- `run_rounds()` applies each writer role to its initial draft and each critic role to its critique. The primary writer's role is used for refinement, repair, and final synthesis.
- Empty or missing role entries fall back to the existing shared `role`, preserving old API clients and saved-session behavior.
- Saved-session team restoration and follow-up payloads preserve the saved role arrays, unless the user explicitly changes the team/settings before starting the follow-up.
- Added `frontend/src/lib/consultHelpers.test.ts` and `tests/test_debate_runner_roles.py` for role-array alignment and shared-role fallback.

Files touched: `frontend/src/App.tsx`, `frontend/src/types.ts`, `frontend/src/lib/consultHelpers.ts`, `frontend/src/services/api.ts`, `backend/api/schemas.py`, `backend/api/app.py`, `backend/consensus/models.py`, `backend/consensus/engine.py`, `backend/consensus/debate_runner.py`, `backend/storage/db_session_store.py`, plus focused tests.

Verified: `npx tsc --noEmit` clean; `npm test` 6/6 passed; `npm run build` clean (existing >500kB chunk warning); focused backend role/engine tests 3/3 passed; `python -m compileall -q backend tests` clean; broader backend suite excluding API/sharing tests 26/27 passed, with the same pre-existing `test_load_legacy_session_without_list_fields` failure. API/sharing test collection remains blocked in this environment by missing `fastapi_users`.

### Next steps
- Await user's visual verification of: (a) PDF export rounds 3-6 changes, (b) the avatar fix (reload the page, view a saved "Marketing Campaign Team" session, confirm Sandy/Christy show their own avatars in both the Team Members editor and the PDF export), (c) round 8's tweaks (writer-role description text in gray below the template title, provider badge below each member's role summary), (d) round 9 (more row spacing, capitalized description, 3-column grid for >3 participants — try a session with 4+ team members, and "Role" section gone when a template is active) — export PDFs for a "Tourist Planner Team" session (3 members) and a 4+-member session to check, (e) the no-emoji prompt change — run a live debate and confirm no emojis appear in the Writer's Answer/Critique/Refinement/Final Answer, and (f) round 10 — export a multi-round, multi-critic session PDF (with "Include full debate" checked) and confirm "Full Debate" title is brand violet, and each writer/critic message shows its avatar, name, role badge, and LLM provider badge
- Once confirmed, v4.2 work + this bugfix are fully done — next: v5.0 (Next.js migration + SEO) per `PLAN.md`

## Workflow Rules
- Before starting each plan section, STOP and wait for explicit "proceed" confirmation
- NEVER run git add, git commit, git revert, or git reset without explicit user approval
- When ready to commit, propose the commit message and wait for confirmation before executing
- Treat all git operations as requiring manual approval
