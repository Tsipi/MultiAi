# Product Overview

**MultiAi** is a multi-LLM consensus dashboard. Instead of asking one AI and hoping it's right, you assemble a team — one Writer LLM drafts an answer, two Critic LLMs tear it apart, and the loop repeats until they agree enough (scored 1–10 by a separate Scorer LLM). The final answer is a synthesis of that debate.

The live debate renders as a **Discord/Slack-style chatroom** — each agent has a persona (name + avatar), a colored display name, and a role badge. Messages stream in round-by-round.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Python + FastAPI at `localhost:8000` |
| Frontend | React + TypeScript + Vite at `localhost:5173` |
| LLM calls | OpenRouter (one key → GPT, Claude, Gemini, Deepseek) |
| Storage | JSON files in `sessions/` — no database |

No database is a deliberate v1 choice. JSON files are enough for personal/small-team use. Add one when you scale to many users.

## Debate loop

```
User submits question
  → Intent check: is the question clear? If not, ask for clarification.
  → Round 1: Writer drafts an answer
  → Loop (up to max_rounds):
      Critic A and Critic B critique in PARALLEL (asyncio.gather)
      Scorer rates agreement 1–10
      Summarizer + Relevance validator run in PARALLEL (asyncio.gather)
      If score >= threshold → stop
      Writer refines based on critique
  → Writer synthesizes final answer
  → Relevance check: does the answer address the question?
  → Session saved as sessions/YYYYMMDD_HHMMSS.json
```

**Critical rule:** never pass full transcripts to subsequent rounds — only the compressed rolling summary. Token costs stay low; context windows don't overflow.

**Fixed models:** Scorer and Summarizer are always `deepseek/deepseek-chat-v3.2`. Only Writer and the two Critics are user-selectable.
