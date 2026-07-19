# MRPL UI Overhaul Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the performance-safe visual foundation and reusable UI primitives for the MRPL Compliance overhaul without changing later-phase page workflows.

**Architecture:** Add semantic CSS custom properties to the existing global stylesheet, expose small composable React primitives under `src/components/ui`, and centralize checklist status presentation in a typed helper. Existing page layouts remain behaviorally unchanged; the shell receives only token-level styling improvements.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, TypeScript, Lucide React, existing custom `Dialog` and `Toast` components.

---

## Scope guard

This phase includes tokens, primitives, accessibility defaults, shell color normalization, and verification. It does not redesign My Tenders, the matrix, bidder catalogue, emails, settings, or admin pages. It does not add a UI dependency or any `backdrop-filter` usage.

## Task 1: Add the token layer and global accessibility rules

**Files:**
- Modify: `src/app/globals.css`

- [ ] Add light/dark MRPL tokens for ink, paper, surfaces, lines, blue, status colors, spacing, radii, touch targets, and content width.
- [ ] Define explicit status tokens for submitted, pending submission, not accepted, not applicable, note added, and note empty.
- [ ] Normalize body background, foreground, selection, focus-visible, button/input minimum targets, and reduced-motion behavior.
- [ ] Keep the existing print stylesheet and add no blur or backdrop filter.

## Task 2: Add typed status presentation contract

**Files:**
- Create: `src/lib/statusPresentation.ts`

- [ ] Define separate submission, acceptance, and text-note status types.
- [ ] Map pending submission to amber, not accepted to red, and text notes to indigo/quiet dashed treatments rather than pass/fail colors.
- [ ] Return label, class names, and accessible description from one typed function for future matrix work.

## Task 3: Add reusable UI primitives

**Files:**
- Create: `src/components/ui/primitives.tsx`

- [ ] Implement composable `Button`, `Badge`, `Card`, `EmptyState`, `PageHeader`, `SectionHeader`, `Tabs`, and `StatusLegend` components.
- [ ] Implement `Sheet` as a small, mobile-friendly modal primitive with escape and overlay close behavior.
- [ ] Give controls 44px minimum touch targets and preserve native keyboard semantics.
- [ ] Use CSS variables and solid surfaces; do not introduce animation libraries.

## Task 4: Normalize the application shell

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/ui/dialog.tsx`

- [ ] Replace the most visible shell color literals with semantic MRPL classes/tokens.
- [ ] Increase mobile header, navigation, close, theme, and sign-out controls to the shared target size.
- [ ] Remove dialog backdrop blur while retaining a solid scrim and preserve its existing API.
- [ ] Preserve route behavior, sign-out behavior, theme toggle behavior, and print behavior.

## Task 5: Verify and preview

**Files:**
- No production files beyond Tasks 1–4.

- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Search the phase diff for `backdrop-filter` and confirm none was introduced.
- [ ] Check print rules remain present.
- [ ] Deploy only this phase with `npx vercel deploy -y` and report the fresh Preview URL.
- [ ] Stop for explicit user sign-off before Phase 2.

## Exit criteria

- Existing routes still compile and shell interactions are unchanged.
- The status contract preserves the distinctions required by the approved brief.
- No scrolling region uses glass blur or continuous animation.
- Lint and production build pass, or any pre-existing failure is reported with evidence.
- A Preview URL is available and no production deployment is performed.
