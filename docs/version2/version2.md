# REDESIGN_PLAN.md — MultiAI UX/UI (Dark Tech Minimal v2)

---

# 1. Objective

Redesign the app to:

* Feel **young, sharp, premium**
* Emphasize **AI collaboration + consensus**
* Remove **legacy SaaS UI clutter**
* Create a **distinct identity (not generic dashboard)**

---

# 2. Core Problems

* Too many cards → visual noise
* Weak hierarchy → nothing stands out
* Feels like form builder, not AI product
* No emotional signal → not exciting
* Agents feel static, not alive

---

# 3. UX Philosophy

Shift from:

> Form → Output

To:

> Command → AI Team → Live Collaboration → Consensus

---

# 4. Layout (Bento Grid)

## Desktop

```
-------------------------------------------------
| AGENTS STRIP (top)                            |
-------------------------------------------------
|             COMMAND BAR (LARGE)               |
-------------------------------------------------
| Agent 1 | Agent 2 | Agent 3 | Agent 4         |
-------------------------------------------------
|         CONSENSUS PANEL (FULL WIDTH)          |
-------------------------------------------------
```

## Mobile

```
Agents (scroll)
Command bar
Responses (stacked)
Consensus (bottom)
```

---

# 5. Visual System

## Colors

* Background: `#080810`
* Surface: `#0F0F1A`
* Elevated: `#151528`
* Primary Accent: `#7C3AED` (electric violet)

### Agent Colors

Teal, Amber, Rose, Lime, Indigo, Orange, Pink, Blue

---

## Typography

* Headings: **Space Grotesk**
* Body: **Inter**

| Element     | Size           |
| ----------- | -------------- |
| Command Bar | 24–28px bold   |
| Titles      | 16–18px        |
| Body        | 15px           |
| Labels      | 12px uppercase |

---

## Surfaces

* No flat cards
* No default shadows
* Use:

  * subtle borders (`#ffffff10`)
  * layered dark tones
  * soft glow

---

# 6. Core Components

---

## 6.1 Command Bar (PRIMARY)

* Full width
* Rounded (16–20px)
* Glow on focus

Placeholder:

```
Ask your team...
```

Behavior:

* Focus → animated glow
* Enter → triggers AI sequence

---

## 6.2 Agent Roster

* Horizontal strip (top)
* Each agent:

  * Avatar
  * Name
  * LLM badge
  * Specialty tag

Active:

* Glow + subtle pulse

---

## 6.3 Agent Response Tiles

* Bento tiles
* Header: avatar + name
* Body: response

Styling:

* Border tinted per agent
* Slight background variation

States:

* Loading → skeleton
* Active → pulse
* Done → static

---

## 6.4 Consensus Panel

* Full width (bottom)
* Elevated surface
* Accent border

Purpose:
→ Final synthesized output

---

# 7. Motion & Interaction

---

## Loading

* Agents activate sequentially (100–150ms delay)
* Skeleton → typing → complete

---

## Activity

* Active agent: glowing border
* Completed: fade to stable

---

## Tile Expansion

* Click → expand modal/fullscreen

---

# 8. Input Simplification

---

## Remove from main view:

* Lead expert role
* Context files
* Team config

---

## Default view:

* Command bar
* Agents
* Results

---

## Advanced (collapsed drawer)

* Role
* Files
* Debate settings
* Team editing

---

# 9. Components

---

## Inputs

Replace all browser defaults with:

* Custom dark inputs
* Command-style textarea

---

## Buttons

Primary:

* Accent + glow

Secondary:

* Outline + subtle fill

---

# 10. UX Flow

---

## New Run

1. User sees command bar + agents
2. Types → Enter
3. Agents activate
4. Responses fill grid
5. Consensus appears last

---

## Follow-up

* Same command bar
* Context persists

---

# 11. Remove

* Flat cards
* White backgrounds
* Nested panels
* Over-explained labels

---

# 12. Emphasize

1. Command input
2. Agent activity
3. Consensus output

---

# 13. Implementation Phases

---

## Phase 1

* Dark theme
* Typography
* Color tokens

## Phase 2

* Command bar

## Phase 3

* Agent cards

## Phase 4

* Bento grid

## Phase 5

* Animations

## Phase 6

* Remove legacy UI

---

# 14. Definition of Done

* User understands app in <3 seconds
* First action obvious (type + enter)
* Feels like AI team, not tool

---

# 15. Bottom Line

```
You are commanding a team of AI minds —
not filling a form.
```
