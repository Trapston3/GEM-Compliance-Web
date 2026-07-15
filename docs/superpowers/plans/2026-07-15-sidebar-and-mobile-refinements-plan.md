# Sidebar and Mobile Refinements Implementation Plan

**Goal:** Modify `index.html` to optimize the mobile hamburger menu navigation, ensure it auto-closes, and add light-mode color themes to the sidebar.

---

### Task 1: Update index.html Theme Variables & CSS Rules

- [ ] **Step 1: Set light-mode sidebar color tokens in `:root`**
  Modify the root color declarations:
  - `--bg-sidebar` should be a light color (e.g. Zinc 100 `#f4f4f5`) in light mode.
  - `--bg-sidebar-hover` should be Zinc 200 `#e4e4e7` in light mode.
  - `--text-sidebar` should be Zinc 600 `#71717a` in light mode.
  - `--text-sidebar-active` should be Zinc 950 `#09090b` in light mode.

- [ ] **Step 2: Move dark-mode sidebar color tokens to `body.dark`**
  Under `body.dark`, add:
  - `--bg-sidebar: #18181b;`
  - `--bg-sidebar-hover: #27272a;`
  - `--text-sidebar: #a1a1aa;`
  - `--text-sidebar-active: #ffffff;`

- [ ] **Step 3: Force white text on active navigation items for contrast**
  Ensure `.nav-item.active` always has white text:
  ```css
  .nav-item.active {
    background-color: var(--accent);
    color: #ffffff !important;
  }
  ```

---

### Task 2: Implement Mobile Auto-Close and Click-Outside in index.html JavaScript

- [ ] **Step 1: Update navigation item clicks to close sidebar**
  Inside the `DOMContentLoaded` event listener for `.nav-item` clicks, ensure the sidebar class `mobile-active` is removed when a section is loaded.

- [ ] **Step 2: Add click-outside dismiss handler**
  Add a global document click listener: if the click targets anything outside the sidebar and the mobile menu button when `mobile-active` is active, remove `mobile-active`.

---

### Task 3: Verification & Push to GitHub

- [ ] **Step 1: Test mobile responsiveness**
  Check that the hamburger menu opens and auto-closes when a nav link is clicked or when tapping outside.
- [ ] **Step 2: Test Light/Dark mode sidebar**
  Toggling light mode should turn the sidebar light gray with dark text, keeping active items in indigo/white.
- [ ] **Step 3: Git Push**
  Push all verified modifications to the GitHub remote repository.
