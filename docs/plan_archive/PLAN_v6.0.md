# Version 5.0 - Mobile UX

**Scope:** Make the app comfortable and complete on phone and narrow tablet viewports.  
**Status:** Planning only. Do not implement until explicitly approved.  
**Depends on:** v4.3 latency work and v4.4 live debate polish should be stable enough that mobile layouts are not chasing moving targets.

---

## Ordering note

**Recommendation: Do v6.0 (Login/Auth polish) before v5.0 (Mobile).**

Reasons:
- Marketing for TeamStoa is starting imminently. Users who sign up through marketing need working password reset, email verification, and polished token-expiry handling — missing these causes immediate churn and no mobile polish compensates.
- The login/register screens carry the TeamStoa brand and must be redesigned anyway as part of the rebrand. Doing auth first means mobile login screens are polished once, not patched twice.
- The admin area (v6.0.4) is needed before you onboard real users — you need to see who signed up and manage them.
- v6.0.2 explicitly includes "make login/register fully mobile-safe." If v5.0 runs first, login mobile-safety would have to be revisited in v6.0 anyway.

If mobile is urgently needed before v6.0 is complete, extract only 6.0.1 and 6.0.2 (auth audit + login UX polish including password reset) as a mini-sprint, then proceed with v5.0.

---

## Goal

TeamStoa should feel like a real mobile workspace, not a desktop dashboard squeezed onto a small screen. The primary workflows must remain reachable:

- Start a new run
- Configure the team and debate settings
- Attach files
- Watch the live debate
- Read the final answer
- Reopen saved sessions
- Share and export results
- Log out and manage account access

---

## Phase 5.0.1 - Mobile Information Architecture

**Goal:** Decide what becomes primary navigation on narrow screens.

### Tasks

- [ ] Define mobile breakpoints for phone (≤640px), narrow tablet (641–1024px), and desktop (>1024px)
- [ ] Choose the primary mobile structure — recommendation: bottom navigation bar (Sessions, New Run, Settings) plus a slide-in compose drawer, matching patterns users already know from Slack/Discord
- [ ] Map desktop areas to mobile destinations: sessions, compose, live debate, final answer, account/settings
- [ ] Decide whether the left sidebar collapses to a bottom sheet or a full-screen sessions view
- [ ] Make sure saved sessions remain easy to open without blocking the compose flow
- [ ] Preserve shared-run read-only pages on mobile without requiring login
- [ ] Define which panels (AdvancedDrawer, InsightsDrawer, TemplateDrawer) stack as full-screen sheets on mobile vs remain side panels

---

## Phase 5.0.2 - Responsive App Shell

**Goal:** Replace desktop-only layout assumptions with mobile-safe structure.

### Tasks

- [ ] Collapse the sidebar into a mobile drawer or a dedicated sessions tab in the bottom nav
- [ ] Keep "New Run", logout, and account access reachable without opening additional menus
- [ ] Ensure the main app panel fills the full viewport width with no horizontal overflow
- [ ] Add safe-area inset spacing (`env(safe-area-inset-*)`) for notched iOS and Android browser chrome
- [ ] Verify dark mode and light mode on narrow screens, including the bottom nav and drawers
- [ ] Update `TopNav` to hide desktop-only items below the mobile breakpoint without breaking the layout
- [ ] Verify `Sidebar` / `ConsensusRunsSidebar` never renders at full desktop width on a phone

---

## Phase 5.0.3 - Mobile Compose Experience

**Goal:** Make prompt entry, attachments, and run controls usable with thumbs and virtual keyboards.

### Tasks

- [ ] Make the compose bar keyboard-safe on iOS and Android: input must scroll into view when the virtual keyboard opens, viewport must not shrink the text area unusably
- [ ] Keep attachment controls visible without crowding the prompt input (consider a single attachment icon that opens a sheet)
- [ ] Move advanced settings (`AdvancedDrawer`, debate mode, web search, model counts) into a full-screen bottom sheet on mobile
- [ ] Ensure team member cards in `TeamMemberEditForm` / `TeamMemberCard` are readable and editable by touch
- [ ] Prevent text, buttons, template chips, and agent avatars from overflowing their containers
- [ ] Add a "Quick templates" horizontal scroll strip as the primary template entry point on mobile (replaces the drawer shortcut row that is hard to tap on small screens)
- [ ] Minimum tap target for all interactive elements: 44×44 px (WCAG 2.5.5)

---

## Phase 5.0.4 - Mobile Live Debate And Final Answer

**Goal:** Make the run experience readable and interactive while the debate is live.

### Tasks

- [ ] Ensure `ChatroomDebateView` / `ChatPanel` has a stable, scrollable layout within a full-height mobile viewport
- [ ] Keep the status bar / progress indicator visible without consuming too much height — consider collapsing it to a thin progress strip on mobile
- [ ] Make agent message bubbles, round dividers, and system timeline items readable at phone width (font size, padding, avatar size)
- [ ] Implement native Web Share API (`navigator.share`) for sharing the final answer link on mobile, falling back to copy-link if unsupported
- [ ] Add a clear visual transition from live debate to final answer (scroll-to-top or reveal animation)
- [ ] Keep copy, share, and export controls reachable after completion without requiring scroll — floating or sticky action row
- [ ] Typing indicators (`TypingRow`) must not overflow the mobile viewport

---

## Phase 5.0.5 - Mobile Session History

**Goal:** Make saved runs and threads easy to browse on small screens.

### Tasks

- [ ] Add mobile session search by text or template name (not just a future maybe — the sidebar is too dense at 2–3 runs to be useful without filtering at scale)
- [ ] Preserve thread grouping and follow-up context with clear indentation or thread indicator
- [ ] Make share, unshare, and delete actions accessible via a long-press or swipe gesture, not hover menus
- [ ] Add empty, loading, and error states for the mobile session view
- [ ] Confirm pull-to-refresh or manual refresh works predictably
- [ ] Back navigation from a session view returns to the session list without losing scroll position

---

## Phase 5.0.6 - PWA, Performance, And Accessibility

**Goal:** Catch layout and interaction problems and add baseline PWA capabilities.

### Tasks

- [ ] Test all core workflows at 375px (iPhone SE), 390px (iPhone 14 standard), and 768px (iPad mini portrait)
- [ ] Test virtual keyboard behavior for prompt entry, login forms, and team edit forms on both iOS Safari and Android Chrome
- [ ] Verify all tap targets meet 44×44 px minimum
- [ ] Verify visible focus states work for keyboard users (do not rely on hover-only focus rings)
- [ ] Add a `manifest.json` and service worker for basic PWA installability — users can "Add to Home Screen" to get a native-app-like entry point
- [ ] Define an offline fallback page (the app is live-API-dependent, but a graceful offline screen is better than a blank page)
- [ ] Set a mobile performance budget: target LCP ≤ 2.5s and TBT ≤ 200ms on a mid-range device over 4G
- [ ] Add focused visual regression checks for the app shell, compose area, and live debate view at mobile widths

---

## Removed / consolidated items

- "Add mobile session search/filter if the sidebar becomes too dense" — the "if" has been removed. Search is a concrete task in 5.0.5.
- "Add safe-area spacing for mobile browsers" was formerly only in 5.0.2; it is now explicitly required for every affected component.

---

## Acceptance Criteria

- Users can complete a full run from a phone: log in, compose, configure, run, read, save/share/export.
- No primary action is hidden behind hover-only UI or requires desktop-style mouse interaction.
- No horizontal page scrolling appears at 375px or wider.
- The live debate and final answer remain readable without layout overlap or font-size regression.
- Session history, logout, and account entry points are reachable on mobile without more than two taps.
- The app is installable as a PWA and shows a graceful offline page when there is no network.
- Tap targets are ≥ 44×44 px throughout.
