# Email Sync and Mobile Optimizations Implementation Plan

**Goal:** Fix the Draft Mail pending bidders/items sync logic to support default/undefined statuses correctly, and optimize the layout of toolbars and email sections for mobile screens.

---

### Task 1: Fix Draft Mail Syncing Logic

- [ ] **Step 1: Update bidder filtering in `renderEmailReminders`**
  Modify the filter block inside `renderEmailReminders` to treat undefined or missing statuses as pending (`'not_submitted'`), ensuring sync alignment with the matrix UI:
  ```javascript
  const pendingBidders = state.bidders.filter(b => {
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email);
    if (!isEmailValid) return false;
    return state.checklistItems.some(item => (b.statuses[item] || 'not_submitted') === 'not_submitted');
  });
  ```

- [ ] **Step 2: Update item lists in `populateEmailEditor` and stacked views**
  Ensure email body builders resolve status lists with the default `'not_submitted'` fallback:
  ```javascript
  const missing = state.checklistItems.filter(item => (bidder.statuses[item] || 'not_submitted') === 'not_submitted');
  ```

---

### Task 2: Optimize Mobile UI Layouts

- [ ] **Step 1: Add mobile responsive toolbar styles to `<style>` block**
  Add media queries to `index.html` stylesheet to stack toolbars vertically and make buttons full-width on screens below 600px:
  ```css
  @media (max-width: 600px) {
    .matrix-toolbar, .catalogue-toolbar, .email-toolbar {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 0.75rem !important;
    }
    .matrix-toolbar .left-actions, 
    .matrix-toolbar .right-actions,
    .catalogue-toolbar .filter-group {
      flex-direction: column !important;
      width: 100% !important;
      align-items: stretch !important;
      gap: 0.5rem !important;
    }
    .matrix-toolbar .btn, 
    .email-toolbar .btn,
    .catalogue-toolbar .search-input,
    .catalogue-toolbar .filter-select {
      width: 100% !important;
      min-width: 0 !important;
    }
    .email-layout-split {
      grid-template-columns: 1fr !important;
      height: auto !important;
      gap: 1rem !important;
    }
    .email-left-panel {
      max-height: 200px !important;
    }
  }
  ```

---

### Task 3: Verification & Push to GitHub

- [ ] **Step 1: Test sync behavior**
  Verify that adding custom checklist items updates the draft list correctly.
- [ ] **Step 2: Test mobile display**
  Resize the viewport to mobile dimensions, confirming that elements wrap cleanly.
- [ ] **Step 3: Push changes**
  Push verified code changes to GitHub repository.
