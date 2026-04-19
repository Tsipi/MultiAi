# PLANS.md — Unified Dashboard UX (V1)

## Objective
Unify Create + View flows into a single intuitive dashboard.

Goals:
- Reduce friction
- Improve usability
- Highlight core value (multi-agent output)
- Prepare for SaaS (multi-user, persistence, billing)

---

## Layout

Top Navigation
----------------------------------------------
| Sidebar | Builder (Input) | Output (View)  |
----------------------------------------------

---

## Sections

### 1. Top Navigation
- Logo
- New Run (reset state)
- Templates (future)
- History shortcut (optional)
- User/Profile (future)

---

### 2. Sidebar — Runs
Purpose: Session navigation

Includes:
- List of runs
- Click to load run
- (Future: search, filters)

Data model:
Run {
  id: string
  prompt: string
  created_at?: string
}

---

### 3. Builder (Left Panel)

#### Mission
- Lead Expert Role
- Prompt
- Context files

#### Quick Controls
- Debate Mode: Fast / Balanced / Deep
- Output Style: Bullets / Paragraphs
- Length: Short / Medium / Long

#### Team (collapsed)
- Summary view
- “Edit Team” → modal

#### CTA
- Ask Team (sticky button)

---

### 4. Output Workspace (Right Panel)

#### Header
- Tabs: Final Answer / Debate
- Actions: Copy / MD / PDF

#### Metrics
- Cost / Tokens / Agreement

#### Final Answer
- Markdown output

#### Follow-up
- Continue thread

#### Advanced (collapsed)
- Model breakdown
- Full debate

---

## Interaction Flow

### New Run
1. Enter prompt
2. Click Ask Team
3. Output appears
4. User reads / exports / follow-up

### Load Run
1. Click sidebar item
2. Builder + Output update

---

## State (Frontend)

AppState {
  currentRun?: Run
  builder: {
    lead_role: string
    prompt: string
    context_files: File[]
    team: TeamMember[]
    debate_mode: "fast" | "balanced" | "deep"
    output_style: string
    length: string
  }
  output: {
    final_answer: string
    debate?: any
    metrics?: {
      cost: number
      tokens: number
      agreement: number
    }
  }
}

---

## API

POST /run
GET /run/{id}

---

## Implementation Steps

1. Layout (3 columns)
2. Builder simplification
3. Output panel
4. State sync
5. Polish

---

## Design Principles

- Output-first UX
- Progressive disclosure
- Fast execution

---

## Definition of Done

- Clear input/output separation
- Fast usage
- Runs reload correctly

---

## Bottom Line

Left = Define problem  
Right = See result
