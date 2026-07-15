# Checklist Matrix Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the checklist matrix app to shift the "Mark all N/A" bulk action from columns (bidders) to rows (checklist items), replace all emoji icons with custom stroke-based SVGs, and fix checklist item name truncation by enabling text wrapping in the sticky cells.

**Architecture:** 
- In `app.js`, remove `bulkMarkNA` and add `bulkMarkItemNA`.
- Replace the emoji buttons inside the matrix rendering loop with responsive inline SVG elements that use `currentColor`.
- In `styles.css`, modify the first-column class rules to allow wrapping.

**Tech Stack:** Plain HTML5, CSS3, SVG, Vanilla JS.

---

### Task 1: Shifting "Mark all N/A" Scope & Emojis to SVGs in app.js

**Files:**
- Modify: `C:/Users/traps/Documents/antigravity/blissful-turing/app.js`

- [ ] **Step 1: Replace emoji buttons and adjust headers in `renderMatrix`**
  Modify `renderMatrix` to:
  1. Remove the bulk N/A icon button from the header cells (leaving only Edit and Delete icons).
  2. Add the bulk N/A icon button to the checklist item first column cell (next to Rename and Delete).
  3. Replace all emojis (✏️, 🗑️, 🚫) with SVGs:
     - **Edit** (Pencil):
       ```html
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>
       ```
     - **Delete** (Trash):
       ```html
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
       ```
     - **Mark N/A** (Slash-circle):
       ```html
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
       ```

- [ ] **Step 2: Remove bulkMarkNA and implement bulkMarkItemNA in `app.js`**
  Modify the action methods in `app.js` to replace column-based `bulkMarkNA` with row-based `bulkMarkItemNA`.

- [ ] **Step 3: Commit app.js changes**
  Commit the app.js changes to the repository.

---

### Task 2: Allow Text Wrapping in Checklist Item Column

**Files:**
- Modify: `C:/Users/traps/Documents/antigravity/blissful-turing/styles.css`

- [ ] **Step 1: Modify first-cell styling in styles.css**
  Change `.matrix-table tbody tr td:first-child` to allow text wrapping, preventing truncation and keeping long names completely readable.
  
  Code change:
  ```css
  .matrix-table tbody tr td:first-child {
    position: sticky;
    left: 0;
    z-index: 20;
    background-color: var(--bg-card);
    font-weight: 500;
    box-shadow: inset -1px 0 0 var(--border-color);
    width: 250px;
    max-width: 250px;
    /* Wrap long checklist item text instead of hard-cutting it */
    white-space: normal;
    word-break: break-word;
  }
  ```

- [ ] **Step 2: Commit styles.css changes**
  Commit the styles.css changes to the repository.

---

### Task 3: Verification Run

- [ ] **Step 1: Verify in browser**
  1. Add a bidder and some long checklist items.
  2. Verify that long names wrap correctly and don't break the layout.
  3. Click "Mark all N/A" on a checklist row, and verify all cells in that row update to N/A.
  4. Ensure that all icons display as SVGs and toggle theme colors properly.
