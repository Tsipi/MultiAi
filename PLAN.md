# PLAN.md

**Version:** v3.1 — Codebase Cleanup & Documentation Sync  
**Date:** 2026-05-14  
**Scope:** Frontend state refactor + dead code removal + CLAUDE.md accuracy update  
**Out of scope:** Backend changes, routing, V4 features, database

---

## Goals

1. Remove dead component (`DebateActivityFeed.tsx`)
2. Update `CLAUDE.md` to accurately reflect the codebase as it exists today
3. Refactor `App.tsx` from a 445-line state monolith into clean custom hooks

---

## Phase 1 — Dead code removal

**Risk:** None. File has zero imports anywhere in the codebase.

| Task | File | Action |
|---|---|---|
| 1.1 | `frontend/src/components/DebateActivityFeed.tsx` | Delete — confirmed no imports in any `.tsx` or `.ts` file |

---

## Phase 2 — CLAUDE.md accuracy update

**Risk:** Docs only. No code changes.

| Task | Section | Change |
|---|---|---|
| 2.1 | Project Overview | Remove "Users sign in" — replace with "Auth not yet implemented" |
| 2.2 | Debate loop diagram | Add three missing steps: attachment normalization, Deepseek→Gemini image fallback, relevance validation |
| 2.3 | Key modules table | Add all 10 missing backend files (`validator.py`, `usage_tracker.py`, `costs.py`, `attachments.py`, `parsing.py`, `activity_text.py`, `model_registry.py`, `export_title.py`, `api/schemas.py`, `api/sessions.py`) |
| 2.4 | Key modules table | Add frontend entries: `src/lib/*`, `src/data/*`, `src/hooks/*`, `src/services/*`, `src/types.ts` |
| 2.5 | Coding standards | Add Tailwind v4 note: CSS uses `@import "tailwindcss"`, `@theme inline`, `@variant dark` — v4 APIs, not v3 |
| 2.6 | Coding standards | Add note: no routing library (single SPA, all state in App.tsx / custom hooks); no global state library |
| 2.7 | Setup / Commands | Clarify: Python deps are in `requirements.txt` (no version pins); `uv run` works with it; no `pyproject.toml` exists |
| 2.8 | Current Plan section | Remove v3 plan body — replace with one line: "v3 (Slack-style chatroom) complete. Active plan: see PLAN.md." |

---

## Phase 3 — App.tsx state refactor

**Goal:** Extract the 26 `useState` calls into 6 custom hooks grouped by concern. App.tsx keeps the orchestration functions (`runConsult`, `executeConsult`, `runFollowup`, `selectSession`, `removeSession`) because they cross multiple state slices. It becomes a ~150-line orchestrator instead of a 445-line monolith.

**Risk:** Medium. Functional behavior must stay identical. No new features.

### State map — what lives where today

```
App.tsx (26 useState, 5 useEffect, 1 useMemo, 1 useRef)

Group A — Compose form (4 state + 2 effects)
  form, team, attachments, activeCast
  Effects: sync team roles when form.role changes
           auto-swap Deepseek→Gemini on image attachment

Group B — Session history (5 state + 1 effect)
  history, selectedId, resultsById, castBySession, sessionTitles
  Effect: load session list on mount

Group C — Clarification (5 state)
  clarificationPrompt, clarificationReason, clarificationOptions,
  clarificationChoice, clarificationOtherText

Group D — Follow-up (5 state)
  followupOpen, followupInstruction, followupConstraints,
  followupSeed, followupError

Group E — Toast notification (1 state + 1 effect)
  toast
  Effect: auto-clear after 3500ms

Group F — UI panels (3 state + 1 effect)
  advancedOpen, insightsOpen, runsSidebarOpen
  Effect: persist runsSidebarOpen to localStorage

Stays in App.tsx
  result, loading, activity  ← live debate run state, touched by multiple handlers
  mainSessionPanelRef        ← DOM ref for scroll
  dark / toggleDark          ← already in useDarkMode (unchanged)
```

### New hook files

| File | Owns | Returns |
|---|---|---|
| `src/hooks/useComposeForm.ts` | Group A | `form`, `setForm`, `team`, `setTeam`, `attachments`, `setAttachments`, `activeCast`, `setActiveCast` |
| `src/hooks/useSessionHistory.ts` | Group B | `history`, `setHistory`, `selectedId`, `setSelectedId`, `resultsById`, `setResultsById`, `castBySession`, `setCastBySession`, `sessionTitles`, `setSessionTitles` |
| `src/hooks/useClarification.ts` | Group C | `clarificationPrompt`, `clarificationReason`, `clarificationOptions`, `clarificationChoice`, `clarificationOtherText`, `setClarificationPrompt`, `setClarificationReason`, `setClarificationOptions`, `setClarificationOtherText`, `chooseClarification`, `clearClarification` |
| `src/hooks/useFollowup.ts` | Group D | `followupOpen`, `followupInstruction`, `followupConstraints`, `followupSeed`, `followupError`, setters, `openFollowup`, `clearFollowupState` |
| `src/hooks/useToast.ts` | Group E | `toast`, `setToast` |
| `src/hooks/usePanelState.ts` | Group F | `advancedOpen`, `setAdvancedOpen`, `insightsOpen`, `setInsightsOpen`, `runsSidebarOpen`, `setRunsSidebarOpen` |

### What stays in App.tsx after refactor

```
const [dark, toggleDark] = useDarkMode();
const { form, setForm, team, setTeam, attachments, setAttachments, activeCast, setActiveCast } = useComposeForm();
const { history, setHistory, selectedId, setSelectedId, resultsById, setResultsById, castBySession, setCastBySession, sessionTitles, setSessionTitles } = useSessionHistory();
const { clarification..., chooseClarification, clearClarification } = useClarification();
const { followup..., openFollowup, clearFollowupState } = useFollowup();
const { toast, setToast } = useToast();
const { advancedOpen, setAdvancedOpen, insightsOpen, setInsightsOpen, runsSidebarOpen, setRunsSidebarOpen } = usePanelState();

// Live run state (stays here — mutated by executeConsult)
const [result, setResult] = useState<ConsultResult | null>(null);
const [loading, setLoading] = useState(false);
const [activity, setActivity] = useState<string[]>([]);
const mainSessionPanelRef = useRef<HTMLDivElement | null>(null);

// Derived values (unchanged)
const displayResult = ...
const panelCast = ...
const runSignature = ...
const followupChangedSinceOpen = ...

// Orchestration functions (unchanged, stay here)
runConsult / executeConsult / runFollowup / resendQuestion
selectSession / removeSession / startNewQuestion / adjustFollowupTeam
```

### Build order for Phase 3

1. Write all 6 hooks (extract state + effects, no logic changes)
2. Update App.tsx to use the hooks (swap `useState` calls one group at a time)
3. Verify app runs — no visible behavior change

---

## Files changed summary

| File | Action | Phase |
|---|---|---|
| `frontend/src/components/DebateActivityFeed.tsx` | Delete | 1 |
| `CLAUDE.md` | Update (docs only) | 2 |
| `frontend/src/hooks/useComposeForm.ts` | Create | 3 |
| `frontend/src/hooks/useSessionHistory.ts` | Create | 3 |
| `frontend/src/hooks/useClarification.ts` | Create | 3 |
| `frontend/src/hooks/useFollowup.ts` | Create | 3 |
| `frontend/src/hooks/useToast.ts` | Create | 3 |
| `frontend/src/hooks/usePanelState.ts` | Create | 3 |
| `frontend/src/App.tsx` | Refactor | 3 |

**Total new files:** 6 hooks  
**Deleted files:** 1  
**Modified files:** 2 (CLAUDE.md, App.tsx)

---

## Done criteria

- [ ] `DebateActivityFeed.tsx` deleted, no broken imports
- [ ] CLAUDE.md loop diagram shows attachment + validation steps
- [ ] CLAUDE.md modules table lists all backend + frontend files
- [ ] CLAUDE.md v3 plan section replaced with archive pointer
- [ ] `npm run build` passes with no TypeScript errors
- [ ] App behavior identical before and after hook extraction (manual spot-check: run a consult, load a session, clarification flow, follow-up)
- [ ] Each new hook file has a single clear concern — no cross-hook imports
