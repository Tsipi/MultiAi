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

## Section 2 — ROADMAP.md  [x]
- [x] Fix v6.0 phase table: replace copy-pasted v5.0 phase names with real
      names from PLAN_v6.0.md (Mobile Information Architecture, Responsive
      App Shell, Mobile Compose Experience, Mobile Live Debate And Final
      Answer, Mobile Session History, Mobile QA And Accessibility — PLAN.md
      calls 6.0.6 this, not "PWA And Accessibility" as originally guessed
      here; used PLAN.md's current wording per instruction to treat PLAN.md
      as sole source of truth)
- [x] Move v5.0 into "Shipped" section
- [x] Move v6.0 into "Shipped" section
- [x] Move v4.4 into "Shipped" section
- [x] Add v5.1 entry -> "Shipped" section
- [x] Add v5.2 entry -> "Planned" section (status: Blocked)
- [x] Add v6.1 entry -> "Shipped" section
- [x] Add v6.2 entry -> "Current" section (status: In Progress)
- [x] Add v6.3 entry -> "Current" section (status: In Progress)
- [x] Add v6.4 entry -> "Planned" section
- [x] Show diff, wait for confirmation before moving to Section 3

Note: entire ROADMAP.md rewritten from scratch (via Write, not incremental
Edit) since nearly every section changed. v1.0-v4.3 Shipped entries carried
over verbatim (out of scope, already correct). Added a Marketing entry
under "Planned" (points to docs/local_only/PLAN_Marketing.md, matching
PLAN.md's version archive table) and a short vocabulary/mirroring note at
the top, matching PLAN.md's governance line. v6.3's entry includes a
short "In production" / "In development" note reflecting PLAN.md's header
split. Every status value mapped cleanly to Done/In Progress/Blocked/
Planned — nothing needed flagging as a vocabulary mismatch.

Follow-up (user-requested after initial Section 2 diff): removed every
per-phase "Phase | Goal | Status" table from ROADMAP.md (v4.4, v5.0, v6.0,
v6.1, v6.2, v6.3, v6.4, v7.0) — ROADMAP.md is now high-level only (theme +
one-line scope + a single prose "Status:" line + full-spec link), no
phase-level detail duplicated from PLAN.md. v6.3 kept its "In production /
In development" note (high-level, not phase detail) in addition to its new
one-line Status. v6.1's "synthesized row" note was removed along with its
table since it no longer applies. Header text, section structure (Shipped/
Current/Planned), and Backlog were not touched.

Follow-up 2 (user-requested): added full Phase | Goal | Status detail
tables for v5.1 and v5.2 to PLAN.md (inserted after v5.0, before v6.0),
matching the v4.4/v5.0/v6.0/v6.1-v6.4 format. Unlike v6.1, v5.1's archive
file DOES have real numbered phases (5.1.0-5.1.4) — no synthesis needed.
Found and flagged a real contradiction: Phase 5.1.4 "API Hardening And
Tests" has one task done (rate limiting) and one explicitly unchecked
("deferred pending user approval" — automated test coverage). User decided:
mark 5.1.4 Done (matching the archive's overall "Complete" status and
PLAN.md's existing Done row), treating the deferred test-coverage item as
an accepted scope-cut rather than an open blocker — but log that deferred
item separately so it isn't lost. Created new `docs/plan_archive/
PLAN_Tests.md` (same pattern as `TODO.md` — a side file, not part of the
PLAN.md/ROADMAP.md workflow) as a running list of deferred test-coverage
debt, with this item as its first entry.

v5.2's table (5.2.1 Google OAuth, 5.2.2 Notification Preferences, 5.2.3
Impersonate / View As — all Planned; section heading status Blocked)
followed the original instructions with no ambiguity.

Checked ROADMAP.md against the new PLAN.md data: v5.2's existing entry
already matched (no change needed). v5.1's entry was missing an explicit
"**Status:**" line that every other entry now has (it had no phase table
to begin with, so it was skipped when tables were stripped from every
other version) — added "**Status:** Done." for consistency.

## Section 3 — CLAUDE.md  [x]
- [x] Add missing individual files to Key modules table (useConsultRun.ts,
      data/templates.ts, lib/*.ts files, pages/*.tsx files) — all 17
      verified to exist on disk before adding, none skipped
- [x] Add one summary row per missing component folder (compose/, debate/,
      drawers/, layout/, session/, team/, ui/) and for services/pdf/
      (replaced its old single-file exporter.ts-only row)
- [x] Replace "Current Session State" section entirely with: Completed
      work / Active plan / Architecture reference pointers, In production,
      In development, and Not yet started/blocked (v5.2, v6.2, v6.3, v6.4,
      v7.0, Marketing) — read fresh from PLAN.md, matched the expected list
      exactly, nothing to flag as different
- [x] Fixed the Branch line using real `git rev-parse --abbrev-ref HEAD`
      (`PLAN_v6.0`) and real `date` output (2026-07-16) — see command
      output in the conversation
- [x] Show diff, wait for confirmation

Note: while picking example files for the new `components/compose/` folder
row, found that `ComposerAdvanced.tsx` still exists on disk (54 lines)
even though `PLAN_v6.1.md` states it was deleted as part of the v6.1
Advanced Setup Panel Redesign (`DebateSettings.tsx` IS actually gone,
confirming v6.1 partially executed as documented). Did not cite
`ComposerAdvanced.tsx` as a key-file example to avoid pointing at a
possibly-stale file; did not investigate or fix further since it's outside
this section's scope — flagging for awareness only.

## Section 4 — TODO.md  [ ]
- [ ] Rename internal title and add the timestamp/purpose note per the
      confirmed decision above
- [ ] Show diff, wait for confirmation
- [ ] Once all four sections are confirmed done, ask me whether to delete
      this tracker file