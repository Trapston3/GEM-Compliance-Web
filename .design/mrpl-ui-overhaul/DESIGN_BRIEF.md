# MRPL Compliance UI Overhaul — Design Brief

## Status

Approved direction with execution gates. This document is planning-only; implementation begins only after review of these artifacts.

## Product problem

MRPL Compliance is a tender operations tool for materials officers. The current UI exposes the right capabilities, but the hierarchy is unclear: navigation is split between the sidebar, header pills, and page tabs; tender cards provide little decision context; and the compliance matrix assumes users already understand abbreviated statuses.

The redesign should make the next useful action obvious for a first-time user without slowing down experienced officers who work through many bidder/checklist cells.

## Users and core jobs

- Regular users: create, switch, configure, and review their own tenders.
- Guests: manage their own drafts and tender configuration, but cannot permanently delete data.
- Superusers: do all regular work plus inspect every tender, identify ownership, and reassign owners.
- Primary job: determine what needs attention, update compliance state, and draft a clear bidder email.

## Design direction

Calm industrial utility: Swiss structure, restrained typography, warm paper workspace, deep ink navigation, and functional color. The interface should feel dependable and legible in an office environment, not like a marketing dashboard.

Liquid Glass decision: skip true Liquid Glass and broad `backdrop-filter` usage. On older office hardware, translucent blur across large scrolling regions can cause expensive compositing and paint work, especially around the matrix. Use solid surfaces, 1px borders, controlled shadows, and occasional opacity only where it does not blur content. No glass effect is allowed behind the compliance grid.

## Explicit status-to-color contract

This mapping is the source of truth for matrix cells, bidder summaries, legends, email previews, exports, and accessibility labels.

| Checklist category | Stored state / visual state | User-facing label | Color family | Light token | Dark token | Icon / treatment | Meaning |
|---|---|---|---|---|---|---|---|
| `submission` | `submitted` | Submitted | Green | `#087f5b` | `#52c99a` | Check circle, filled green control | Required document is present |
| `submission` | `not_submitted` | Pending submission | Amber | `#b45309` | `#f7b955` | Clock, amber outline/soft fill | Required document is not yet submitted; action needed |
| `submission` | `not_applicable` | Not applicable | Slate | `#64748b` | `#a7b1c2` | Minus circle, slate fill | Item does not apply to this bidder |
| `acceptance` | `accepted` | Accepted | Green | `#087f5b` | `#52c99a` | Check circle, filled green control | Clause accepted without unresolved objection |
| `acceptance` | `not_accepted` | Not accepted | Red | `#c2413b` | `#ff8179` | Alert triangle, red filled/outlined control | Clause is not accepted and requires resolution |
| `acceptance` | `not_applicable` | Not applicable | Slate | `#64748b` | `#a7b1c2` | Minus circle, slate fill | Clause does not apply |
| `text_note` | non-empty note | Note added | Indigo/violet note treatment | `#635bce` | `#a8a2ff` | Note icon, indigo border and tinted surface | A deviation or observation exists; not a pass/fail state |
| `text_note` | empty note | No note | Quiet neutral | `#94a3b8` | `#7f8ba3` | Empty note icon, dashed neutral treatment | No deviation text recorded |

Rules:

1. `not_submitted` must never share the red `not_accepted` treatment.
2. `not_accepted` must never be represented as generic pending amber.
3. `text_note` must never be assigned green, amber, or red based only on whether text exists.
4. Every color also needs a text label or icon; color alone is not a valid status signal.
5. Summaries must preserve category meaning: “3 pending submissions”, “2 clauses not accepted”, and “1 note added” are separate counts.

## Information architecture

### Global shell

Desktop uses one persistent sidebar with My Tenders, the active tender workspace sections, Account, and Admin for superusers. The header shows the current tender, current section, and a single Switch tender action.

Mobile uses a compact top bar and a bottom navigation for Overview, Bidders, Matrix, and More. More contains Checklist, Emails, Settings, Account, and Sign out in a touch-friendly sheet.

### My Tenders

The home base contains page context, search, Active/Archived filter, sorting, summary counts, and useful tender cards. Superusers see an explicit owner badge/name when a card belongs to somebody else; regular users do not see irrelevant ownership metadata.

### Tender workspace

Every tender route shares the same context bar and section navigation:

- Overview: what needs attention now.
- Bidder Catalogue: search and bidder-level progress.
- Compliance Matrix: dense cell-level review.
- Checklist: configure requirements.
- Emails: select a flagged bidder and draft a response.
- Settings: tender metadata, duplicate, archive, delete.

## Responsive principles

- Design from 375px upward.
- Minimum touch target: 44px.
- Minimum mobile input text: 16px.
- No horizontally overflowing headers or pill navigation.
- Matrix mobile mode is bidder-first and vertical; comparison mode is an explicit secondary action.
- Forms become full-height sheets on mobile.
- Sticky actions include safe-area bottom padding.
- Desktop can optimize for density; mobile optimizes for one decision at a time.

## Accessibility and performance

- WCAG AA contrast for text, controls, and status states.
- Keyboard-visible focus on every interactive element.
- Status names exposed to screen readers.
- Respect `prefers-reduced-motion`.
- No blur or backdrop-filter on the matrix, large card grids, or scrolling page shells.
- Keep animations limited to opacity/color and short 150–220ms transitions.

## Success criteria

- A first-time user can identify where to start and open a tender without explanation.
- A superuser can identify tender ownership from the My Tenders page.
- A user can distinguish pending submissions, not-accepted clauses, and notes without reading a legend repeatedly.
- No desktop page has large unexplained dead space around primary content.
- The most important tender workflows are usable at 375px without horizontal page overflow.
- Each implementation phase has its own Vercel Preview URL, QA report, and explicit user sign-off before the next phase begins.
