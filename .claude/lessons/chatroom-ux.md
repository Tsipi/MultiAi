# Chatroom UX — Team-Member Chat Behavior

The debate renders as a **Discord/Slack-style chatroom** (`ChatroomDebateView`). Each LLM agent has a persona (name + avatar), a colored name, and a role badge. Messages stream in round-by-round like a live team channel.

## Key files

| File | What it does |
|------|-------------|
| `frontend/src/data/experts.ts` | 16 face options; `TeamMember` type; `createDefaultTeam()` |
| `frontend/src/lib/parseActivityMessages.ts` | Pure fn: `string[]` → `ChatroomState` (no React, no side effects) |
| `frontend/src/components/ChatroomDebateView.tsx` | Live feed — groups messages by round, typing indicator, auto-scroll |
| `frontend/src/components/ChatMessage.tsx` | Single chat bubble (avatar, colored name, role badge) |
| `frontend/src/components/ChannelHeader.tsx` | Sticky header: Live badge, round counter, animated score, avatar strip |
| `frontend/src/components/TypingRow.tsx` | `<name> is typing ···` with bouncing dots |

## How it works

`parseActivityMessages` classifies each raw backend SSE line into an `AgentId` (`writer | criticA | criticB | scorer | system`) using regexes, and tracks the current round and score. It does **not** know which face maps to which agent — that's `resolvePerson()` in `ChatroomDebateView`, which looks up the name/avatar from `cast`.

Default team: **John** (writer, Deepseek), **Christy** (critic A, Gemini Flash), **Mark** (critic B, Gemini Flash). User can swap any face or model.

## Team size — N writers and N critics

The UI and backend both support teams larger than 3. Users can add members via the "+" button; `appendDefaultTeamMember` rotates through all 16 faces.

`mergeTeamIntoPayload` in `consultHelpers.ts` sends the full team as lists:
- `writers` — all `TeamMember` entries where `duty === "writer"`
- `critics` — all `TeamMember` entries where `duty === "critic"`

**Backend behavior with N members:**
- **N writers**: All writers draft in parallel in round 1. Their answers are merged and labeled `[Writer 1]`, `[Writer 2]`, etc. The **primary writer** (first in the list) handles all refinements and the final synthesis.
- **N critics**: All critics critique in parallel every round. Their critiques are merged and labeled `[Critic A]` / `[Critic B]` (for 2) or `[Critic 1]`, `[Critic 2]`, etc. (for 3+). Consensus scoring averages all pairwise scores across critics' revised answers.
- `parseActivityMessages` in the frontend classifies critic lines via `/critic a/i` and `/critic b/i` for the 2-critic case, and `/critic \d+/i` is **not yet handled** — chatroom display for 3+ critics will show as `system` messages rather than named bubbles. This is the one remaining frontend gap for teams > 3.

## Agent color palette (keep consistent)

| Agent    | Tailwind token               |
|----------|------------------------------|
| Writer   | `violet-600` / `violet-400`  |
| Critic A | `blue-600` / `blue-400`      |
| Critic B | `orange-600` / `orange-400`  |
| Scorer   | `emerald-600` / `emerald-400`|

Colors are defined once in `ChatMessage.tsx` (`NAME_COLOR` record) — don't redefine them elsewhere.
