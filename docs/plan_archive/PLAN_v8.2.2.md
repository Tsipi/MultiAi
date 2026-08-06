# v8.2.2 — Public shared-run page dumps the raw follow-up packet as the Question — Done

Unplanned follow-on to v8.2.1, same branch (`PLAN_v8.0`). Found 2026-08-06 while verifying the
v8.2.1 fix on a public share. Index: `PLAN_v8.0.md`.

**Scope:** Frontend only. The shared API payload already carries every field needed
(`shared.py` returns `session.to_dict()`, which is `asdict(self)` over the whole `DebateSession`),
so no backend or schema change.

**Status:** Done (Tasks 1, 2, 4-9), all user-verified on desktop and mobile. Task 3 — the internal
repair note baked into stored `final_answer` text — was deliberately deferred and is carried forward
as separate scope. Two checks remain that need production: the social/OG preview, and sharing a
non-follow-up run that had a file attachment.

Scope note: began as a shared-page correctness fix (Tasks 1-4) and broadened into a presentation
pass on the public page plus sidebar title casing (Tasks 5-6) at the user's direction.

**Verified:** `npx tsc --noEmit` clean; `npm test` — 33 passed across 8 files. Public shared page
confirmed by the user on desktop and mobile.

---

## Symptom

On a publicly shared follow-up run, the `Question` card renders the entire raw follow-up packet:

```
Original prompt:
compare the 10 most cap market USA stocks 2026 vs 2016

Previous final answer:
**The Bottom Line**
... the whole parent answer, including its markdown table shown as raw `|` pipes ...
Note: Relevance remained imperfect after repair. Please add more specific constraints...

Follow-up instruction:
prove why an ETF beats a single stock, pros and cons
```

Three separate problems in one card:

1. The reader sees a machine-facing packet with `Original prompt:` / `Previous final answer:` /
   `Follow-up instruction:` scaffolding, not a question.
2. The parent answer's markdown table renders as raw pipe characters, because the card prints plain
   text — it is roughly 40 lines of visual noise before the actual question appears.
3. Internal diagnostics leak. The screenshot shows
   `Note: Relevance remained imperfect after repair.` — an engine-internal message
   ([engine.py:277-280](backend/consensus/engine.py#L277-L280)) — published on a public page.

The final answer below it renders correctly, so this is presentation of the question only. It is
also the single worst-looking surface in the product for a first-time visitor, since a shared link
is exactly what a new user clicks first.

---

## Root cause

[SharedRunPage.tsx:59](frontend/src/pages/SharedRunPage.tsx#L59) renders the raw field:

```tsx
<p className="text-sm text-foreground/90 whitespace-pre-wrap">{result.question}</p>
```

For a follow-up, `result.question` **is** the packet — the frontend composes it at
[App.tsx:252-256](frontend/src/App.tsx#L252-L256) and the backend stores it verbatim as
`session.question`. (This is the same packet whose misuse caused v8.2.1; here it is a display
problem, not a correctness one.)

The logged-in app already solves this. `SessionPromptBlock` branches on `result.is_followup`
([SessionPromptBlock.tsx:380](frontend/src/components/session/SessionPromptBlock.tsx#L380)) and
renders a structured view from the individual fields — `root_question`, collapsible ancestor
answers via `PinnedAnswer`, then `followup_instruction`
([SessionPromptBlock.tsx:89-146](frontend/src/components/session/SessionPromptBlock.tsx#L89-L146)).
`SharedRunPage` was written as a minimal standalone page and never picked that branch up.

### Second defect on the same line — non-follow-up runs

`result.question` also carries inlined attachment text: the engine appends
`\n\nUser-provided files:\n<extracted text>` at
[engine.py:93](backend/consensus/engine.py#L93). The app strips this for display via
`stripAttachmentBlock` / `promptTextForDisplay`
([promptDisplay.ts:33-44](frontend/src/lib/promptDisplay.ts#L33-L44)); the shared page does not. So
**any** shared run with an attachment publishes the extracted file contents into the Question card.
Same one-line root cause, worth fixing in the same pass.

Note that `base_question` is not a shortcut here: the engine sets `base_question=question`
([engine.py:121](backend/consensus/engine.py#L121)), which for a follow-up is the packet again. The
structured fields are the only reliable source.

---

## Open decision — should the parent answer be public at all?

Sharing a follow-up currently republishes its parent session's full final answer, because
`source_final_answer` is stored on the child session and returned in the shared payload. The parent
session may itself be private and never deliberately shared.

This is already true today (it is inside the packet blob), so it is a pre-existing exposure that
this work should decide about rather than silently carry forward.

| Option | Public Question card shows | Notes |
|--------|---------------------------|-------|
| **A (recommended)** | Root question (small label) + follow-up instruction (headline). No parent answer. | Cleanest read; removes the exposure. The shared page is a showcase, not an audit trail. |
| **B** | As A, plus parent answer in a collapsed `PinnedAnswer`, closed by default. | Mirrors the app view; keeps context for readers who want it. Exposure remains, just folded away. |
| **C** | Strip `source_final_answer` from the shared API response entirely. | Backend change; strongest privacy posture. Larger scope, contradicts this doc's frontend-only scope. |

**Decided 2026-08-06: Option A.** The public card shows the root question as a small "Follow-up to"
line plus the follow-up instruction; the parent answer is not rendered. Note this is a display
decision, not a transport one — `source_final_answer` is still present in the shared JSON payload,
so anyone reading the network response can still see it. Option C remains available if that matters
later.

---

## Fix plan

### Task 1 — Extract a pure, testable view model — Done
- [x] Added [sharedPromptView.ts](frontend/src/lib/sharedPromptView.ts) exporting
      `sharedPromptView(result): { isFollowup, rootQuestion, instruction, attachments }`.
      `previousAnswer` dropped from the shape — Option A means it is never rendered, so returning it
      would just re-expose what the decision removed.
- [x] Follow-up: `rootQuestion` from `root_question || source_prompt`, `instruction` from
      `followup_instruction`, both through `stripAttachmentBlock`.
- [x] Non-follow-up: `instruction` from `promptTextForDisplay(result)`, `rootQuestion` empty.
- [x] `attachments` from the existing `attachmentListForDisplay(result)`.
- [x] Legacy guard: a follow-up with an empty `followup_instruction` promotes `rootQuestion` into
      `instruction` and clears `rootQuestion`, so such a session shows a real question rather than a
      blank card. `base_question` is deliberately not used as a fallback — for a follow-up it holds
      the packet ([engine.py:121](backend/consensus/engine.py#L121)).
- [x] Pure helper rather than in-component logic because the frontend has no component-test tooling
      (no `@testing-library`, no jsdom); every existing test is a `.ts` pure-function or hook test.

### Task 2 — Rewire the shared page — Done
- [x] Replaced the raw `{result.question}` paragraph with a local `SharedQuestionCard` component in
      [SharedRunPage.tsx](frontend/src/pages/SharedRunPage.tsx), driven by `sharedPromptView`.
- [x] Follow-up layout: muted `Follow-up to:` line carrying the root question, then the instruction
      as the prominent question text.
- [x] Non-follow-up layout: unchanged appearance, fed the stripped text.
- [x] Attachments rendered with the existing `SessionAttachmentList`.
- [x] Question kept as plain text with `whitespace-pre-wrap`; not routed through `MarkdownView`.
- [x] Card self-hides when there is neither question text nor an attachment.

### Task 3 — Stop publishing the internal repair note — Not done (deferred by user 2026-08-06)
Decision: leave as-is. v8.2.1 makes the repair path fire far less often, so few new sessions will
carry the note; pre-fix sessions keep it. Revisit only if it reappears.

- [ ] The `Note: Relevance remained imperfect after repair.` string
      ([engine.py:277-280](backend/consensus/engine.py#L277-L280)) is appended into
      `final_answer`, so it is already baked into stored answers and will still render inside the
      Final Answer block on old sessions even after Tasks 1-2.
- [ ] Decide with the user: leave as-is (v8.2.1 makes the repair path fire far less often), or move
      the note out of `final_answer` into a dedicated session field the public view can suppress.
      The latter is a backend + schema change and probably its own subphase — flag, do not bundle.

### Task 4 — Tests — Done
- [x] [sharedPromptView.test.ts](frontend/src/lib/sharedPromptView.test.ts), 4 cases:
      realistic follow-up packet (asserts `instruction` is the instruction alone, and that neither
      rendered field contains `NVIDIA`, `Previous final answer:`, the repair note, or a `|` table
      pipe); legacy follow-up with no instruction; plain run with an attachment block (asserts
      `SECRET` file text is stripped and the attachment is listed); plain run unchanged.
- [x] `npx tsc --noEmit` clean; `npm test` — 28 passed across 7 files.

### Task 5 — Public-page presentation pass — Done
User-directed layout changes on the shared page, specified 2026-08-06 against an annotated
screenshot. All in [SharedRunPage.tsx](frontend/src/pages/SharedRunPage.tsx) except the
capitalisation, which lives in the helper so it stays testable.

- [x] (1) Breathing room above the logo — header is now `pb-4 pt-8 sm:pt-10` instead of `py-3`.
- [x] (1, 2) Logo, `TeamStoa` wordmark, and a new `Your AI decision council` tagline are wrapped in
      a single anchor to `https://www.teamstoa.com`. Tagline wording and styling copied from the
      existing brand block in [LoginPage.tsx:49-52](frontend/src/pages/LoginPage.tsx#L49-L52) so
      the shared page matches the rest of the product. Icon enlarged to match that block too.
- [x] (3) Header is a `grid-cols-[auto_1fr_auto]`: brand left, `Shared run` centred, new purple
      `Try for free` button right. The centre label is `hidden sm:block` so the narrow-screen header
      does not crush the brand against the button.
- [x] (3) `Try for free` routes to `/register`, which renders the register form for logged-out
      visitors ([App.tsx:582-585](frontend/src/App.tsx#L582-L585)). The pre-existing bottom
      `Try TeamStoa` button is unchanged.
- [x] (4) Question text is now `text-base font-semibold text-foreground` (was
      `text-sm text-foreground/90`), sits directly under the purple `Question` label, and has its
      first letter capitalised by `capitaliseFirst` in
      [sharedPromptView.ts](frontend/src/lib/sharedPromptView.ts) — first character only, so the
      user's own wording and casing are otherwise untouched.
- [x] (5) `Follow-up to:` moved below the question text.
- [x] (6) Score badge and round count moved out of their own row and onto the right-hand side of the
      `Final Answer` header row via `justify-between`.

Note: only the main question is capitalised. The `Follow-up to:` line still shows the root question
exactly as the user typed it.

### Task 6 — Presentation revisions after visual review — Done
Second pass on 2026-08-06 after the user saw Task 5 rendered.

- [x] Brand now links to `/` via `<Link>` instead of the absolute `https://www.teamstoa.com`.
      Reaches the same landing page in production while staying in-environment for dev and preview
      builds. The `TEAMSTOA_URL` constant is gone.
- [x] `Shared run` removed from the header centre — it read as stranded floating text. The header is
      now a simple `flex justify-between`: brand left, `Try for free` right. The three-column grid
      and the `hidden sm:block` breakpoint workaround are both gone, which also removes the mobile
      crowding risk flagged under Task 5.
- [x] The marker moved into the Question card's purple label, which now reads
      `QUESTION - SHARED RUN`. The `- Shared run` half is a slightly lighter violet
      (`violet-500/70`) so it reads as a qualifier rather than part of the label.
- [x] `capitaliseFirst` extracted from `sharedPromptView.ts` into
      [textCase.ts](frontend/src/lib/textCase.ts).
- [x] Sidebar session titles capitalised — **first attempt went to the wrong file.**
      `Sidebar.tsx` is not imported anywhere (dead code), so that edit had no effect and the user
      still saw lowercase titles. The live component is
      [AnswersPanel.tsx](frontend/src/components/session/AnswersPanel.tsx), used by both
      `ConsensusRunsSidebar` (desktop) and `MobileSessionsSheet` (mobile); its two title expressions
      are now wrapped in `capitaliseFirst`. The `Sidebar.tsx` edit was reverted rather than left in,
      to keep the diff free of dead-code churn.

Fixed at display rather than at generation, so existing stored titles are corrected too — a change
to `export_title.py` would only affect newly created sessions.

### Task 7 — Footer on the shared page — Done
- [x] Added a footer below the `Try TeamStoa` button, copied verbatim from
      [LandingPage.tsx:330-337](frontend/src/pages/LandingPage.tsx#L330-L337): copyright with the
      current year, then About / Privacy / Terms links. Same markup and classes, so the public run
      page and the landing page stay visually identical at the bottom.
- [x] Moved the safe-area bottom inset off `<main>` (`pb-safe` removed) and onto the footer's
      `pb-[calc(env(safe-area-inset-bottom,0px)+2.5rem)]`, matching the landing page — otherwise the
      inset would have been applied twice on notched devices.

### Task 8 — Attachment chips: destructive click and blank preview tab — Done
Two user-reported bugs, 2026-08-06, both about attachment chips.

- [x] **Compose chip deleted the file on any click.** The whole chip in
      [AttachmentChipList.tsx](frontend/src/components/primitives/AttachmentChipList.tsx) was a
      remove button with a destructive hover, so it looked like a file link but turned red and
      vanished when clicked — alarming mid-run. Split it: the filename is now inert text and only a
      small `X` button removes, with an `aria-label`/tooltip naming the file.
- [x] **Saved-session chip opened a blank tab.** `SessionAttachmentList` called
      `window.open(f.data)`, and `f.data` is a `data:` URL for PDFs and images. Browsers block
      top-level navigation to `data:` URLs, so the tab opened empty. New
      [openAttachment.ts](frontend/src/lib/openAttachment.ts) converts the attachment to a Blob and
      opens a `blob:` URL instead, revoking it after 60s.
- [x] The Blob conversion also handles text attachments, which store **raw text rather than a data
      URL** — the old code would have tried to navigate to the file's contents as a relative URL.
- [x] Tests: `openAttachment.test.ts` — base64 PDF decodes to a blob with the right MIME and bytes,
      raw text is wrapped correctly, and empty or corrupt payloads return `null` rather than opening
      a blank tab.

### Task 9 — PDF/Markdown export leaked extracted attachment text — Done
User-reported 2026-08-06: exporting a follow-up whose parent run had a PDF attachment dumped the
attachment's entire extracted text into the `Original Prompt` section.

- [x] [ChatPanel.tsx](frontend/src/components/debate/ChatPanel.tsx) built the export's
      `originalPrompt` from `source_prompt || root_question || base_question || question` with no
      stripping. Those fields carry the backend's `\n\nUser-provided files:\n<extracted text>` block
      ([engine.py:93](backend/consensus/engine.py#L93)). Now wrapped in `stripAttachmentBlock`.
- [x] Same leak found and fixed in `pdfTitleFromResult`, which fed `r.question` straight into the
      document title — a plain run with an attachment would have put extracted file text in the
      PDF's heading. Not user-reported; found while tracing the first one.

The app's own view already stripped this
([SessionPromptBlock.tsx:102](frontend/src/components/session/SessionPromptBlock.tsx#L102)), so the
export was the one surface that had never been updated.

Trade-off to confirm: attachment **names** no longer appear in exports at all, since the only reason
they showed was the dumped `[File: ...]` header inside that block. `ExportData` has no attachments
field. Adding a compact `Attachments: report.pdf` line would need a small exporter change.

Known adjacent issues, not fixed:
- `Sidebar.tsx` appears to be unused entirely. Worth confirming and deleting in a cleanup pass.
- `AnswersPanel` falls back to `run.question` when `run_title` is empty; for a follow-up that field
  is the raw packet, so such a row would read `Original prompt: ...`. Same packet-leak family as the
  rest of this subphase; not seen in practice since `run_title` is normally set.
- Removing an attachment is still possible while a run is in flight. It has no effect on the request
  already sent, but the UI allows an action that cannot do anything.

---

## Verify

User-confirmed 2026-08-06, desktop and mobile — plus sidebar title capitalisation (after the
`AnswersPanel` refix) and both attachment-chip behaviours:

- [x] `/shared/:slug` Question card shows the follow-up instruction, not the packet, with no raw
      pipe characters.
- [x] Question card label reads `QUESTION - SHARED RUN`; question is bold with a capitalised first
      letter; `Follow-up to:` sits below it.
- [x] Header renders without collision at mobile width; footer renders correctly.
- [x] Score badge and round count sit on the right of the `Final Answer` row.
- [x] Sidebar runs list renders capitalised titles.
- [x] Compose chip no longer deletes on a filename click; saved-session PDF chip opens the file
      instead of a blank tab.

- [x] Export a run whose parent had a PDF attachment: `Original Prompt` shows only the question, and
      the PDF title has no file text in it (Task 9).

Verified in production after deploy:

- [x] Shared non-follow-up run with a file attachment: extracted file text no longer appears; the
      file shows as a downloadable chip under `Additional files`.
- [x] Social/OG preview for a shared link renders the TeamStoa card correctly (per-question OG stays
      v8.4 scope).
- [x] Footer About / Privacy / Terms links resolve; `Try for free` opens the register form.
- [x] Dark mode reads correctly. User note: the body grey could be lighter — cosmetic, not now.

Two follow-ups raised by that pass, neither in this subphase:
- The shared page offers the **source attachment itself** for download, because `attachment_files`
  carries base64 data in the public payload. **Decision 2026-08-06: keep it downloadable** — a
  shared run stays self-contained evidence. Noted here so the exposure is a recorded choice rather
  than an accident.
- PDF export mangles Hebrew and any non-Latin script. Pre-existing and unrelated to this subphase;
  the app's own view renders it correctly. Planned as `PLAN_v8.2.3.md`.

---

## Out of scope

- The packet construction in `App.tsx` — the debate needs it (established in v8.2.1).
- The logged-in `SessionPromptBlock` view, which already renders this correctly.
- PDF/Markdown export, which already uses the structured follow-up fields
  ([exporter.ts:127-132](frontend/src/services/pdf/exporter.ts#L127-L132)).
- Adding component-test tooling to the frontend — noted as a gap, not addressed here.

## Risk and rollback

Low. One new pure helper plus a presentational swap inside one page component; no backend, schema,
or stored-data change. Rollback is reverting the commit. The only behavioral question is the Open
decision on the parent answer, which changes what a public visitor can see.
