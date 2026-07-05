# Version 6.1 - Advanced Setup Panel Redesign

**Scope:** Reorganize the Advanced Setup drawer into three tabbed sections for clarity and better mobile UX.  
**Status:** Complete.  
**Depends on:** v6.0 mobile UX work (branch `PLAN_v6.0`).

---

## Problem

The current Advanced Setup drawer presents 7+ disconnected sections in a single scrolling list:
Your AI Team → Lead expert role → Context files → Team Members → Team tools → Answer mode → Web research → Send to team

This is hard to navigate on mobile (too much scrolling), the groupings are not intuitive, and some labels are technical jargon ("Debate passes", "Team tools").

---

## Solution: Three tabs

Replace the flat scroll with a **3-tab pill navigation** inside the drawer, always visible below the header. The "Send to team" button remains pinned at the bottom regardless of which tab is active.

Default active tab: **Team**.

---

## Tab definitions

### Tab 1 — Team
*Everything about who is on the team and their shared focus.*

- "Your AI team" section header + subtitle (from current `ComposerAdvanced`)
- Lead expert role input (keep label as-is per user instruction)
- Team member cards (from current `DebateSettings`)
- "Add another team member" button

### Tab 2 — Debate
*How the debate is structured.*

- Answer mode (`AnswerModeControl`)
- Debate rounds (label renamed from "Debate passes" — component label change only, not component rename)
- Agreement score (keep label as-is per user instruction)

### Tab 3 — Sources
*What external information the team can draw on.*

- Context files (`ComposerAttachmentPanel`)
- Web research (`WebResearchControl`)

---

## Component changes

### New files to create
| File | Purpose |
|------|---------|
| `frontend/src/components/drawers/AdvancedTabTeam.tsx` | Team tab content |
| `frontend/src/components/drawers/AdvancedTabDebate.tsx` | Debate tab content |
| `frontend/src/components/drawers/AdvancedTabSources.tsx` | Sources tab content |

### Files to modify
| File | Change |
|------|--------|
| `frontend/src/components/drawers/AdvancedDrawer.tsx` | Add `activeTab` state (`"team" \| "debate" \| "sources"`); render tab nav and active tab panel; keep "Send to team" pinned at bottom |
| `frontend/src/components/primitives/DebateOptionsTable.tsx` | Rename label text "Debate passes" → "Debate rounds" (text only, component name stays) |
| `frontend/src/components/primitives/DebateSettings.tsx` | Delete — content distributed to the three tab components |
| `frontend/src/components/compose/ComposerAdvanced.tsx` | Delete — content distributed to the three tab components |

### Files with no change needed
- `AnswerModeControl.tsx` — moved as-is into `AdvancedTabDebate`
- `WebResearchControl.tsx` — moved as-is into `AdvancedTabSources`
- `ComposerAttachmentPanel.tsx` — moved as-is into `AdvancedTabSources`
- `TeamMemberCard.tsx`, `TeamMemberEditForm.tsx` — unchanged
- `V2SectionHeader.tsx` — reused in `AdvancedTabTeam`

---

## Tab navigation design

A three-pill row rendered inside the drawer, below the "Advanced setup" header and above the scrollable content:

```
[ Team ]  [ Debate ]  [ Sources ]
```

- Active tab: solid violet background, white text
- Inactive tabs: ghost style, muted text, hover violet
- Full-width row on mobile, auto-width on desktop
- Stays sticky at top of the scrollable area (same `z-10` layer as the header)

---

## Drawer layout (after)

```
┌─────────────────────────────────────────┐
│  ⚙ Advanced setup              [X]      │  ← sticky header
│  [ Team ]  [ Debate ]  [ Sources ]      │  ← sticky tab nav
├─────────────────────────────────────────┤
│                                         │
│  (active tab content — scrollable)      │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  [      Send to team      ]             │  ← always pinned
└─────────────────────────────────────────┘
```

---

## Implementation order

- [x] Rename label "Debate passes" → "Debate rounds" in `DebateOptionsTable.tsx`
- [x] Create `AdvancedTabTeam.tsx` — Your AI team header, Lead expert role, member cards, Add member button
- [x] Create `AdvancedTabDebate.tsx` — Answer mode, Debate rounds, Agreement score
- [x] Create `AdvancedTabSources.tsx` — Context files, Web research
- [x] Rewrite `AdvancedDrawer.tsx` — 3-tab pill nav sticky below header, scrollable content, pinned Send button
- [x] Delete `DebateSettings.tsx` and `ComposerAdvanced.tsx`; remove from index files; empty dead `SettingsBar.tsx`
- [x] Unify section header styling across drawer: `text-sm font-semibold text-foreground` + violet icon (`Paperclip` for Context files, `Users` for Team members)
- [x] Move quota indicator out of compose card: removed from `CommandBar` entirely; desktop sidebar footer now shows "X / Y runs this month" progress bar below the user email (`ConsensusRunsSidebar`); mobile users access quota via Account sheet / Settings

---

## Acceptance criteria

- [x] Three tabs visible and switchable in both mobile bottom-sheet and desktop side-panel modes
- [x] "Send to team" always visible pinned at the bottom, regardless of active tab
- [x] No content is lost — every field from the current drawer is reachable in one of the three tabs
- [x] "Debate passes" label reads "Debate rounds" everywhere it appears
- [x] `tsc --noEmit` clean and `vitest run` 22/22 passed throughout
- [x] `DebateSettings.tsx` and `ComposerAdvanced.tsx` fully deleted with no dangling imports
- [x] Quota indicator removed from compose card; renders in desktop sidebar footer with progress bar; accessible on mobile via Account / Settings
