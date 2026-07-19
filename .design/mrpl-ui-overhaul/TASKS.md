# MRPL Compliance UI Overhaul — Phased Task List

## Delivery contract

Each phase is an isolated implementation unit:

1. Implement only that phase.
2. Run lint, build, and targeted click-path checks.
3. Deploy that phase to a fresh Vercel Preview URL.
4. Share the Preview URL and a short QA report.
5. Stop and wait for explicit user sign-off.
6. Only then begin the next phase.

No big-bang merge. Production promotion happens only after all phases are signed off.

## Phase 1 — Foundations and performance-safe tokens

- [ ] Add the proposed token layer to the global theme.
- [ ] Normalize light/dark workspace, sidebar, surface, line, focus, and status colors.
- [ ] Add reusable primitives for Button, Badge, Card, EmptyState, PageHeader, SectionHeader, Tabs, Sheet/Modal, and StatusLegend.
- [ ] Add 44px touch target and reduced-motion rules.
- [ ] Confirm no `backdrop-filter` is introduced in scrolling regions.
- [ ] Verify print styles remain intact.
- [ ] Preview gate: screenshots at 375px, 768px, and 1440px; lint/build pass.

## Phase 2 — Application shell and navigation

- [ ] Replace split navigation with one coherent desktop shell.
- [ ] Add current tender context and active section state.
- [ ] Implement mobile drawer and bottom navigation.
- [ ] Ensure header never overflows at 375px.
- [ ] Preserve Account, Admin, theme toggle, and sign out behavior.
- [ ] Preview gate: navigate every shell link at desktop and mobile; explicit sign-off required.

## Phase 3 — My Tenders workspace

- [ ] Redesign My Tenders page with search, Active/Archived filter, sorting, and summary counts.
- [ ] Add richer tender cards with bidder count, checklist count, last updated, and primary Open action.
- [ ] Add onboarding empty state.
- [ ] Add owner indicator/name on cards only when a superuser is viewing a tender they do not own.
- [ ] Verify owner data is scoped correctly and does not leak to regular users.
- [ ] Preview gate: create, switch, archive/unarchive, owner visibility, and mobile card interactions.

## Phase 4 — Overview and bidder catalogue

- [ ] Reframe Overview around Needs attention and actionable quick actions.
- [ ] Redesign bidder catalogue as searchable rows/cards with compliance summary.
- [ ] Make destructive actions secondary and clearly labeled.
- [ ] Preserve add, edit, delete, and email-draft behavior.
- [ ] Preview gate: bidder CRUD, search, responsive card layout, and role permissions.

## Phase 5 — Checklist and compliance matrix

- [ ] Implement the status mapping in `DESIGN_BRIEF.md` exactly.
- [ ] Add visible status legend and accessible labels.
- [ ] Redesign desktop matrix with sticky checklist/bidder context and readable labels.
- [ ] Implement bidder-first mobile matrix mode.
- [ ] Keep text notes visually indigo/neutral: note added vs no note, never red/green/amber.
- [ ] Verify status updates, optimistic state, rollback, print, and Excel export.
- [ ] Preview gate: all category/status combinations, keyboard navigation, 375px matrix workflow.

## Phase 6 — Emails, settings, and admin

- [ ] Redesign email drafting with readable editor surface and sticky mobile actions.
- [ ] Reorganize settings by details, duplication, lifecycle, and destructive actions.
- [ ] Redesign Admin Dashboard using the same primitives.
- [ ] Preserve tender filter, owner reassignment, and audit history.
- [ ] Preview gate: email copy/mailto, settings actions, delete confirmation, admin permissions.

## Phase 7 — Hardening and visual QA

- [ ] Run full click-path audit across every user-facing control.
- [ ] Test user, guest, and superuser journeys.
- [ ] Verify no horizontal overflow at 375px, 768px, 1024px, and 1440px.
- [ ] Verify light/dark contrast and keyboard focus.
- [ ] Capture visual regression screenshots for all key routes.
- [ ] Run lint/build and production-like smoke tests.
- [ ] Deploy final Preview and wait for explicit sign-off before production promotion.

## Release blockers

- Any status color ambiguity between pending submission and not accepted.
- Any text note shown as a pass/fail status.
- Any owner data visible to a non-superuser.
- Any mobile page with horizontal document overflow.
- Any phase without a Preview URL and user sign-off.
- Any regression in bidder updates, matrix updates, email drafting, print, Excel export, or role permissions.

## Prompt-ready execution brief

Implement Phase 1 only from this task list. Use the existing Next.js 16, React 19, Tailwind CSS, and Lucide stack. Do not touch later phases. Use the tokens and status contract from the design artifacts. Work mobile-first, avoid Liquid Glass/backdrop-filter for old-office performance, preserve existing behavior, run lint/build and targeted visual checks, deploy a Vercel Preview, report the URL and QA results, then stop for explicit sign-off.
