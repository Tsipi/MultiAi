# Version 3 UX Plan: Live Courtroom Debate Experience

**Authored:** 2026-04-09  
**Scope:** Frontend only — no backend changes required. All improvements work with the existing NDJSON stream of short activity messages.

---

## Design Vision

Transform the current status-log into a **live courtroom** where the user watches three AI agents take turns speaking. Each agent has a designated seat, animates when active, and the debate unfolds like a structured hearing — Writer drafts, Critics challenge, Scorer announces the verdict each round. The final answer becomes the hero of the page once the gavel comes down.

---

## UX Answers Used

| Question | Answer | Design implication |
|---|---|---|
| Feel | Courtroom | Structured turns, distinct lanes, a "bench" seat for Scorer |
| Streamed content | Activity messages only (no backend change) | Parse the short strings cleverly; animate arrival |
| Score progression | Live tick-up (small) | Animated score counter per round, not a chart |
| Agent presence | Animated participants | Typing indicator, avatar glow/pulse per active speaker |
| Early stop | Yes, show prominently | Full-width banner when consensus reached |
| Final answer | Hero of page | Flip layout: answer first, debate below |
| Platform | Desktop first | Three-column courtroom layout, collapses gracefully |
| Audience | Technical now, general later | Show detail by default; write copy to be readable later |

---

## Team Size Constraint (Important)

The backend engine is hardcoded to **exactly 3 active seats**: 1 Writer + 2 Critics. This is enforced in `frontend/src/lib/consultHelpers.ts:selectEngineMembers()` — it always picks the first writer and the first two critics from the team array. Any extra members you add via "Add an Agent" appear in the AgentStrip but **do not participate in the debate**.

**Courtroom plan handles this as follows:**
- The 3-column courtroom always shows the 3 engine participants (Writer, Critic A, Critic B) as the active seats.
- If the team has 4+ members, extra members appear in a collapsed **"Observers" row** below the courtroom — visually present but clearly labelled "Not in this session".
- The `CourtHeader` shows a tooltip on the seats: "John, Christy & Mark are in session. 2 other team members are observing."
- When/if the engine is upgraded to support N critics, the seat row becomes a dynamic flex-wrap grid with one seat per active participant.

**Future-proofing note:** If you want more than 2 critics to debate, that requires a backend engine change — the `ConsultRequest` schema (`critic_a`, `critic_b` fields) would need to become a `critics: string[]` array, and `debate_runner.py` would need to run N concurrent critic calls per round.

---

## Activity Message Parsing Reference

All live UX drives off the existing stream. These are the patterns to parse:

```
"Writer is drafting the opening answer for your question."
  → Writer seat: activate typing indicator

"Round N: <writer_summary_sentence>"
  → Writer seat: reveal message, deactivate typing
  → Current round = N

"Round N: <critic_feedback_sentence for Critic A>"
  → Critic A seat: typing → reveal
  
"Round N: <critic_feedback_sentence for Critic B>"
  → Critic B seat: typing → reveal

"Writer rewrites based on Critic A and Critic B."
  → Writer seat: typing indicator again

"Round N: consensus X.X, relevance Y.Y. <summary>"
  → Scorer seat: flash + reveal message
  → Score counter animates from previous to X.X

"Consensus threshold reached at round N"
  → Dismiss the courtroom typing state
  → Show the ConsensusReachedBanner

"Synthesizing final answer"
  → All seats idle, Bench seat pulses

"Completed successfully"
  → Transition to FinalAnswerHero view
```

Regex patterns to extract values:
```ts
const ROUND_NUM   = /^Round (\d+):/i
const SCORE_LINE  = /consensus ([\d.]+),\s*relevance ([\d.]+)/i
const THRESHOLD   = /consensus threshold reached at round (\d+)/i
const WRITER_ACT  = /writer (is drafting|rewrites)/i
const CRITIC_A    = /critic a/i
const CRITIC_B    = /critic b/i
const SCORER_ACT  = /^Round \d+: consensus/i
const SYNTH       = /synthesizing final answer/i
```

---

## Component Changes

### 1. `CourtroomDebateView` — New component (replaces `DebateActivityFeed` during live runs)

**File:** `frontend/src/components/CourtroomDebateView.tsx`

**Layout (desktop):**
```
┌────────────────────────────────────────────────────────────┐
│  ROUND 2 / 4          consensus 7.2 → 8.1 ↑    ● LIVE     │  ← CourtHeader
├──────────────┬──────────────────────┬──────────────────────┤
│  CRITIC A    │      WRITER          │      CRITIC B        │  ← AgentSeat row
│  [avatar]    │     [avatar]         │     [avatar]         │
│  "Christy"   │      "John"          │      "Mark"          │
│  ─ ─ ─ ─     │      active glow     │      ─ ─ ─ ─         │
├──────────────┴──────────────────────┴──────────────────────┤
│                  TRANSCRIPT (scrollable)                   │  ← CourtTranscript
│  [John bubble: "Round 1: Here is my opening position..."]  │
│  [Christy bubble: "Round 1: I challenge point 2..."]       │
│  [Mark bubble: "Round 1: I agree with Christy, and..."]    │
│  [Scorer: "Round 1: consensus 7.2, relevance 8.0..."]      │
│  [John bubble: "Rewriting based on critics..."]            │
│  [typing indicator for John...]                            │
├────────────────────────────────────────────────────────────┤
│  BENCH  [scorer avatar]  Scorer & Summarizer  (DeepSeek)   │  ← BenchRow
└────────────────────────────────────────────────────────────┘
```

**Props:**
```ts
type CourtroomDebateViewProps = {
  activity: string[];           // raw stream lines from App.tsx
  cast: Cast;                   // writer / criticA / criticB persons
  loading: boolean;
  maxRounds: number;
  consensusThreshold: number;
}
```

**Internal state derived from `activity`:**
```ts
type CourtroomState = {
  activeSeat: "writer" | "criticA" | "criticB" | "scorer" | "bench" | null;
  currentRound: number;
  latestScore: number | null;
  previousScore: number | null;
  consensusReached: boolean;
  consensusRound: number | null;
  messages: CourtroomMessage[];
}

type CourtroomMessage = {
  id: number;
  speaker: "writer" | "criticA" | "criticB" | "scorer" | "system";
  text: string;
  round: number;
}
```

**Key behavior:** Recompute `CourtroomState` from the full `activity` array on every render (pure derivation, no extra useState). Use a `useMemo` hook keyed on `activity.length`.

---

### 2. `AgentSeat` — New sub-component inside CourtroomDebateView

**Renders:** One agent card (avatar + name + role label) with state-driven animation classes.

**States:**
- `idle` — normal appearance, dimmed slightly (`opacity-70`)
- `active` — full opacity, avatar has `animate-court-glow` (pulsing ring), subtle border highlight
- `typing` — full opacity + a `TypingDots` component replaces the subtitle

```ts
type AgentSeatProps = {
  person: DebatePerson;
  role: "Writer" | "Critic A" | "Critic B";
  state: "idle" | "active" | "typing";
  color: string; // tailwind color token for this agent's lane
}
```

**CSS animation to add** (in `index.css` or a dedicated `courtroom.css`):
```css
@keyframes court-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(var(--agent-color), 0.4); }
  50%       { box-shadow: 0 0 0 8px rgba(var(--agent-color), 0); }
}
.animate-court-glow {
  animation: court-glow 1.4s ease-in-out infinite;
}
```

**Agent color tokens:**
- Writer (John): `--agent-color: 139, 92, 246` (violet)
- Critic A (Christy): `--agent-color: 59, 130, 246` (blue)
- Critic B (Mark): `--agent-color: 234, 88, 12` (orange)
- Scorer/Bench: `--agent-color: 16, 185, 129` (emerald)

---

### 3. `TypingDots` — New micro-component

**File:** `frontend/src/components/TypingDots.tsx`

Three dots that animate in sequence (CSS stagger), like iMessage. Shows inside an `AgentSeat` when `state === "typing"` and also as a placeholder message at the bottom of `CourtTranscript`.

```tsx
export function TypingDots({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <span className="font-medium">{label}</span>
      <span className="flex gap-0.5">
        {[0,1,2].map(i => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
    </span>
  );
}
```

---

### 4. `CourtHeader` — New sub-component

**Renders** (single row, sticky at top of courtroom):
```
Round 2 / 4    [score tick counter]    ● LIVE
```

**Score counter behavior:**
- When `latestScore` changes, animate the number from `previousScore` to `latestScore` using a `useEffect` + `requestAnimationFrame` counter. Duration: 800ms.
- Color: green if score increased, amber if flat, red if dropped.
- Show a small up-arrow `↑` or `→` indicator.

```ts
type CourtHeaderProps = {
  currentRound: number;
  maxRounds: number;
  score: number | null;
  previousScore: number | null;
  loading: boolean;
}
```

---

### 5. `ConsensusReachedBanner` — New component

**File:** `frontend/src/components/ConsensusReachedBanner.tsx`

Shown full-width inside `CourtroomDebateView` when `consensusReached === true` (i.e., the message "Consensus threshold reached at round N" has been received).

```
┌────────────────────────────────────────────────────────┐
│  ⚖️  Agreement reached at Round 2  —  Score 9.1 / 10   │
│      The team reached consensus ahead of schedule.     │
└────────────────────────────────────────────────────────┘
```

Design: `bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300`. Appears with a slide-down animation (`animate-in slide-in-from-top-2`).

---

### 6. `FinalAnswerHero` — New component (replaces the buried collapsible)

**File:** `frontend/src/components/FinalAnswerHero.tsx`

**Shown:** After `result` is populated (loading = false, result != null).

**Layout:**
```
┌────────────────────────────────────────────────────────┐
│  Final Answer                         Score: 9.1 / 10  │
│  ─────────────────────────────────────────────────────  │
│  <full markdown rendered final answer>                  │
│                                                         │
│  [Download MD]  [Download PDF]                          │
└────────────────────────────────────────────────────────┘
```

- The final answer is **the first thing rendered** after a completed run — above the debate transcript.
- The debate section ("Director's Cut") moves below it and starts collapsed.
- The `SessionInsightsDashboard` (costs/tokens) moves below the debate section.

This is the main layout change in `ChatPanel.tsx` — reorder the render blocks.

---

### 7. Enhancements to `CourtTranscript` (message list)

**Each message entry animates in** with `animate-in fade-in slide-in-from-bottom-2 duration-300`.

**Messages are grouped by round** with a thin round separator:
```
── Round 1 ──────────────────────────
[Writer bubble]
[Critic A bubble]
[Critic B bubble]
[Scorer bubble]
── Round 2 ──────────────────────────
...
```

**The typing placeholder** — a `TypingDots` inside a ghost bubble — always appears at the bottom when loading, attributing to whichever agent is currently `active`. It disappears when the next real message arrives.

**Scorer messages** (the "Round N: consensus..." lines) render differently: centered, with a small gavel icon `⚖️`, styled as a system announcement rather than a chat bubble.

---

## Integration into `App.tsx` and `ChatPanel.tsx`

### In `App.tsx`

No state shape changes needed. `activity: string[]` and `loading: boolean` are already available. Pass them through to `CourtroomDebateView`.

### In `ChatPanel.tsx` — Render Order Change

**Current order:**
1. `DebateActivityFeed` (live feed during run)
2. Clarification box
3. Session Insights (collapsed)
4. Role & Prompt (collapsed)
5. Final Answer (collapsed by default — **this is the bug**)
6. Director's Cut (collapsed)
7. Follow-up composer

**New order:**
1. `CourtroomDebateView` — shown only while `loading === true` OR in the first few seconds after completion (so user sees the last state of the debate before it transitions)
2. `FinalAnswerHero` — shown once `result` is populated, with a subtle entrance animation
3. `ConsensusRunsSummaryBar` — one-line: "3 rounds · Score 9.1 · 2,450 tokens · $0.003"
4. `CollapsiblePanel` "Director's Cut: Full Debate" — collapsed by default
5. `SessionInsightsDashboard` — collapsed by default
6. `CollapsiblePanel` "Role & Prompt" — collapsed by default
7. `FollowupComposer`

### Transition: Live → Complete

When `loading` transitions from `true` to `false`:
1. `CourtroomDebateView` briefly shows "Completed" state (all agents idle, checkmark)
2. After 1.2s delay, `FinalAnswerHero` slides in from below (CSS `animate-in`)
3. `CourtroomDebateView` shrinks to a collapsed "Replay debate" panel

---

## Files to Create

| File | Description |
|---|---|
| `frontend/src/components/CourtroomDebateView.tsx` | Main courtroom container |
| `frontend/src/components/AgentSeat.tsx` | Individual agent seat with animation |
| `frontend/src/components/TypingDots.tsx` | Animated typing indicator |
| `frontend/src/components/CourtHeader.tsx` | Round counter + score tick |
| `frontend/src/components/ConsensusReachedBanner.tsx` | Full-width consensus banner |
| `frontend/src/components/FinalAnswerHero.tsx` | Hero final answer card |
| `frontend/src/lib/parseActivityMessages.ts` | Pure functions to derive `CourtroomState` from `activity: string[]` |

---

## Files to Modify

| File | Change |
|---|---|
| `frontend/src/components/ChatPanel.tsx` | Reorder render blocks; replace `DebateActivityFeed` with `CourtroomDebateView` during live runs; add `FinalAnswerHero` as first result block |
| `frontend/src/index.css` | Add `@keyframes court-glow` and CSS custom properties for agent colors |
| `frontend/src/components/DebateActivityFeed.tsx` | Keep as-is for now; used in historical session replay view |

---

## Implementation Sequence (suggested)

1. **`parseActivityMessages.ts`** — Pure logic first, easiest to test in isolation
2. **`TypingDots.tsx`** — Trivial, needed by others
3. **`CourtHeader.tsx`** — Standalone; score counter animation
4. **`AgentSeat.tsx`** — Standalone; CSS glow animation
5. **`ConsensusReachedBanner.tsx`** — Standalone
6. **`CourtroomDebateView.tsx`** — Assembles the above
7. **`FinalAnswerHero.tsx`** — Standalone
8. **`ChatPanel.tsx`** — Wire in `CourtroomDebateView` and `FinalAnswerHero`, reorder blocks

---

## Notes for Future Versions

- **v4 (mobile):** `CourtroomDebateView` collapses to a single-column transcript with agent avatars as row-leading icons. The three-seat header becomes a horizontal scrollable chip row.
- **v4 (general users):** Replace "consensus 8.1 / 10" with plain English: "Your team strongly agrees". Add a one-sentence plain-language summary above `FinalAnswerHero`.
- **v4 backend:** Once backend streams token-by-token, replace the typing placeholder with actual streaming text inside the chat bubble — no component changes needed, just swap the data source.
- **Per-round scores not shown yet:** `full_discussion[N].consensus_score` and `consensus_reason` are available in the `final` payload but not rendered. A future "round detail" expand on each transcript separator could show scorer reasoning.
