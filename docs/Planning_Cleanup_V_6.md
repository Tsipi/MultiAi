Create a new file at docs/Planning_Cleanup_V_6.md. This will be the single
source of truth for a multi-session cleanup of PLAN.md, ROADMAP.md, and
CLAUDE.md. Do not edit those three files yet — only create this tracker.

Populate it with exactly this content:

# Planning Docs Reconciliation Tracker (Planning_Cleanup_V_6)
Created to fix drift between PLAN.md, ROADMAP.md, CLAUDE.md, and the real
state of docs/plan_archive/. Work through one section at a time, check off
items as [x] when done, and stop at the end of each section for review.
Delete this file once all four sections are complete.

## Status vocabulary (use these four words only, everywhere)
- Done = fully complete
- In Progress = partially complete / actively being worked
- Blocked = paused, waiting on a decision or approval
- Planned = not started
ROADMAP.md section mapping: Done -> "Shipped" section, In Progress ->
"Current" section, Blocked or Planned -> "Planned" section.

## Confirmed decisions (do not re-derive, just apply)
- v6.0 phases 6.0.4 and 6.0.5 are BOTH Done (trust PLAN_v6.0.md's section
  headers, not its stale top status line). v6.0 overall status: Done.
- v6.1, v6.2, v6.3, v6.4 each get their own separate row/entry in PLAN.md
  and ROADMAP.md — do not fold into a v6.0 umbrella.
- v4.4 phase 4.4.6 manual verification is now Done (user confirmed all
  three manual checks completed). v4.4 overall status: Done.
- CLAUDE.md Key modules table: keep individual rows for hooks/lib/data/
  pages files (add missing ones: useConsultRun.ts, data/templates.ts, the
  lib/*.ts files, the pages/*.tsx files). For component folders currently
  missing entirely (compose/, debate/, drawers/, layout/, session/, team/,
  ui/) and services/pdf/, add ONE summary row per folder (purpose + 2-3 key
  files), not a per-file listing.
- PLAN.md keeps its status column in BOTH the summary table and per-version
  detail tables (do not remove it) — just correct the values so they agree,
  using the status vocabulary above. Add a governance line near the top of
  PLAN.md: "Detail table is authoritative for phase-level status; update
  the summary row in the same edit whenever a phase status changes."
- TODO.md is a separate, personal running notes file — NOT part of the
  PLAN.md/ROADMAP.md workflow, and gets no pointer added to either file.
  Just rename its internal title from "Version 4.3" to "Cleanup and
  Consistency Fixes — Ongoing", and add a note under the title: "Items
  below were added after v4.3 shipped, used as a rough timestamp reference.
  This is a personal running list, separate from PLAN.md/ROADMAP.md"

## Section 1 — PLAN.md  [x]
- [x] Fix top "Active roadmap" table: v5.0 -> Done
- [x] Fix top table: v6.0 -> Done
- [x] Fix top table: v4.4 -> Done
- [x] Add v5.1 row (top table + version archive table) -> Done
- [x] Add v5.2 row -> Blocked (do not implement until approved)
- [x] Add v6.1 row -> Done
- [x] Add v6.2 row -> In Progress (6.2.7 deferred, 6.2.8 blocked, 6.2.9 in
      progress — note sub-item detail in the row)
- [x] Add v6.3 row -> In Progress (6.3.1 done, 6.3.2 not started)
- [x] Add v6.4 row -> Planned
- [x] Add governance line about detail table being authoritative
- [x] Show diff, wait for confirmation before moving to Section 2

Note (not on the checklist, flagging for awareness): while fixing v4.4/v5.0/
v6.0 top-table statuses, also corrected their per-version DETAIL tables to
match (v6.0's six phases were all still "Planned"; 4.4.6 was "Manual check
pending") since leaving those stale would recreate the same top-vs-detail
mismatch this cleanup exists to fix. Also, v4.0-v4.3 rows still use the
older "**Complete**" wording instead of the new Done/In Progress/Blocked/
Planned vocabulary — left untouched since Section 1 didn't list them, call
it out if you want them normalized too.

Ad hoc fixes (user-flagged, done during Section 1 review, not on the
original checklist):
- Moved "## v4.0 tasks" section back into numeric order (was sitting after
  v7.0, right before "Version archive" — now sits right after the top
  table, before "## v4.2 completed subphases").
- Removed the "### v4.0 Phase 3 - Backend performance and accuracy" prose
  block from PLAN.md — confirmed near-verbatim duplicate of PLAN_v4.0.md's
  own "Phase 3" section. v4.0 tasks now matches every other version's
  table-only + "Full spec" link pattern.
- v4.2's "### v4.2 highlights" prose block was checked too: NOT a duplicate
  of PLAN_v4.2.md (archive has bug-by-bug detail, not this condensed
  summary) — left in place pending user decision, since it's the only
  version section with this extra narrative and removing it is a stylistic
  call, not a correctness fix.
- Renamed every per-version detail heading from generic wording ("planned
  subphases", "completed subphases", "fixes subphase", "tasks") to
  "## vX.X <Theme> - <Status>" (e.g. "## v6.0 Mobile UX - Done"), per user
  request.
- Removed all bold markup from every PLAN.md table cell (version numbers,
  status words) across the top table, all detail tables, and the version
  archive table, per user request — was inconsistently applied and carried
  no meaning.
- Added full Phase | Goal | Status detail tables for v6.1, v6.2, v6.3, v6.4
  (previously only had top-table/version-archive rows, no detail section),
  inserted in order after v6.0 and before v7.0. Phase names/statuses
  confirmed against each archive file. v6.1 has no numbered sub-phases in
  its source file — user chose to represent it as a single synthesized row
  ("6.1.1 | Advanced Setup Panel Redesign | Done") with a note flagging
  that it's synthesized, rather than skip the table or invent numbering
  for its 8-item implementation checklist.

## Section 2 — ROADMAP.md  [ ]
- [ ] Fix v6.0 phase table: replace copy-pasted v5.0 phase names with real
      names from PLAN_v6.0.md (Mobile Information Architecture, Responsive
      App Shell, Mobile Compose Experience, Mobile Live Debate And Final
      Answer, Mobile Session History, PWA And Accessibility)
- [ ] Move v5.0 into "Shipped" section
- [ ] Move v6.0 into "Shipped" section
- [ ] Move v4.4 into "Shipped" section
- [ ] Add v5.1 entry -> "Shipped" section
- [ ] Add v5.2 entry -> "Planned" section (status: Blocked)
- [ ] Add v6.1 entry -> "Shipped" section
- [ ] Add v6.2 entry -> "Current" section (status: In Progress)
- [ ] Add v6.3 entry -> "Current" section (status: In Progress)
- [ ] Add v6.4 entry -> "Planned" section
- [ ] Show diff, wait for confirmation before moving to Section 3

## Section 3 — CLAUDE.md  [ ]
- [ ] Add missing individual files to Key modules table (useConsultRun.ts,
      data/templates.ts, lib/*.ts files, pages/*.tsx files)
- [ ] Add one summary row per missing component folder (compose/, debate/,
      drawers/, layout/, session/, team/, ui/) and for services/pdf/
- [ ] Replace "Current Session State" section entirely with:
      - Completed work: see docs/plan_archive/
      - Active plan: see PLAN.md
      - Architecture reference: see docs/engineering/
      - In-progress / not yet verified: [pull from PLAN.md's non-Done rows
        after Section 1 edits — expect v5.2, v6.2, v6.3, v6.4, v7.0]
- [ ] Fix the "Branch: PLAN_v4.2 — last updated 2026-06-14" line to reflect
      the actual current branch and today's date
- [ ] Show diff, wait for confirmation

## Section 4 — TODO.md  [ ]
- [ ] Rename internal title and add the timestamp/purpose note per the
      confirmed decision above
- [ ] Show diff, wait for confirmation
- [ ] Once all four sections are confirmed done, ask me whether to delete
      this tracker file