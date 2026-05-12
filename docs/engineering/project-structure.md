# Project Structure

```
MultiAi/
  backend/
    api/
      app.py           ← FastAPI routes (/api/consult, /api/consult-stream, /api/health)
      schemas.py       ← Pydantic request/response models
      sessions.py      ← Session list/get/delete routes
    consensus/
      engine.py        ← Main orchestrator (ConsensusEngine.consult)
      debate_runner.py ← Round loop (run_rounds)
      llm_clients.py   ← OpenRouter HTTP wrapper (call_openrouter)
      scorer.py        ← Rates agreement between two answers (1–10)
      summarizer.py    ← Compresses a round into rolling context
      validator.py     ← Checks if final answer is relevant to the question
      intent.py        ← Detects if the question needs clarification
      models.py        ← DebateRound, DebateSession dataclasses
      prompts.py       ← ALL prompt templates (do not edit without care)
      attachments.py   ← Parses file uploads (text, PDF, image)
      costs.py         ← Token pricing per model
      usage_tracker.py ← Per-request token/cost collector (uses ContextVar)
      model_registry.py← Maps product aliases to real OpenRouter model IDs
      activity_text.py ← Builds human-readable activity feed messages
      parsing.py       ← Extracts revised answer from critic output
    config.py          ← All constants + env var loading (AppConfig dataclass)
    storage/
      session_store.py ← save/load/list/delete JSON session files
  frontend/
    src/
      App.tsx          ← Root component, all state lives here
      types.ts         ← Shared TypeScript types
      components/
        ChatroomDebateView.tsx  ← Live chatroom feed (rounds, messages, typing indicator)
        ChatMessage.tsx         ← Single chat bubble (avatar + name + role badge + text)
        ChannelHeader.tsx       ← Sticky header (Live badge, round counter, score, avatars)
        TypingRow.tsx           ← Animated "is typing…" row
        RoundDivider.tsx        ← Divider between debate rounds
        ScoreBadge.tsx          ← Score announcement pill
        ConsensusReachedBanner.tsx ← Banner when threshold is hit
        TeamMemberCard.tsx      ← Roster card shown in team editor
        TeamMemberEditModal.tsx ← Face/model/role editor
      services/
        api.ts         ← fetch wrappers for all backend endpoints
        attachments.ts ← File/clipboard reading utilities
        exporter.ts    ← Download as Markdown or PDF
      data/
        experts.ts     ← Persona definitions (names, avatars, fun facts, createDefaultTeam)
        models.ts      ← LLM options shown in UI dropdowns
      lib/
        parseActivityMessages.ts ← Pure fn: string[] → ChatroomState (speaker/round/score detection)
  tests/               ← pytest tests (all mock LLM calls, never real API)
  .env                 ← secrets (gitignored — never commit this)
  CLAUDE.md            ← instructions for Claude Code

