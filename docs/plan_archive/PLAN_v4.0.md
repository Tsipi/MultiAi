# Version 4.0 — UI Foundation

**Date:** 2026-04-19  
**Scope:** Frontend only — routing and team templates. No DB, no auth, no backend changes.  
**Next:** v4.1 (persistence + auth) → v4.2 (sharing + export) → v5.0 (Next.js + SEO)

## Objective

Add real URLs to the app and make team templates a first-class feature in the compose flow. Both are pure frontend changes — nothing in the backend is touched.

---

## 1. Current problems

### 1.1 No clear way to start fresh

Right now, when a user clicks an existing team answer in the left sidebar, the full answer loads into the main content. There is no obvious in-product way to return to a fresh empty state. The only way to get the empty screen is refreshing the browser.

This is a product flaw, not a cosmetic issue.

### 1.2 Templates are not placed in the user journey

Team templates are an important growth and usability feature, but currently there is no dedicated place for them in the main interaction flow.

### 1.3 SEO should not be mixed with private dashboard behavior

The logged-in dashboard itself is not the main SEO opportunity. The real SEO opportunity is public, crawlable pages generated from templates, use cases, and optionally public shared answers.

---

## 2. Version 4 product direction

### Core principle

The app should have two clearly defined states:

* **New Run mode** — blank compose screen
* **Existing Run mode** — viewing a saved answer

These should not depend on browser refresh.

---

## 3. New Run / Empty State solution

### Recommendation

Add a primary **New Run** button to the top navigation.

### Placement

Use both of these:

#### A. Top navigation

A visible button:

* `+ New Run`

This should be the main way to start fresh.

#### B. Optional quick reset in sidebar

A smaller icon button above the run history list.

This gives frequent users a faster shortcut.

### Behavior

When the user clicks **New Run**:

* Clear the selected run
* Reset the input form
* Remove current answer from the main content area
* Show the empty-state compose screen
* Update the route to a dedicated fresh page

### Recommended routing

Use explicit route states:

* `/app/new` → blank compose state
* `/app/run/:id` → existing saved run

This is the correct fix because the product state becomes URL-driven, not refresh-driven.

### Empty state content

When no run is selected, show:

* Main prompt input
* Template shortcuts
* Optional helper copy

Example helper line:

> Drop a mission and your squad will brainstorm, challenge weak ideas, and ship a cleaner answer.

---

## 4. Team templates

## 4.1 Where templates should live

Templates should appear in two places.

### A. Top navigation

Add a button:

* `Templates`

Purpose:

* easy discovery
* future library access
* supports saved personal templates later

### B. Directly under the main input

Add a section under the empty state input:

**Start from a template**

With small cards or chips such as:

* Programmer Team
* Product Team
* Research Team
* Marketing Team
* Investment Team

This is more effective than hiding templates in a settings panel.

---

## 4.2 Recommended template interaction

When the user clicks a template:

* Preload the team structure
* Optionally preload prompt guidance
* Keep prompt editable
* Let the user run immediately

### Template modal/drawer

Clicking `Templates` in the top nav should open a modal or side drawer.

Each template should include:

* template name
* one-line description
* included roles
* optional estimated depth or cost

Example:

**Programmer Team**
Product expert, frontend engineer, backend engineer, DevOps engineer
*Ship architecture, implementation plan, and edge-case review.*

### Actions per template

* Use template
* Preview roles
* Edit before run
* Save as my template

---

## 4.3 Suggested starter templates

Start with a small curated set:

1. Programmer Team
2. UX/Product Team
3. Startup GTM Team
4. Research & Writing Team
5. Investment Debate Team
6. Technical Architecture Review Team
7. Resume/Career Team
8. Marketing Campaign Team

Do not overload the interface with too many templates at launch.

---

## 5. UI recommendations for current layout

## 5.1 Top nav

Keep top nav lean but useful.

Recommended items:

* Logo
* New Run
* Templates
* Optional Share/Public later
* Login/Profile
* Theme toggle

## 5.2 Sidebar

Sidebar should remain the run history area.

Recommended elements:

* Search runs
* Run list
* Small quick reset icon

### Improvement

Add a visual selected state for the active run and ensure the user always knows whether they are:

* viewing a past run
* composing a new run

## 5.3 Main content area

The empty state should be intentional, not accidental.

When on `/app/new`, show:

* hero/title
* team avatars
* big prompt textarea
* template shortcuts
* CTA button

When on `/app/run/:id`, show:

* question card
* attached files
* final answer
* score / metrics
* actions like copy, export, share

---

## 6. SEO strategy

## 6.1 Important clarification

Do not try to make the private authenticated dashboard the main SEO target.

Private user runs are usually not indexable and should remain private unless explicitly shared.

### Public SEO targets

Build crawlable public pages for:

* homepage
* features pages
* template landing pages
* use-case pages
* public shared answers
* blog/comparison pages

### Private non-indexed pages

These should stay out of search indexing:

* `/app/*`
* account pages
* billing pages
* private runs

---

## 6.2 Best SEO growth model

### A. Public template pages

Examples:

* `/templates/programmer-team`
* `/templates/product-team`
* `/templates/investment-debate-team`

These pages explain what the team does and can rank in search.

### B. Use-case pages

Examples:

* `/use-cases/multi-agent-code-review`
* `/use-cases/business-plan-debate`
* `/use-cases/technical-architecture-review`

### C. Public shared answer pages

Let users optionally publish a run.

Examples:

* `/shared/how-to-build-saas-auth-railway-postgres`
* `/shared/meta-vs-crypto-2026`

These pages can become strong SEO assets if they are well structured.

---

## 6.3 SEO technical recommendations

Use SSR or SSG for public pages.

### Recommended setup

Best option:

* **Next.js** for public/marketing pages and shared pages

Possible split architecture:

* **Public site**: Next.js
* **Private app**: existing SPA if needed
* Later unify if desirable

### Metadata for every public page

Add:

* title tag
* meta description
* canonical URL
* Open Graph image
* Twitter/X card metadata
* structured headings
* schema markup where relevant

### Structured data suggestions

Use schema where appropriate:

* `SoftwareApplication`
* `Article`
* `FAQPage`

---

## 7. Backend direction

## 7.1 Likely current state

Based on the current app behavior, the frontend likely depends heavily on selected in-memory state.

Something close to:

* selected run controls main panel
* blank state only exists when nothing is selected on initial load
* history may be loaded partially or held locally

That is fine for a prototype, but not enough for a scalable product.

---

## 7.2 Recommended backend entities

Move to real persistence.

### Core tables / collections

#### Users

Stores user accounts.

#### Runs

One mission or question session.

Fields:

* id
* user_id
* title
* prompt
* status
* created_at
* updated_at
* visibility (private/public)
* public_slug (nullable)

#### TeamConfigs

Stores the team setup used for the run.

Fields:

* id
* run_id
* lead_role
* members_json
* debate_mode
* output_style
* length

#### Outputs

Stores the generated results.

Fields:

* id
* run_id
* final_answer_markdown
* debate_logs_json
* score
* tokens
* cost

#### Files

Stores file metadata for uploaded context.

Fields:

* id
* run_id
* user_id
* filename
* storage_url
* mime_type

#### Templates

Reusable official or user-created team templates.

Fields:

* id
* user_id nullable
* name
* description
* roles_json
* visibility
* created_at

---

## 7.3 Suggested API routes

### Runs

* `POST /api/runs` → create run
* `GET /api/runs` → get run history for sidebar
* `GET /api/runs/:id` → fetch full run
* `DELETE /api/runs/:id` → delete run

### Templates

* `GET /api/templates` → official + user templates
* `POST /api/templates` → create custom template
* `GET /api/templates/:id` → fetch template details

### Sharing

* `POST /api/runs/:id/share` → make run public and generate slug
* `POST /api/runs/:id/unshare` → revert to private
* `GET /api/shared/:slug` → public read-only page

### Files

* `POST /api/files/upload`
* `DELETE /api/files/:id`

---

## 8. Frontend state model

Use explicit UI mode.

```ts
interface AppState {
  mode: "new" | "viewing";
  selectedRunId: string | null;
  builderDraft: {
    prompt: string;
    files: UploadedFile[];
    teamTemplateId?: string;
    teamMembers: TeamMember[];
    debateMode: "fast" | "balanced" | "deep";
    outputStyle: "bullets" | "paragraphs";
    length: "short" | "medium" | "long";
  };
  currentRun: Run | null;
  currentOutput: Output | null;
}
```

### Key idea

Do not let the UI depend only on whether `selectedRun` exists.

The app should know explicitly whether the user is:

* starting a fresh run
* viewing an old run

---

## 9. Routing recommendation

### Private app routes

* `/app/new`
* `/app/run/:id`
* `/app/templates`

### Public routes

* `/`
* `/templates/[slug]`
* `/use-cases/[slug]`
* `/shared/[slug]`
* `/blog/[slug]`

---

---

## Out of scope for v4.0

The following are tracked in later versions and must not be started here:

* Database, API persistence, user accounts → **v4.1**
* Public sharing, export full debate → **v4.2**
* SEO pages, Next.js migration → **v5.0**

---

## Implementation

### Phase 1 — Empty-state UX ✅ DONE

* ✅ `+ New Run` button in `TopNav.tsx`, wired to `startNewQuestion` in `App.tsx`
* ✅ `startNewQuestion` clears `selectedId`, `result`, `activity`
* ✅ Sidebar selection synced via `setSelectedId(null)`

---

### Phase 1b — Client-Side Routing (React Router v6)

**Goal:** Give every screen a real URL — sessions become shareable, browser back/forward works, and v4.2 public sharing becomes possible.  
**Library:** `react-router-dom` v6. Not TanStack Router, not Next.js (v5 scope).  
**Prerequisite for:** v4.2 (sharing) and v5.0 (SEO).

#### Routes

| Route | What it shows |
|-------|---------------|
| `/` | Redirect → `/app/new` |
| `/app/new` | Empty compose state (CommandBar, no result) |
| `/app/run/:id` | Session view — loads session by URL param |
| `/shared/:slug` | Stub now — filled in v4.2 |

#### Subtasks

**1. Install and wire the router**
- [ ] `npm install react-router-dom` in `frontend/`
- [ ] `frontend/src/main.tsx` — wrap `<App />` in `<BrowserRouter>`

**2. Define routes**
- [ ] `App.tsx` — add `<Routes>` with the four routes above
- [ ] `/` → `<Navigate to="/app/new" replace />`
- [ ] `/app/new` → existing empty compose view (CommandBar visible, no result)
- [ ] `/app/run/:id` → session view (ChatPanel + result)
- [ ] `/shared/:slug` → `<div>Coming soon</div>` placeholder

**3. Replace state-driven navigation with URL navigation**
- [ ] `startNewQuestion` in `App.tsx` — replace `setSelectedId(null)` with `navigate('/app/new')`
- [ ] Sidebar session click — replace `setSelectedId(id)` with `navigate('/app/run/${id}')`
- [ ] `TopNav` New Run button — already calls `startNewQuestion`, no change needed

**4. Read session ID from URL on load**
- [ ] In `/app/run/:id` route — call `useParams()` to get `id`
- [ ] On mount / when `id` changes — call existing `selectSession(id)` to load the session
- [ ] If `id` not found in history — show a "Session not found" fallback message

**5. Update CLAUDE.md**
- [ ] Replace the "No routing library" line with:
  > Routing: React Router v6 (`react-router-dom`). Routes: `/app/new`, `/app/run/:id`, `/shared/:slug`. Navigate with `useNavigate`. Read params with `useParams`. Do not add SSR or file-based routing without instruction.

---

### Phase 2 — Team Templates

**Goal:** Make team templates a first-class feature in the compose flow so users can start faster and discover the product's range.  
**Scope:** Frontend only — templates are hardcoded data in `frontend/src/data/`. No backend API needed.

#### Starter templates (hardcoded)

1. Programmer Team
2. UX / Product Team
3. Startup GTM Team
4. Research & Writing Team
5. Investment Debate Team
6. Technical Architecture Review Team
7. Resume / Career Team
8. Marketing Campaign Team

#### Subtasks

**1. Add template data**
- [ ] `frontend/src/data/templates.ts` — define a `TeamTemplate` type and export the 8 templates above
- [ ] Each template has: `id`, `name`, `description`, `members` (array of `TeamMember`)

**2. Template chips below the prompt**
- [ ] New component `TemplateShortcutRow.tsx` — renders 4–5 chips (most popular templates)
- [ ] Place it in `CommandBar.tsx` between the textarea and `CommandContextFooter`
- [ ] Clicking a chip calls `onSelectTemplate(template)` passed down from `App.tsx`

**3. Wire template selection in App.tsx**
- [ ] `onSelectTemplate` handler — calls `setTeam(template.members)` to preload the team
- [ ] Does not auto-submit — user still clicks Ask

**4. Templates drawer in top nav**
- [ ] New component `TemplateDrawer.tsx` — slide-in panel listing all 8 templates
- [ ] Each card shows: name, description, member roles
- [ ] "Use this team" button calls `onSelectTemplate` and closes the drawer
- [ ] Add `Templates` button to `TopNav.tsx` — opens the drawer

**5. Visual feedback**
- [ ] When a template is active, `CommandBarHeaderRow` or `CommandBarTeamAvatars` shows which template is loaded
- [ ] User can still manually edit the team after selecting a template
