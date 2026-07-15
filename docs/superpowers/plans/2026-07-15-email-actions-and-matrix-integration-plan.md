# Email Actions and Matrix Integration Plan

**Goal:** Integrate a "Draft Mail" shortcut directly into the Checklist Matrix header for each bidder, and implement a "Check Again" (refresh) action in the Email section for both single editor and stacked batch draft layouts.

---

### Task 1: Add "Draft Mail" Shortcut to Checklist Matrix Header

- [ ] **Step 1: Modify bidder actions block inside `renderMatrix()`**
  In the bidder headers loop inside `renderMatrix()`, insert a new envelope button that routes to the mail draft section:
  ```html
  <button class="icon-btn" onclick="routeToDraftMail('${b.id}')" title="Draft Reminder Mail">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
  </button>
  ```

---

### Task 2: Implement "Check Again" Buttons in Email Section

- [ ] **Step 1: Add "Check Again" button in index.html Email Editor markup**
  Add a button with id `#email-refresh-btn` to the active editor controls in `index.html`:
  ```html
  <button class="btn btn-secondary" id="email-refresh-btn">Check Again</button>
  ```

- [ ] **Step 2: Bind the "Check Again" action in DOMContentLoaded script**
  Listen for click events on `#email-refresh-btn` to re-trigger `renderEmailReminders()` and fetch updated status logs.

- [ ] **Step 3: Integrate "Check Again" button inside Stacked Draft All cards**
  In the batch email loop, render a button for each card that calls a global helper function:
  ```html
  <button class="btn btn-secondary" onclick="refreshStackedDraft(this, '${b.id}')" style="padding:4px 8px; font-size:11px;">Check Again</button>
  ```

- [ ] **Step 4: Implement `refreshStackedDraft` helper function**
  Define `window.refreshStackedDraft(btn, bidderId)` in the script section. It will dynamically recalculate gaps and reload the editor elements in place.

---

### Task 3: Verification & Push

- [ ] **Step 1: Test "Draft Mail" in Matrix**
  Ensure the envelope button correctly changes sections and targets the bidder.
- [ ] **Step 2: Test "Check Again" triggers**
  Modify document status variables elsewhere, click the check buttons, and verify the draft updates.
- [ ] **Step 3: Git Push**
  Push changes to GitHub.
