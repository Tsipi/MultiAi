# PLAN.md

**Version:** v3.2 — Engagement, Threading & Growth  
**Date:** 2026-05-27  
**Scope:** Engagement polish, sidebar threading, export, auth groundwork  
**Out of scope:** Database, authentication (tracked separately below), routing library

## Feature Backlog

### V3.2.1 — Final Answer redesign (prompt) ✅ DONE
**Goal:** Make the synthesized answer feel genuinely smarter than one LLM alone.  
**Format:** Conclusion first (clear, 2–3 sentences) → What the team agreed on → Where they disagreed and why → light dry humor woven in, no emojis.  
**File:** `backend/consensus/prompts.py` — `FINAL_SYNTHESIS`  
**Risk:** Low. Prompt-only change; no schema or backend logic touched.

### V3.2.2 — Session thread view in sidebar ✅ DONE
**Goal:** Show parent → child follow-up chains visually in the sidebar instead of flat chronological list.  
**Approach:** Group sessions by `thread_id`; render child sessions indented under their parent. Existing `thread_id` / `parent_session_id` fields already carry the data.  
**Files:** `frontend/src/components/ConsensusRunsSidebar.tsx`, `AnswersPanel.tsx`  
**Risk:** Low. Display-only; no data model changes.

### V3.2.3 — CommandBar empty-state improvement ✅ DONE
**Goal:** Now that `SavedAnswerMarketingCard` is gone, the empty state (no result) relies entirely on CommandBar. Add a short tagline or hero beneath the greeting so new users understand what they're about to do.  
**Files:** `frontend/src/components/CommandBar.tsx`  
**Risk:** None.

### V3.2.4 — Authentication (sign-in / user accounts) ⏸ DEFERRED → v4
**Goal:** Gate the app behind a login so sessions are per-user, not shared on the machine.  
**Approach:** TBD — likely Supabase Auth or Clerk (JWT-based, no database needed for session storage migration yet).  
**Risk:** High. Touches backend API (auth middleware), session storage (per-user path), and all frontend fetch calls.  
**Prerequisite:** Decide on auth provider before starting.

### V3.2.5 — Export: include full debate, not just final answer ⏸ DEFERRED → v4
**Goal:** PDF/markdown export should optionally include the Director's Cut (all rounds, critiques, summaries) so users can share the full reasoning chain.  
**Files:** `frontend/src/services/exporter.ts`, `frontend/src/components/SessionPromptDownloads.tsx`  
**Risk:** Low. Export is client-side; no backend changes needed.
