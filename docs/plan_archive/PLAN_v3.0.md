# Version 3 UX Plan: Slack-Style Chatroom Debate Experience

**Authored:** 2026-04-09  
**Scope:** Frontend only — no backend changes. Same existing NDJSON activity stream.  
**Alternative to:** `claude_suggestions.md` (Courtroom layout)

---

## Design Vision

The debate feels like watching a team Slack channel in real-time. Agents post messages one after another as the debate progresses. Each has a distinct avatar and name. Round boundaries appear as Slack-style "date dividers". The Scorer drops in like a bot posting a status update. Typing indicators appear between messages. The final answer appears as a pinned message at the top of the channel — the most important thing, permanently visible.

This layout scales naturally to any number of team members — add 5 critics and they all just post in the same channel feed.

---

## Team Size: This Layout Handles N Members

Unlike the courtroom's 3-column grid, the chatroom feed is a single vertical scroll — every agent, regardless of how many there are, simply posts into the same thread. No layout breaks at 4, 5, or 6 members.

**Backend caveat (same as courtroom plan):** The engine today only uses 3 active seats. Extra members in the UI don't participate in the debate. In the chatroom layout, extra members can be shown as "read receipts" or small avatars at the bottom of the channel header — "In this channel: John, Christy, Mark · 2 others not assigned."

---

## Activity Message Parsing

Same parsing logic as the courtroom plan (`parseActivityMessages.ts`). The derived `CourtroomState` type is reused:

```ts
type ChatroomState = {
  activeSpeaker: "writer" | "criticA" | "criticB" | "scorer" | "system" | null;
  currentRound: number;
  latestScore: number | null;
  previousScore: number | null;
  consensusReached: boolean;
  messages: ChatMessage[];
}

type ChatMessage = {
  id: number;
  speaker: AgentId;
  text: string;
  round: number;
  type: "message" | "score_announcement" | "system";
  timestamp: Date; // Date.now() when message was added to feed
}
```

---

## Layout

```
┌────────────────────────────────────────────────────────────┐
│  # debate-channel          ● Live — Round 2/4   Score: 8.1 │  ← ChannelHeader
├────────────────────────────────────────────────────────────┤
│  📌 PINNED: Final Answer (appears once debate completes)   │  ← PinnedAnswer (sticky)
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ─────────────────── Round 1 ────────────────────────────  │  ← RoundDivider
│                                                            │
│  [John avatar]  John  (Writer)                  10:42:01   │
│  Here is my opening position on the question…             │
│                                                            │
│  [Christy avatar]  Christy  (Critic A)          10:42:08   │
│  I challenge point 2 — the evidence doesn't…              │
│                                                            │
│  [Mark avatar]  Mark  (Critic B)                10:42:09   │
│  Agreed with Christy. Additionally, consider…             │
│                                                            │
│  ┌─ 🤖 Scorer ─────────────────────────────────────────┐  │  ← ScoreBadge
│  │  Round 1 · Consensus 7.2 / 10 · Relevance 8.0       │  │
│  │  "Both critics flag the same weak point…"            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ─────────────────── Round 2 ────────────────────────────  │
│                                                            │
│  [John avatar]  John  (Writer)   ● typing…                 │  ← TypingRow
│                                                            │
└────────────────────────────────────────────────────────────┘
  [         Follow up…                              Send  ]    ← ChannelInput
```

---

## Component Architecture

### 1. `ChatroomDebateView` — Main container

**File:** `frontend/src/components/ChatroomDebateView.tsx`

Replaces `DebateActivityFeed` during live runs and historical replay.

**Props:**
```ts
type ChatroomDebateViewProps = {
  activity: string[];
  cast: Cast;              // writer / criticA / criticB — the 3 engine slots
  team: TeamMember[];      // full team including non-engine observers
  loading: boolean;
  maxRounds: number;
  consensusThreshold: number;
  result?: ConsultResult;  // populated once debate ends
}
```

**Internal structure:**
```
<ChatroomDebateView>
  <ChannelHeader />         ← sticky top
  <PinnedAnswer />          ← sticky below header, only when result exists
  <MessageFeed>             ← scrollable, flex-col
    for each round:
      <RoundDivider round={N} />
      for each message in round:
        <ChatMessage />     ← or <ScoreBadge /> for scorer messages
    <TypingRow />           ← always last, only when loading
  </MessageFeed>
  <ConsensusReachedBanner /> ← slides in when consensus reached
</ChatroomDebateView>
```

---

### 2. `ChannelHeader` — Slack-style channel bar

**Renders:**
```
# debate-channel    ● Live — Round 2 / 4    Score: 8.1 ↑    [avatars of all team members]
```

- Channel name is always `# debate-channel` (or could be derived from the question topic in v4)
- `● Live` badge pulses (same emerald dot as current)
- Round counter updates as rounds progress
- **Animated score counter** — same tick-up logic as the courtroom `CourtHeader`: uses `requestAnimationFrame` to count from `previousScore` to `latestScore` over 800ms, with color: green (↑), amber (→)
- Small row of team member avatars on the right (all team members, not just the 3 engine slots) — hovering shows name tooltip
- Observers (non-engine members) shown with 50% opacity and a "(not in session)" tooltip

---

### 3. `ChatMessage` — Individual message row

**Renders:** Slack message format — avatar on the left, name + timestamp on the right, message below.

```tsx
type ChatMessageProps = {
  speaker: AgentId;
  person: DebatePerson;
  role: string;        // "Writer" | "Critic A" | "Critic B"
  text: string;
  timestamp: Date;
  isNew: boolean;      // triggers entrance animation
}
```

**Appearance:**
- Avatar: 36px, rounded-full, left-aligned
- Name: `font-semibold text-sm` in agent color
- Role tag: small muted badge next to name (`Writer`, `Critic A`, etc.)
- Timestamp: `text-xs text-muted-foreground` right-aligned on the name row
- Message text: `text-sm leading-relaxed` below name row
- On `isNew`: entrance animation `animate-in fade-in slide-in-from-bottom-1 duration-200`
- On hover: subtle background highlight (like Slack's message hover), no action buttons needed for v3

**Agent color scheme (name text color):**
- Writer: `text-violet-600 dark:text-violet-400`
- Critic A: `text-blue-600 dark:text-blue-400`
- Critic B: `text-orange-600 dark:text-orange-400`
- Extra critics (if engine is extended later): cycle through `teal`, `rose`, `amber`

---

### 4. `ScoreBadge` — Scorer announcement row

Replaces a regular `ChatMessage` for messages parsed as `type: "score_announcement"` (i.e., "Round N: consensus X.X, relevance Y.Y…").

**Renders as a distinct bot post:**
```
┌───────────────────────────────────────────────────────┐
│  🤖 Scorer Bot                               10:42:15  │
│  Round 2 · Consensus 8.1 / 10 · Relevance 9.0         │
│  "Both critics agree on the core claim now…"           │
└───────────────────────────────────────────────────────┘
```

**Style:** `bg-muted/40 border border-border/50 rounded-lg px-3 py-2 mx-0 my-1`  
Slightly inset from the regular messages — visually bot-like, not a peer message.  
Score number is `font-bold text-emerald-600` if higher than previous round, `text-amber-600` if same.

---

### 5. `RoundDivider` — Section separator

Thin horizontal rule with centered text, exactly like Slack's date dividers:

```
─────────────────── Round 1 ──────────────────────
```

Style: `text-xs font-medium text-muted-foreground uppercase tracking-widest`  
The divider line is `border-t border-border/40`.

---

### 6. `TypingRow` — Live typing indicator

Always the last element in the feed when `loading === true`. Updates to reflect the current active speaker.

```
[John avatar]  John is typing…  ●●●
```

The three dots use staggered `animate-bounce` (same as `TypingDots` in the courtroom plan).  
When the speaker changes (e.g., Writer → Critic A), the row swaps with a quick `fade-out` / `fade-in`.

If multiple agents could theoretically type at once (future multi-critic support), show a stacked row:
```
[Christy avatar]  Christy is typing…  ●●●
[Mark avatar]  Mark is typing…  ●●●
```

---

### 7. `PinnedAnswer` — Sticky final answer

**Shown:** After `result` is populated (loading = false). Sticky below the `ChannelHeader`.

```
┌────────────────────────────────────────────────────────┐
│  📌 Final Answer  ·  Score 9.1 / 10   [▼ Expand]       │
│  ─────────────────────────────────────────────────────  │
│  The team reached consensus in 2 rounds. Here is the   │  ← collapsed: first 2 lines
│  synthesized answer…                                    │
│  ─────────────────────────────────────────────────────  │
│  [Download MD]  [Download PDF]                          │
└────────────────────────────────────────────────────────┘
```

- **Collapsed by default** shows 2 lines of the answer with a "▼ Expand" toggle
- **Expanded** shows full markdown-rendered answer
- Sticky positioning: `position: sticky; top: [channel-header-height]` — it stays visible as you scroll the transcript
- Enters with `animate-in slide-in-from-top-2 duration-400` when `result` first arrives
- Pin icon `📌` or a lock icon from lucide-react

---

### 8. `ConsensusReachedBanner` — Same as courtroom plan

Slides in when "Consensus threshold reached at round N" is parsed. Appears between messages in the feed (not sticky), as if the system posted it:

```
⚖️  Agreement reached at Round 2  —  Score 9.1 / 10
    The team reached consensus ahead of schedule.
```

Style: `bg-emerald-500/10 border-l-4 border-emerald-500 px-3 py-2 rounded-r-lg` (like a Slack info callout)

---

## Scroll Behavior

- The `MessageFeed` auto-scrolls to the bottom as new messages arrive (same as current `DebateActivityFeed` with `bottomRef.current?.scrollIntoView`)
- Once `result` is populated, scroll snaps back to top to reveal `PinnedAnswer`
- If the user has manually scrolled up during the debate, auto-scroll is paused (detect via a `userScrolled` flag on `onScroll`). A "Jump to live" button appears at the bottom right.

---

## `ChatPanel.tsx` Render Order (Same as Courtroom Plan)

After debate completes:
1. `PinnedAnswer` (sticky, inside `ChatroomDebateView`)
2. `ConsensusRunsSummaryBar` — "2 rounds · Score 9.1 · 2,450 tokens · $0.003"
3. `ChatroomDebateView` transcript (debate replay, scrollable)
4. `CollapsiblePanel` "Director's Cut" — collapsed
5. `SessionInsightsDashboard` — collapsed
6. `CollapsiblePanel` "Role & Prompt" — collapsed
7. `FollowupComposer`

---

## Files to Create

| File | Description |
|---|---|
| `frontend/src/components/ChatroomDebateView.tsx` | Main chatroom container |
| `frontend/src/components/ChatMessage.tsx` | Individual Slack-style message row |
| `frontend/src/components/ScoreBadge.tsx` | Scorer bot post row |
| `frontend/src/components/RoundDivider.tsx` | Round section separator |
| `frontend/src/components/TypingRow.tsx` | Active speaker typing indicator |
| `frontend/src/components/ChannelHeader.tsx` | Top bar: channel name, round, score, avatars |
| `frontend/src/components/PinnedAnswer.tsx` | Sticky final answer card |
| `frontend/src/components/ConsensusReachedBanner.tsx` | Inline consensus reached callout |
| `frontend/src/lib/parseActivityMessages.ts` | Shared with courtroom plan — derive state from activity[] |

## Files to Modify

| File | Change |
|---|---|
| `frontend/src/components/ChatPanel.tsx` | Replace `DebateActivityFeed` with `ChatroomDebateView`; reorder result blocks |
| `frontend/src/index.css` | Agent color CSS custom properties |

---

## Courtroom vs Chatroom — Comparison

| Dimension | Courtroom | Chatroom |
|---|---|---|
| Layout | 3-column seats + transcript | Single vertical feed |
| Team size scaling | Breaks beyond 3 active agents | Scales to N agents naturally |
| Visual drama | High — seat glow, structured turns | Medium — familiar, scannable |
| Information density | Lower (more whitespace, focused) | Higher (compact rows, more history visible) |
| Learnability for general users | Slightly higher (roles are spatially obvious) | Slightly lower (need to read name tags) |
| Mobile adaptability | Harder — 3 columns collapse awkwardly | Easy — vertical scroll is already mobile-native |
| Implementation complexity | Similar | Similar |
| Best for | Showcasing the "AI debate" concept | Practical day-to-day power use |

**Recommendation:** If you want future general users to *feel* that AI agents are debating, use the **Courtroom**. If you want to support N-member teams and prioritize readability/scannability for yourself (technical user), use the **Chatroom**. A hybrid — chatroom feed with a persistent agent roster bar at the top — is also viable in v4.

---

