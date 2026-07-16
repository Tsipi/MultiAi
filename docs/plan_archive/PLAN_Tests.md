# Deferred Test Coverage & Dead Code Audit

Running list of test-coverage work explicitly deferred out of a shipped version, and of dead/orphaned code found while auditing this repo. Separate from PLAN.md/ROADMAP.md — those track feature/phase status, not test or cleanup debt. Not itself a versioned plan.

---

## From v5.1 (Phase 5.1.4 - API Hardening And Tests)

**Source:** `docs/plan_archive/PLAN_v5.1.md`, deferred pending user approval.

- [ ] Add automated tests covering: auth state, user session scoping, admin-only behavior, and quota enforcement

---

## Dead code audit — files claimed deleted but still present, plus unused components

**Why:** Found while adding a CLAUDE.md summary row for `components/compose/` — `ComposerAdvanced.tsx` was cited as deleted in `PLAN_v6.1.md` but still exists on disk. Triggered a broader check of every "delete" claim across `docs/plan_archive/*.md` against current `frontend/src/` state, plus the `LeadRoleField.tsx` check requested directly.

**To do — confirmed dead, safe to delete (pending approval):**

- [ ] `frontend/src/components/compose/ComposerAdvanced.tsx` — claimed deleted in `docs/plan_archive/PLAN_v6.1.md` (lines 66, 117, 130: "Delete — content distributed to the three tab components"; "Delete `DebateSettings.tsx` and `ComposerAdvanced.tsx`"; "fully deleted with no dangling imports") but the file still exists (54 lines). Confirmed: zero imports anywhere in `frontend/src`, and it's already absent from `compose/index.ts`'s barrel exports — pure orphaned leftover, the deletion itself just never happened.
- [ ] `frontend/src/components/primitives/LeadRoleField.tsx` — not claimed deleted anywhere, but confirmed dead: still re-exported via `primitives/index.ts` (`export { LeadRoleField } from "./LeadRoleField"`), but no other file imports or renders it. The "Lead expert role" field it implements is now inlined directly in `AdvancedTabTeam.tsx` (v6.1's tab redesign) via `FieldLabelWithTip` + `Input`, not this component. Looks superseded by v6.1 — remove the component and its barrel export line if confirmed unused.
- [ ] `frontend/src/components/primitives/SettingsBar.tsx` — `PLAN_v6.1.md` deliberately emptied this file (not deleted) "to avoid breaking any external references" (its own in-file comment says the same). Confirmed zero references anywhere in `frontend/src`, including no barrel export in `primitives/index.ts` — the caution appears to have been unnecessary. Candidate for full deletion now that nothing depends on the shell.

**Verified correctly deleted already (no action needed — listed for audit completeness):**

- `frontend/src/components/DebateActivityFeed.tsx` — claimed deleted in `docs/plan_archive/PLAN_v3.1.md` (Phase 1.1, "Delete — confirmed no imports in any `.tsx` or `.ts` file") — confirmed gone.
- `frontend/src/components/primitives/DebateSettings.tsx` — claimed deleted in `docs/plan_archive/PLAN_v6.1.md` alongside `ComposerAdvanced.tsx` — confirmed gone.

**Scope note:** this was a grep for "delete/remove/dead/unused" language across `docs/plan_archive/*.md`, not a full unused-export audit of the whole frontend — other stale claims or genuinely dead files may exist outside what that phrasing caught.
