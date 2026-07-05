# Version 6.0 - Mobile UX

**Scope:** Make the app comfortable and complete on phone and narrow tablet viewports.  
**Status:** In progress — phases 6.0.1 and 6.0.2 largely complete, 6.0.3 partially complete.  
**Depends on:** v4.3 latency work and v4.4 live debate polish should be stable enough that mobile layouts are not chasing moving targets.

---

## Ordering note

**Recommendation: Do v6.0 before v5.0.**

Reasons:
- Marketing for TeamStoa is starting imminently. Users who sign up through marketing need working password reset, email verification, and polished token-expiry handling — missing these causes immediate churn and no mobile polish compensates.
- The login/register screens carry the TeamStoa brand and must be redesigned anyway as part of the rebrand. Doing auth first means mobile login screens are polished once, not patched twice.
- The admin area (v6.0.4) is needed before you onboard real users — you need to see who signed up and manage them.
- v6.0.2 explicitly includes "make login/register fully mobile-safe." If v5.0 runs first, login mobile-safety would have to be revisited in v6.0 anyway.

Check mobile auth audit + login UX polish including password reset

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

## Phase 6.0.1 - Mobile Information Architecture — largely done

**Goal:** Decide what becomes primary navigation on narrow screens.

### Tasks

- [x] Define mobile breakpoints for phone (<=640px `sm`) and tablet/desktop (>=768px `md`) — used consistently across all components
- [x] Choose the primary mobile structure — bottom navigation bar (Sessions tab, center violet FAB, Account tab) matching Slack/Discord patterns
- [x] Map desktop areas to mobile destinations: sessions->Sessions sheet, compose->main view, live debate->main view, final answer->main view, account/logout->Account sheet
- [x] Decide whether the left sidebar collapses to a bottom sheet — done: `ConsensusRunsSidebar` is `hidden md:flex`; replaced on mobile by `MobileSessionsSheet`
- [x] Make sure saved sessions remain easy to open — Sessions tab in bottom nav opens slide-up sheet with full session list
- [ ] Preserve shared-run read-only pages on mobile without requiring login — `SharedRunPage` exists but not yet mobile-tested
- [~] Define which panels stack as full-screen sheets on mobile — `AdvancedDrawer` done as bottom sheet; `InsightsDrawer` and `TemplateDrawer` still desktop-only

---

## Phase 6.0.2 - Responsive App Shell — largely done

**Goal:** Replace desktop-only layout assumptions with mobile-safe structure.

### Tasks

- [x] Collapse the sidebar into a dedicated sessions tab in the bottom nav — `MobileSessionsSheet` via `MobileBottomNav`
- [x] Keep "New Run", logout, and account access reachable — center FAB for new run; Account sheet has logout, dark mode, settings, admin
- [x] Ensure the main app panel fills the full viewport width — `w-full` layout, `CommandBarTeamAvatars` overflow fixed
- [x] Add safe-area inset spacing (`env(safe-area-inset-bottom)`) — applied in `MobileBottomNav` and `MobileSessionsSheet`

- [x] Update `TopNav` to hide desktop-only items below the mobile breakpoint — "+ New Run", "Templates" -> `hidden md:inline-flex`; `UserMenu` -> `hidden md:block`
- [x] Verify `ConsensusRunsSidebar` never renders at full desktop width on a phone — `hidden md:flex` applied

---

## Phase 6.0.3 - Mobile Compose Experience — in progress, resume here

**Goal:** Make prompt entry, attachments, and run controls usable with thumbs and virtual keyboards.

### Tasks

- [ ] Make the compose bar keyboard-safe on iOS and Android: input must scroll into view when the virtual keyboard opens, viewport must not shrink the text area unusably
- [ ] Keep attachment controls visible without crowding the prompt input (consider a single attachment icon that opens a sheet)
- [x] Move advanced settings (`AdvancedDrawer`) into a full-screen bottom sheet on mobile — done: `max-md:` classes convert it to a slide-up sheet with drag handle
- [ ] Ensure team member cards in `TeamMemberEditForm` / `TeamMemberCard` are readable and editable by touch — not yet verified; likely needs input sizing and tap-target review
- [x] Prevent text, buttons, template chips, and agent avatars from overflowing their containers — `CommandBarTeamAvatars` rewritten with `w-full` mobile container and inline `+` circle
- [x] "Quick templates" horizontal scroll strip as the primary template entry point on mobile — `TemplateShortcutRow` already renders as a scrollable chip row below the compose box
- [ ] Minimum tap target for all interactive elements: 44x44 px (WCAG 2.5.5) — partially done (Account sheet actions have `min-h-[44px]`); needs full audit of compose area, follow-up buttons, session list rows

---

## Phase 6.0.4 - Mobile Live Debate And Final Answer

**Goal:** Make the run experience readable and interactive while the debate is live.

### Tasks

- [ ] Ensure `ChatroomDebateView` / `ChatPanel` has a stable, scrollable layout within a full-height mobile viewport
- [ ] Keep the status bar / progress indicator visible without consuming too much height — consider collapsing it to a thin progress strip on mobile
- [ ] Make agent message bubbles, round dividers, and system timeline items readable at phone width (font size, padding, avatar size)
- [ ] Implement native Web Share API (`navigator.share`) for sharing the final answer link on mobile, falling back to copy-link if unsupported
- [ ] Add a clear visual transition from live debate to final answer (scroll-to-top or reveal animation)
- [ ] Keep copy, share, and export controls reachable after completion without requiring scroll — floating or sticky action row
- [ ] Typing indicators (`TypingRow`) must not overflow the mobile viewport
- [ ] `PinnedAnswer` card: verify expand/collapse tap target and that `FinalAnswerHeaderRoster` does not overflow at 375px
- [ ] Stats bar (Score, tokens, cost) and `SessionPromptDownloads` buttons: verify layout when stacked on mobile; "Include full debate" checkbox needs >=44px tap target
- [ ] Follow-up composer: on mobile, open as a bottom sheet on "Ask follow-up" tap rather than expanding inline

---

## Phase 6.0.5 - Mobile Session History

**Goal:** Make saved runs and threads easy to browse on small screens.

### Tasks

- [ ] Add mobile session search by text or template name (not just a future maybe — the sidebar is too dense at 2-3 runs to be useful without filtering at scale)
- [ ] Preserve thread grouping and follow-up context with clear indentation or thread indicator
- [ ] Make share, unshare, and delete actions accessible via a long-press or swipe gesture, not hover menus
- [ ] Add empty, loading, and error states for the mobile session view
- [ ] Confirm pull-to-refresh or manual refresh works predictably
- [ ] Back navigation from a session view returns to the session list without losing scroll position

---

## Phase 6.0.6 - PWA And Accessibility

**Goal:** Make the app installable and keyboard-accessible; add a graceful offline experience.

### Tasks

- [ ] Add `manifest.json` and service worker via `vite-plugin-pwa` — users can "Add to Home Screen" on iOS/Android to get a native-app-like entry point (no browser chrome)
- [ ] Define an offline fallback page — the app is live-API-dependent, but a graceful offline screen is better than a blank page
- [ ] Verify visible focus states work for keyboard users — do not rely on hover-only focus rings; check compose bar, session list rows, nav buttons

---

## Deferred — low priority or needs tooling investment

These items were removed from the active phases. Revisit when the core mobile experience is stable.

- **LCP/TBT performance budget** (target LCP <=2.5s, TBT <=200ms on mid-range 4G) — not actionable without Lighthouse CI wired into the build pipeline.
- **Visual regression checks at mobile widths** — needs Percy or Playwright snapshot setup; significant tooling cost for an early-stage product.
- **Test at 375/390/768px as a tracked task** — this is a QA pass, not a dev deliverable. Do it manually before each phase ships; no need to track it as a plan item.
- **Virtual keyboard behavior as a separate phase task** — covered by Phase 6.0.3 "Make the compose bar keyboard-safe". Not a separate item.
- **Verify all tap targets meet 44x44 px as a separate phase task** — covered by Phase 6.0.3 tap-target audit. Not a separate item.

---

## Removed / consolidated items

- "Add mobile session search/filter if the sidebar becomes too dense" — the "if" has been removed. Search is a concrete task in 6.0.5.
- "Add safe-area spacing for mobile browsers" was formerly only in 6.0.2; it is now explicitly required for every affected component.

---

## Acceptance Criteria

- Users can complete a full run from a phone: log in, compose, configure, run, read, save/share/export.
- No primary action is hidden behind hover-only UI or requires desktop-style mouse interaction.
- No horizontal page scrolling appears at 375px or wider.
- The live debate and final answer remain readable without layout overlap or font-size regression.
- Session history, logout, and account entry points are reachable on mobile without more than two taps.
- The app is installable as a PWA and shows a graceful offline page when there is no network.
- Tap targets are >=44x44 px throughout.
