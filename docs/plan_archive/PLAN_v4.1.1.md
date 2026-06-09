# Version 4.1.1 — Cleanup, Component Reorganisation & Polish

**Scope:** Finish the loose ends from v4.1 and reorganise the frontend component tree into its intended subdirectory structure.  
**Depends on:** v4.1 complete (DB + auth shipped)  
**Next:** v4.2 (Public sharing + full debate export)

---

## Status check — what v4.1 left open

The full Phase 3 (DB persistence) and Phase 3b (auth) were shipped in v4.1. The items below were explicitly noted as remaining after that version closed.

| Item | Status | Plan section |
|------|--------|--------------|
| PostgreSQL schema + migrations | ✅ Done | — |
| fastapi-users auth (register / login / JWT) | ✅ Done | — |
| Frontend auth guard + login page | ✅ Done | — |
| Sessions scoped by `user_id` | ⚠️ Partial — `user_id` nullable; unauthenticated sessions exist | Task 1 below |
| Railway deployment guide | ✅ Done (2026-06-09) — `docs/engineering/railway-deployment.md` | — |
| CORS restricted to production domain | ❌ Not done — currently `allow_origins=["*"]` | Task 2 below |
| Component files moved into subdirectories | ❌ Not done — barrel indexes exist but all ~55 files are still flat | Task 3 below |
| `TemplateNameChip` added to barrel index | ❌ Missing from `team/index.ts` | Task 3 below |
| Mobile logout reachability | ❌ Not verified | Task 4 below |
| `expertiseTag` field cleanup | ❌ Field exists in `FACE_OPTIONS` but unused | Task 5 below |
| PLAN.md updated to reflect v4.1 complete | ❌ Still shows v4.0 as active | Task 6 below |

---

## Task 1 — Per-user session scoping enforcement

**Problem:** `user_id` on the `runs` table is currently nullable so anonymous (pre-login) sessions can be stored. The `list_sessions` and `load_session` functions in `db_session_store.py` accept an optional `user_id` but the sessions router doesn't always pass it.

**Goal:** When a user is logged in, only their sessions appear in the sidebar and are accessible via `/api/sessions/:id`.

### Subtasks

- [ ] `backend/api/sessions.py` — add `Depends(optional_current_user)` to `GET /api/sessions` and `GET /api/sessions/:id`; pass `user.id if user else None` to `list_sessions` / `load_session`
- [ ] `backend/api/sessions.py` — add `Depends(optional_current_user)` to `DELETE /api/sessions/:id`; pass user_id to `delete_session`
- [ ] Verify: after login, sidebar shows only the logged-in user's sessions

---

## Task 2 — CORS hardening for production

### What is CORS and why does it matter here?

**CORS (Cross-Origin Resource Sharing)** is a browser security rule. When a web page at `https://multiai-frontend.up.railway.app` tries to call an API at `https://multiai-backend.up.railway.app`, the browser pauses and asks the backend: "do you allow requests from that frontend address?" The backend replies by setting a special HTTP header called `Access-Control-Allow-Origin`.

Right now the code says:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # ← "*" means "allow requests from ANY website"
    allow_credentials=True,
    ...
)
```

**The problem with `"*"`:**  
Any website in the world — including a malicious one — can call your API. For unauthenticated endpoints like `/api/health` that is harmless, but for your session and debate endpoints it means any page a user visits could silently call your backend using that user's browser.

**The hidden bug — `"*"` and `allow_credentials=True` conflict:**  
The browser CORS spec explicitly forbids the combination of `allow_origins=["*"]` and `allow_credentials=True`. Some browsers silently ignore this; others will block the request entirely. It needs to be fixed regardless of the security concern above.

**`ALLOWED_ORIGINS` is not a secret:**  
This is important. Your API key and JWT secret must never appear in code or be committed to git. `ALLOWED_ORIGINS` is just your own frontend URL — it is not sensitive. You set it in Railway's dashboard exactly like you set `VITE_API_BASE_URL` for the frontend. Nothing from your `.env` file is involved.

**Your `.env` file is safe:**  
`.gitignore` already excludes `.env` and `.env.*`:
```
# Env files
.env
.env.*
!.env.example
```
`ALLOWED_ORIGINS` does not need to go in `.env` at all — it is only meaningful in production, and in production you set it in Railway's Variables tab directly. Locally, the code falls back to `"*"` which is fine.

### The fix

The cleanest place to hold this value is `AppConfig` (all config lives there per project conventions):

**`backend/config.py`** — add one field:
```python
allowed_origins: str = os.getenv("ALLOWED_ORIGINS", "*")
```

**`backend/api/app.py`** — replace the hardcoded `["*"]` with the config value and fix the credentials conflict:
```python
CFG = AppConfig()

_origins = [o.strip() for o in CFG.allowed_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=_origins != ["*"],  # credentials only when origins are explicit
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Why `allow_credentials=_origins != ["*"]`:**  
When the origins list is still the wildcard default (local dev), credentials are disabled — which is what the browser requires. When you have set a real domain in Railway, credentials are enabled automatically. No separate env var needed, no manual toggle.

### What to set in Railway (after frontend is deployed)

In the backend service → Variables tab, add:

| Variable | Value |
|---|---|
| `ALLOWED_ORIGINS` | `https://your-frontend.up.railway.app` |

If you ever add a custom domain (e.g. `https://multiai.io`), separate multiple origins with a comma:
```
ALLOWED_ORIGINS=https://multiai-frontend.up.railway.app,https://multiai.io
```

### Subtasks

- [ ] `backend/config.py` — add `allowed_origins: str = os.getenv("ALLOWED_ORIGINS", "*")`
- [ ] `backend/api/app.py` — replace hardcoded `["*"]` with `_origins` derived from `CFG.allowed_origins`; fix the `allow_credentials` conflict
- [ ] Railway — add `ALLOWED_ORIGINS=https://your-frontend.up.railway.app` to backend service Variables **after** the frontend URL is known
- [ ] Local dev — no `.env` change needed; the default `"*"` keeps everything working

---

## Task 3 — Component folder reorganisation

**Problem:** Seven barrel index files exist under `frontend/src/components/{layout,compose,debate,session,drawers,primitives,team}/index.ts` but all ~55 component `.tsx` files are still flat in `components/`. The indexes currently re-export via `"../ComponentName"` (one level up). This task moves the files into their subdirectories and updates all import paths.

**Why now:** The indexes are already written and agreed-on — moving the files is the mechanical completion of that work. TypeScript will surface any missed imports at compile time.

### File mapping

**`layout/`**
| File | Move to |
|------|---------|
| `TopNav.tsx` | `layout/TopNav.tsx` |
| `ConsensusRunsSidebar.tsx` | `layout/ConsensusRunsSidebar.tsx` |
| `Sidebar.tsx` | `layout/Sidebar.tsx` |

**`compose/`**
| File | Move to |
|------|---------|
| `CommandBar.tsx` | `compose/CommandBar.tsx` |
| `CommandBarHeaderRow.tsx` | `compose/CommandBarHeaderRow.tsx` |
| `CommandBarTeamAvatars.tsx` | `compose/CommandBarTeamAvatars.tsx` |
| `CommandContextFooter.tsx` | `compose/CommandContextFooter.tsx` |
| `Composer.tsx` | `compose/Composer.tsx` |
| `ComposerAdvanced.tsx` | `compose/ComposerAdvanced.tsx` |
| `ComposerAttachmentPanel.tsx` | `compose/ComposerAttachmentPanel.tsx` |
| `QuickPasteZone.tsx` | `compose/QuickPasteZone.tsx` |
| `FollowupComposer.tsx` | `compose/FollowupComposer.tsx` |

**`debate/`**
| File | Move to |
|------|---------|
| `ChatPanel.tsx` | `debate/ChatPanel.tsx` |
| `ChatroomDebateView.tsx` | `debate/ChatroomDebateView.tsx` |
| `DebateActivityPrimitives.tsx` | `debate/DebateActivityPrimitives.tsx` |
| `RoundDivider.tsx` | `debate/RoundDivider.tsx` |
| `ConsensusReachedBanner.tsx` | `debate/ConsensusReachedBanner.tsx` |
| `ChannelHeader.tsx` | `debate/ChannelHeader.tsx` |
| `TypingRow.tsx` | `debate/TypingRow.tsx` |
| `ChatMessage.tsx` | `debate/ChatMessage.tsx` |
| `ScoreBadge.tsx` | `debate/ScoreBadge.tsx` |

**`session/`**
| File | Move to |
|------|---------|
| `AnswersPanel.tsx` | `session/AnswersPanel.tsx` |
| `SessionPromptBlock.tsx` | `session/SessionPromptBlock.tsx` |
| `SessionPromptActions.tsx` | `session/SessionPromptActions.tsx` |
| `SessionPromptDownloads.tsx` | `session/SessionPromptDownloads.tsx` |
| `SessionViewActions.tsx` | `session/SessionViewActions.tsx` |
| `SessionInsightsTableView.tsx` | `session/SessionInsightsTableView.tsx` |
| `SessionAttachmentList.tsx` | `session/SessionAttachmentList.tsx` |
| `PinnedAnswer.tsx` | `session/PinnedAnswer.tsx` |
| `FinalAnswerAvatarStrip.tsx` | `session/FinalAnswerAvatarStrip.tsx` |
| `SavedAnswerMarketingCard.tsx` | `session/SavedAnswerMarketingCard.tsx` |
| `ClarificationBox.tsx` | `session/ClarificationBox.tsx` |

**`drawers/`**
| File | Move to |
|------|---------|
| `AdvancedDrawer.tsx` | `drawers/AdvancedDrawer.tsx` |
| `InsightsDrawer.tsx` | `drawers/InsightsDrawer.tsx` |
| `TemplateDrawer.tsx` | `drawers/TemplateDrawer.tsx` |

> Note: `TemplateDrawer.tsx` is currently exported from `team/index.ts` but belongs in `drawers/` — it is a slide-out panel, not a team-management component. Move to `drawers/` and update the team index to remove it; add it to the drawers index.

**`primitives/`**
| File | Move to |
|------|---------|
| `CollapsiblePanel.tsx` | `primitives/CollapsiblePanel.tsx` |
| `MarkdownView.tsx` | `primitives/MarkdownView.tsx` |
| `ModelProviderIcon.tsx` | `primitives/ModelProviderIcon.tsx` |
| `ScoreBadge.tsx` | `primitives/ScoreBadge.tsx` |
| `InfoTip.tsx` | `primitives/InfoTip.tsx` |
| `FieldLabelWithTip.tsx` | `primitives/FieldLabelWithTip.tsx` |
| `V2SectionHeader.tsx` | `primitives/V2SectionHeader.tsx` |
| `ActionGhostButton.tsx` | `primitives/ActionGhostButton.tsx` |
| `AttachmentChipList.tsx` | `primitives/AttachmentChipList.tsx` |
| `AttachmentFileLinks.tsx` | `primitives/AttachmentFileLinks.tsx` |
| `DebateOptionsTable.tsx` | `primitives/DebateOptionsTable.tsx` |
| `DebateSettings.tsx` | `primitives/DebateSettings.tsx` |
| `ModelUsageTable.tsx` | `primitives/ModelUsageTable.tsx` |
| `SettingsBar.tsx` | `primitives/SettingsBar.tsx` |
| `LeadRoleField.tsx` | `primitives/LeadRoleField.tsx` |

**`team/`**
| File | Move to |
|------|---------|
| `TeamMemberCard.tsx` | `team/TeamMemberCard.tsx` |
| `TeamMemberDutyModelRow.tsx` | `team/TeamMemberDutyModelRow.tsx` |
| `TeamMemberEditForm.tsx` | `team/TeamMemberEditForm.tsx` |
| `TeamMemberEditModal.tsx` | `team/TeamMemberEditModal.tsx` |
| `TemplateShortcutRow.tsx` | `team/TemplateShortcutRow.tsx` |
| `AgentStrip.tsx` | `team/AgentStrip.tsx` |
| `AgentStripCards.tsx` | `team/AgentStripCards.tsx` |
| `TemplateNameChip.tsx` | `team/TemplateNameChip.tsx` |

### Subtasks

- [ ] Move all files according to the mapping above (git mv so history is preserved)
- [ ] Update each barrel `index.ts` — change all re-export paths from `"../ComponentName"` → `"./ComponentName"`
- [ ] Add `TemplateNameChip` export to `team/index.ts`
- [ ] Add `TemplateDrawer` export to `drawers/index.ts`; remove it from `team/index.ts`
- [ ] Add `ScoreBadge` to `debate/index.ts` (currently only in `primitives/index.ts` — decide canonical location; recommendation: keep in `primitives/` since it's also used outside debate context)
- [ ] Update all import paths in files that import directly from `"../ComponentName"` or `"./ComponentName"` — run `npm run build` / `tsc --noEmit` after to catch any misses
- [ ] Files not in any index (verify each is covered or intentionally unlisted):
  - `TemplateNameChip.tsx` → add to `team/index.ts`
  - `TemplateDrawer.tsx` → move to `drawers/index.ts`

### Affected importing files (non-exhaustive — TypeScript will catch the rest)

`App.tsx`, `ChatPanel.tsx`, `ChatroomDebateView.tsx`, `SessionPromptBlock.tsx`, `PinnedAnswer.tsx`, `AdvancedDrawer.tsx`, `InsightsDrawer.tsx`, `CommandBar.tsx`, `ConsensusRunsSidebar.tsx`

---

## Task 4 — Mobile logout reachability

**Problem:** The logout button lives in the sidebar footer. On mobile the sidebar collapses into a drawer. If the drawer is closed the logout button is unreachable.

### Subtasks

- [ ] Open the app on a narrow viewport (< 768 px) and confirm whether the sidebar drawer can be opened
- [ ] If unreachable: add a logout option to the mobile `TopNav` (hamburger menu or small avatar button)
- [ ] If reachable: document it in `ux-notes.md` to close the open question

---

## Task 5 — Remove unused `expertiseTag` from `FACE_OPTIONS`

**Problem:** `FACE_OPTIONS` in `frontend/src/data/experts.ts` has an `expertiseTag` field on every entry (e.g. `"Dawn Wave Chaser"`, `"Midnight Hoops Hero"`). As of v4.1 polish session, no component reads this field — sublabels now use professional titles from the template `role` string.

### Options

A. **Remove** — delete the `expertiseTag` field from all entries and from the type definition. Simplest.  
B. **Repurpose** — surface as a fun one-liner tooltip on hover in member cards. Keeps the personality data alive.

Recommendation: **Option A** unless B is prioritised for engagement. The tags add noise to the data file with no current consumer.

### Subtasks (Option A)

- [ ] `frontend/src/data/experts.ts` — remove `expertiseTag` from the `FaceOption` type and all entries
- [ ] Grep for `expertiseTag` to confirm no remaining consumers before deleting

---

## Task 6 — Update PLAN.md to reflect current version

**Problem:** `PLAN.md` at the repo root still shows `Active version: v4.0` and lists v4.1 as `Not started`.

### Subtasks

- [ ] Update active version to `v4.1.1`
- [ ] Mark v4.0 and v4.1 as `Complete` in the roadmap table
- [ ] Add v4.1.1 row to the roadmap and version archive

---

## Completion criteria

- [ ] All 6 tasks above are checked off
- [ ] `tsc --noEmit` and `npm run build` pass with zero errors after the component move
- [ ] Sidebar shows only the current user's sessions when logged in
- [ ] `PLAN.md` reflects the correct active version
