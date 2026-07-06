# Version 6.0 - Mobile UX

**Scope:** Make the app comfortable and complete on phone and narrow tablet viewports.  
**Status:** Phases 6.0.1, 6.0.2, 6.0.3, and 6.0.6 complete. Phase 6.0.4 partially complete. Phases 6.0.5 not started.  
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
- [x] Preserve shared-run read-only pages on mobile without requiring login — `SharedRunPage` updated: min-h-dvh, pt-safe/pb-safe, TeamStoa rebrand
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
- [x] `TopNav` safe-area: `pt-safe` added so logo and dark mode button sit below the iOS notch/status bar when `viewport-fit=cover` is active
- [x] Default light mode: `useDarkMode` fallback changed from `true` to `false`; new users start in light mode; existing preference in localStorage is respected

---

## Phase 6.0.3 - Mobile Compose Experience — complete

**Goal:** Make prompt entry, attachments, and run controls usable with thumbs and virtual keyboards.

### Tasks

- [x] Make the compose bar keyboard-safe on iOS and Android: `min-h-dvh` on root div prevents viewport shrink; `scrollIntoView` (300ms delay) on compose and follow-up textarea focus scrolls the input above the keyboard
- [x] Keep attachment controls visible — `+` button in `CommandBar` already opens native file picker on mobile; min-h-[44px] applied to the button
- [x] Move advanced settings (`AdvancedDrawer`) into a full-screen bottom sheet on mobile — done: `max-md:` classes convert it to a slide-up sheet with drag handle
- [x] Ensure team member cards in `TeamMemberEditForm` / `TeamMemberCard` are touch-friendly — min-h-[44px] on remove X button and Save/Cancel buttons; inputs full-width
- [x] Prevent text, buttons, template chips, and agent avatars from overflowing their containers — `CommandBarTeamAvatars` rewritten with `w-full` mobile container and inline `+` circle
- [x] "Quick templates" horizontal scroll strip as the primary template entry point on mobile — `TemplateShortcutRow` already renders as a scrollable chip row below the compose box
- [x] Minimum tap target for all interactive elements: 44x44 px (WCAG 2.5.5) — full audit complete: `CommandBar` attachment +, `ActionGhostButton`, `MobileSessionsSheet` close X, `TeamMemberCard` remove X, `TeamMemberEditForm` Save/Cancel, `AnswersPanel` delete buttons and "Show all", `SessionPromptDownloads` icon buttons and label

---

## Phase 6.0.4 - Mobile Live Debate And Final Answer — complete

**Goal:** Make the run experience readable and interactive while the debate is live.

### Tasks

- [x] `ChatroomDebateView` / `ChatPanel` stable scrollable layout — internal `overflow-y-auto` with bounded `max-h` (now `dvh`); outer container `overflow-hidden`; no layout instability on mobile
- [x] Status bar / progress indicator — `ChannelHeader` hides stage pills on mobile (`hidden sm:flex`); Round + Score row is compact and always visible; no height problem
- [x] Agent message bubbles readable at phone width — `ChatMessage` uses `min-w-0 flex-1`, `text-sm`, wrapping text; no overflow at 375px; `TypingRow` gets `min-w-0` safety
- [x] Implement native Web Share API (`navigator.share`) — `SessionPromptDownloads` shows a Smartphone icon button when run is public and `navigator.share` is available; falls back gracefully
- [x] Visual transition from live debate to final answer — `ChatPanel` `useEffect` scrolls `window` to top when `loading` goes false and `result` appears, so `PinnedAnswer` is immediately visible
- [x] Export controls reachable — `SessionPromptDownloads` sits directly below `PinnedAnswer`; visible without scrolling after debate finishes; all buttons min-h-[44px]
- [x] `PinnedAnswer` card: avatar roster hidden on mobile (`hidden sm:block`) to prevent overlap with score badge at 375px
- [x] `WebResearchStatus`: `min-w-0 overflow-hidden` on section, `break-words` on search query `<p>`, `min-w-0` on badges container — eliminates horizontal overflow from long queries and source badges
- [x] "Viewing Saved Answer" header: outer row stacks vertically on mobile (`flex-col sm:flex-row`); title + chip use `flex-wrap`; session ID uses `text-xs font-mono`; action buttons left-aligned on mobile, right-aligned on desktop
- [x] `SessionViewActions` tap targets: all three buttons raised to `min-h-[44px] min-w-[44px]`
- [x] Stats row (`2 rounds · Score · tokens · cost`): `justify-start sm:justify-end` + `min-w-0` so separators wrap cleanly on narrow screens instead of overflowing
- [x] Global horizontal overflow: `overflow-x-hidden` added to `<main>` — clips all remaining overflow without affecting vertical scroll
- [x] Follow-up composer: `MobileFollowupSheet` slides up from the bottom on mobile when "Ask follow-up" is tapped; inline form hidden on mobile (`hidden md:block`); desktop inline form unchanged

---

## Phase 6.0.5 - Mobile Session History — complete

**Goal:** Make saved runs and threads easy to browse on small screens.

### Tasks

- [x] Add mobile session search by text or template name — search input + live filter already in `AnswersPanel` compact mode (used by `MobileSessionsSheet`)
- [x] Preserve thread grouping and follow-up context with clear indentation or thread indicator — `groupByThread()` + `child` prop (indented `ml-2 sm:ml-3`) in `AnswersPanel`
- [x] Make share, unshare, and delete actions accessible without hover — Share/Unshare icon button added to each compact row alongside the existing Delete button; only visible once a session's result is loaded (visibility known); `handleShareToggleById` in `App.tsx`
- [x] Add empty, loading, and error states for the mobile session view — `useSessionHistory` now exposes `sessionsLoading`/`sessionsError`/`refreshSessions`; `MobileSessionsSheet` shows spinner while loading, error + retry when fetch fails, and "No runs yet" empty state
- [x] Pull-to-refresh / manual refresh — `RefreshCw` button in `MobileSessionsSheet` header; spins while loading; calls `refreshSessions` from `useSessionHistory`
- [x] Back navigation from a session view returns to the session list without losing scroll position — `MobileSessionsSheet` auto-scrolls to the row with `aria-current="true"` on mount, so the previously-selected session is visible each time the sheet opens

---

## Phase 6.0.6 - PWA And Accessibility — complete

**Goal:** Make the app installable and keyboard-accessible; add a graceful offline experience.

### Tasks

- [x] Add `manifest.json` and service worker via `vite-plugin-pwa` — manifest: name "TeamStoa", violet theme, `display: standalone`, `start_url: /app/new`; Workbox SW with `navigateFallback: /offline.html` and `/api/` denylist; PNG icons generated from `icon.svg` via `@vite-pwa/assets-generator`
- [x] Define an offline fallback page — `public/offline.html`: branded TeamStoa page, `prefers-color-scheme` light/dark, auto-reloads when connection restores via `window.addEventListener('online', ...)`, 44px "Try again" button, no external dependencies
- [x] Verify visible focus states for keyboard users — `sidebar-answer-card:focus-within` gains a violet `box-shadow` ring (`index.css`); all three `MobileBottomNav` buttons have `focus-visible:outline` classes

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
