# DRIFT_REPORT.md

**Generated:** 2026-05-14  
**Branch:** FinalAnswer  
**Sources:** README.md, CLAUDE.md (embedded Current Plan v3), docs/plan_archive/PLAN_v3.0.md, docs/plan_archive/PLAN_v4.0.md, filesystem scan

---

## 1. Features in README.md that CLAUDE.md does not reflect

| # | README fact | CLAUDE.md gap |
|---|---|---|
| 1.1 | **Ports are swapped in README** — it says "Frontend at localhost:8000" and "Backend at localhost:5173", the reverse of reality. | Not a CLAUDE.md gap; README is wrong, CLAUDE.md is correct. Flag README for correction. |
| 1.2 | **Product direction is "Agents Studio"** — a workspace where users define an AI team, give each member a role and model, attach context files, run the team, and inspect the debate. | CLAUDE.md overview doesn't use this framing at all. |
| 1.3 | **Auth is not implemented** — README table: "Authentication / real SaaS accounts — Not implemented yet." | CLAUDE.md overview opens with "Users sign in" — misleading, implies auth exists. |
| 1.4 | **Relevance validation is a distinct debate loop step** — README lists it as step 9: "refined answer is checked against the original question." `backend/consensus/validator.py` confirms it exists. | CLAUDE.md loop diagram omits relevance validation entirely. |
| 1.5 | **Attachment handling and image model fallback** — README describes attachment normalization (step 2) and: if image input is used, unsupported Deepseek model selections are swapped to Gemini Flash (step 3). `backend/consensus/attachments.py` confirms this exists. | CLAUDE.md never mentions attachments or the Deepseek image fallback. |
| 1.6 | **Follow-up sessions** — README lists follow-up as an implemented/in-progress feature. | CLAUDE.md doesn't mention follow-up sessions. |
| 1.7 | **Per-agent role is a known gap** — README warns: "The UI is moving toward true per-agent role/tone/model configuration, but the backend is not fully using every per-agent role/tone field yet." | CLAUDE.md doesn't acknowledge this limitation. |
| 1.8 | **Run command inconsistency** — README instructs `pip install -r backend/requirements.txt` then bare `uvicorn ...`. | CLAUDE.md uses `uv run uvicorn ...` and `uv sync`. The two documents give contradictory setup paths. |

---

## 2. Architectural facts in the code that CLAUDE.md describes incorrectly or omits

### 2.1 Backend modules — CLAUDE.md key-modules table is incomplete

Files that exist under `backend/consensus/` but are absent from the CLAUDE.md table:

| File | Purpose |
|---|---|
| `backend/consensus/validator.py` | Relevance validation (mentioned in README, missing from CLAUDE.md) |
| `backend/consensus/usage_tracker.py` | Token and cost tracking (mentioned in README, missing from CLAUDE.md) |
| `backend/consensus/costs.py` | Cost calculation |
| `backend/consensus/attachments.py` | Attachment handling and normalization |
| `backend/consensus/parsing.py` | LLM output parsing |
| `backend/consensus/activity_text.py` | Activity-stream text generation |
| `backend/consensus/model_registry.py` | Model registry |
| `backend/consensus/export_title.py` | Export title generation |

Files that exist under `backend/api/` but are absent from the CLAUDE.md table:

| File | Purpose |
|---|---|
| `backend/api/schemas.py` | Request/response schemas — referenced in CLAUDE.md N-writer section ("enforced in schemas.py") but never listed in the modules table |
| `backend/api/sessions.py` | Sessions route |

### 2.2 Frontend modules — CLAUDE.md only lists 2 frontend files; ~60 exist

CLAUDE.md's "Key modules" table lists only `frontend/src/App.tsx` and `frontend/src/services/api.ts`. The actual codebase contains:

- `frontend/src/lib/` — 10 utility/helper files including `consultHelpers.ts`, `parseActivityMessages.ts`, `detectActiveAgent.ts`, `sessionInsightsFormatters.ts`, `teamRoster.ts`, `teamSharedRole.ts`
- `frontend/src/data/` — `experts.ts`, `models.ts`
- `frontend/src/types.ts`
- `frontend/src/components/` — 50+ component files

None of the above are mentioned in CLAUDE.md.

### 2.3 No `pyproject.toml` exists

CLAUDE.md's setup section uses `uv sync`, which requires a `pyproject.toml` or `uv.lock`. No `pyproject.toml` was found in the repo root. The only Python dependency file is `backend/requirements.txt`. The `uv sync` command may fail unless an unlisted lockfile exists.

### 2.4 Frontend dependency stack not documented

`frontend/package.json` reveals key dependencies not mentioned anywhere in CLAUDE.md:

| Package | Version | Significance |
|---|---|---|
| `tailwindcss` | ^4.2.2 | Tailwind v4, not v3 — different config format |
| `@tailwindcss/vite` | ^4.2.2 | Vite plugin for Tailwind v4 |
| `@radix-ui/react-select` | ^2.2.6 | Radix UI primitives |
| `jspdf` | ^2.5.2 | PDF export |
| `react-markdown` | ^9.0.1 | Markdown rendering |
| `lucide-react` | ^1.7.0 | Icon library |
| `vitest` | ^2.1.8 | Test runner |

### 2.5 CLAUDE.md debate loop diagram omits three real steps

The diagram in CLAUDE.md is simplified to the point of being incomplete. Missing:

1. Attachment normalization pass before the loop (step 2 in README)
2. Deepseek/image model fallback logic (step 3 in README)
3. Relevance validation after refinement (step 9 in README)

---

## 3. PLAN items status

There is **no PLAN.md** at the repo root. The "Current Plan" section is embedded at the bottom of CLAUDE.md and matches `docs/plan_archive/PLAN_v3.0.md` (Slack-Style Chatroom, authored 2026-04-09). A newer `PLAN_v4.0.md` (authored 2026-04-19) exists in `docs/plan_archive/` and is not reflected in CLAUDE.md at all.

### 3.1 V3 plan items (embedded in CLAUDE.md) — ALL COMPLETED

Every component and file listed in the v3 plan was found on disk:

| Item | Status |
|---|---|
| `ChatroomDebateView.tsx` | ✅ Completed — file exists |
| `ChatMessage.tsx` | ✅ Completed — file exists |
| `ScoreBadge.tsx` | ✅ Completed — file exists |
| `RoundDivider.tsx` | ✅ Completed — file exists |
| `TypingRow.tsx` | ✅ Completed — file exists |
| `ChannelHeader.tsx` | ✅ Completed — file exists |
| `PinnedAnswer.tsx` | ✅ Completed — file exists |
| `ConsensusReachedBanner.tsx` | ✅ Completed — file exists |
| `frontend/src/lib/parseActivityMessages.ts` | ✅ Completed — file exists |
| Modify `ChatPanel.tsx` | ✅ Completed — file exists |
| Modify `frontend/src/index.css` | ✅ Completed — file exists |

**The entire v3 plan is complete. The "Current Plan" section in CLAUDE.md is stale and should be replaced or archived.**

### 3.2 V4 plan items (docs/plan_archive/PLAN_v4.0.md, 2026-04-19) — not in CLAUDE.md

V4 plan is not referenced in CLAUDE.md. Its phases and estimated status from file scan:

| Phase | Goal | Status |
|---|---|---|
| Phase 1 | New Run / empty-state UX — top-nav "New Run" button, `/app/new` route | `TopNav.tsx` exists; actual New Run implementation not verified |
| Phase 2 | Team templates — template chips under prompt, template drawer | No `TemplateDrawer.tsx` or `TemplateCard.tsx` found — **pending** |
| Phase 3 | Backend persistence — move from JSON files to a real DB | No DB found; JSON-only — **pending** |
| Phase 4 | Public sharing — public slugs, shareable answer pages | No sharing routes found — **pending** |
| Phase 5 | SEO system — SSG/SSR public pages, sitemaps | No SSR setup found — **pending** |

> **Conflict:** CLAUDE.md explicitly says "Do not add a database — JSON file storage only." PLAN_v4.0.md Phase 3 proposes adding a real database. These are in direct conflict. Phase 3 is blocked by CLAUDE.md unless CLAUDE.md is updated first.

---

## 4. Items in CLAUDE.md with "preserve exactly" intent — listed verbatim

CLAUDE.md contains no explicit "preserve exactly" keyword. The following passages carry equivalent protective language and should be treated as locked:

**A. Context management rule (marked "critical"):**
> Rolling context is **append-only summaries**, never full transcripts:
> ```python
> rolling_context += f"\n[Round {round_num} summary]: {round_summary}"
> ```
> This string — not the full answer/critique text — is passed to LLMs in subsequent rounds.

**B. Prompt templates protection:**
> Do not modify scorer, summarizer, or debate prompt templates without explicit instruction — wording changes affect consensus behavior. Templates live in `backend/consensus/prompts.py`.

**C. Model routing rule:**
> - Scorer: always `deepseek/deepseek-chat-v3.2`
> - Summarizer: always `deepseek/deepseek-chat-v3.2`
> - Never route scorer/summarizer to user-selected models

**D. What NOT to do (full list):**
> - Do not pass full round transcripts to subsequent rounds — rolling summaries only
> - Do not alter scorer or summarizer prompts without explicit instruction
> - Do not return raw dicts from engine functions
> - Do not add a database — JSON file storage only
> - Do not build a CLI entrypoint — React UI + backend API only
> - Do not use `print()` for logging

**E. Token budget table (enforced values):**
> | Call | Target |
> |------|--------|
> | Round 1 answer / critique / refinement / synthesis | ≤ 800 tokens each |
> | Summarizer | ≤ 200 tokens (`max_tokens=200` enforced) |
> | Scorer | ≤ 100 tokens (600-char excerpts only) |

---

## Summary

| Area | Finding |
|---|---|
| README ports | Swapped — README bug, CLAUDE.md is correct |
| Auth state | README says unimplemented; CLAUDE.md overview implies it exists |
| Debate loop | CLAUDE.md diagram omits relevance validation and attachment steps |
| Backend modules | 10 backend files missing from CLAUDE.md key-modules table |
| Frontend modules | ~50 components and 10 lib files unacknowledged in CLAUDE.md |
| pyproject.toml | Missing from repo; `uv sync` in CLAUDE.md may fail |
| V3 plan | **Entirely complete** — all 11 deliverables exist on disk |
| V4 plan | Not in CLAUDE.md; Phase 1 possibly done, Phases 2–5 pending |
| DB constraint conflict | CLAUDE.md says no DB; PLAN_v4.0 Phase 3 requires one — explicit conflict |
