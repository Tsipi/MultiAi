# Version 5.0 - Mobile UX

**Scope:** Make the app comfortable and complete on phone and narrow tablet viewports.  
**Status:** Planning only. Do not implement until explicitly approved.  
**Depends on:** v4.3 latency work and v4.4 live debate polish should be stable enough that mobile layouts are not chasing moving targets.

---

## Goal

MultiAi should feel like a real mobile workspace, not a desktop dashboard squeezed onto a small screen. The primary workflows must remain reachable:

- Start a new run
- Configure the team and debate settings
- Attach files
- Watch the live debate
- Read the final answer
- Reopen saved sessions
- Share/export results
- Log out and manage account access

---

## Phase 5.0.1 - Mobile Information Architecture

**Goal:** Decide what becomes primary navigation on narrow screens.

### Tasks

- [ ] Define mobile breakpoints for phone and narrow tablet layouts
- [ ] Choose the primary mobile structure: top nav + drawer, bottom nav, or tabbed workspace
- [ ] Map desktop areas to mobile destinations: sessions, compose, live debate, final answer, settings
- [ ] Make sure saved sessions remain easy to open without blocking the compose flow
- [ ] Preserve shared-run read-only pages on mobile

---

## Phase 5.0.2 - Responsive App Shell

**Goal:** Replace desktop-only layout assumptions with mobile-safe structure.

### Tasks

- [ ] Collapse the sidebar into a mobile drawer or dedicated sessions view
- [ ] Keep `New Run`, logout, and account access reachable from mobile navigation
- [ ] Ensure the main app panel uses the full viewport width without horizontal overflow
- [ ] Add safe-area spacing for mobile browsers
- [ ] Verify dark mode and light mode on narrow screens

---

## Phase 5.0.3 - Mobile Compose Experience

**Goal:** Make prompt entry, attachments, and run controls usable with thumbs and virtual keyboards.

### Tasks

- [ ] Make the compose bar keyboard-safe on iOS and Android browser viewports
- [ ] Keep attachment controls visible without crowding the prompt input
- [ ] Move advanced setup into a mobile-friendly sheet or full-screen drawer
- [ ] Ensure team member cards are readable and editable on mobile
- [ ] Prevent text, buttons, and chips from overflowing their containers

---

## Phase 5.0.4 - Mobile Live Debate And Final Answer

**Goal:** Make the run experience readable while work is happening.

### Tasks

- [ ] Ensure the live debate panel has a stable, scrollable mobile layout
- [ ] Keep the v4.4 status bar visible without consuming too much height
- [ ] Make agent messages and system timeline items readable at phone width
- [ ] Add a clear transition from live debate to final answer
- [ ] Keep copy/share/export controls reachable after completion

---

## Phase 5.0.5 - Mobile Session History

**Goal:** Make saved runs and threads easy to browse on small screens.

### Tasks

- [ ] Add mobile session search/filter if the sidebar becomes too dense
- [ ] Preserve thread grouping and follow-up context
- [ ] Make share/unshare/delete actions accessible without hover
- [ ] Add empty, loading, and error states for the mobile session view
- [ ] Confirm refresh and back navigation behave predictably

---

## Phase 5.0.6 - Mobile QA And Accessibility

**Goal:** Catch layout and interaction problems before release.

### Tasks

- [ ] Test core workflows at common phone widths
- [ ] Test virtual keyboard behavior for prompt entry and login forms
- [ ] Verify tap targets meet mobile accessibility expectations
- [ ] Verify focus states and keyboard navigation still work
- [ ] Add focused visual/regression checks for the app shell and compose area

---

## Acceptance Criteria

- Users can complete a full run from a phone: login, compose, configure, run, read, save/share/export.
- No primary action is hidden behind hover-only UI.
- No horizontal page scrolling appears at supported mobile widths.
- The live debate and final answer remain readable without layout overlap.
- Session history, logout, and account entry points are reachable on mobile.
