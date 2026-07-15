# Tender Compliance Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Tender Compliance Tracker Single-Page Application (SPA) in three files (`index.html`, `styles.css`, `app.js`) utilizing SheetJS and html2pdf.js via CDN, featuring custom state persistence, a Linear-style design system, and full matrix and email-draft features.

**Architecture:** A Single-Page Application (SPA) driven by a single global reactive state. The UI is re-rendered dynamically when the state changes. Event delegation is used on the matrix table to avoid handler re-binding.

**Tech Stack:** Plain HTML5, CSS3, ES6 JavaScript, SheetJS (CDN), html2pdf.js (CDN).

---

### Task 1: Scaffolding and Static HTML Layout

**Files:**
- Create: `C:/Users/traps/Documents/antigravity/blissful-turing/index.html`

- [ ] **Step 1: Write index.html**
  Create the core skeleton of the application including the left sidebar, top header, main content layout, section wrappers for the SPA, modal dialogue structures, toast container, and script links to the CDNs.

  Code:
  ```html
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tender Compliance Tracker</title>
    <link rel="stylesheet" href="styles.css">
    <!-- Google Fonts Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- SheetJS (Excel) -->
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
    <!-- html2pdf.js (PDF) -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  </head>
  <body>
    <div class="app-layout">
      <!-- Fixed Left Sidebar -->
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
            <span class="logo-text">Compliance Tracker</span>
          </div>
          <div class="tender-title-container">
            <input type="text" id="global-tender-name" class="tender-name-input" placeholder="Enter Tender Name..." value="MRPL GeM Tender">
          </div>
        </div>
        <nav class="sidebar-nav">
          <button class="nav-item active" data-target="overview-section">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
            <span>Overview</span>
          </button>
          <button class="nav-item" data-target="matrix-section">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>
            <span>Checklist Matrix</span>
          </button>
          <button class="nav-item" data-target="catalogue-section">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Bidder Catalogue</span>
          </button>
          <button class="nav-item" data-target="add-bidder-section">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
            <span>Add Bidder</span>
          </button>
          <button class="nav-item" data-target="email-section">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span>Draft Mail</span>
          </button>
        </nav>
      </aside>

      <!-- Main Workspace -->
      <div class="workspace-wrapper">
        <!-- Top Header -->
        <header class="header">
          <button class="mobile-toggle" id="mobile-toggle" aria-label="Toggle Sidebar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <h1 class="current-section-title" id="page-title">Overview</h1>
          <div class="header-actions">
            <!-- Theme Toggle -->
            <button class="theme-toggle-btn" id="theme-toggle-btn" aria-label="Toggle theme">
              <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>
          </div>
        </header>

        <!-- Main Dynamic Content Wrapper -->
        <main class="content-container">
          <!-- SPA Sections -->
          <!-- 1. Overview Section -->
          <section id="overview-section" class="spa-section active">
            <div class="overview-grid" id="overview-stats-grid"></div>
            <div class="overview-visual-card card">
              <h3>Total Compliance Distribution</h3>
              <div class="distribution-bar-wrapper" id="overview-dist-bar"></div>
              <div class="distribution-labels" id="overview-dist-labels"></div>
            </div>
            <div class="follow-up-card card">
              <h3>Bidders Needing Follow-up</h3>
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Bidder Name</th>
                      <th>Email Address</th>
                      <th>Pending Checklist Items</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="overview-follow-up-list"></tbody>
                </table>
              </div>
            </div>
          </section>

          <!-- 2. Checklist Matrix Section -->
          <section id="matrix-section" class="spa-section">
            <div class="matrix-toolbar">
              <div class="left-actions">
                <button class="btn btn-primary" id="matrix-add-item-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>Add Checklist Item</span>
                </button>
                <button class="btn btn-secondary" id="matrix-add-bidder-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
                  <span>Quick Add Bidder</span>
                </button>
              </div>
              <div class="right-actions">
                <button class="btn btn-secondary" id="matrix-download-excel">Download Excel</button>
                <button class="btn btn-secondary" id="matrix-download-pdf">Download PDF</button>
                <button class="btn btn-secondary" id="matrix-print">Print</button>
              </div>
            </div>
            <div class="matrix-scroll-wrapper card" id="matrix-scroll-container">
              <!-- Rendered via JS -->
            </div>
          </section>

          <!-- 3. Bidder Catalogue Section -->
          <section id="catalogue-section" class="spa-section">
            <div class="catalogue-toolbar">
              <input type="text" class="search-input" id="catalogue-search" placeholder="Search by company name or email...">
              <div class="filter-group">
                <select id="catalogue-filter-status" class="filter-select">
                  <option value="all">All Bidders</option>
                  <option value="fully_submitted">Fully Submitted</option>
                  <option value="has_pending">Has Pending Items</option>
                </select>
                <select id="catalogue-sort" class="filter-select">
                  <option value="name_az">Name (A-Z)</option>
                  <option value="most_pending">Most Pending First</option>
                  <option value="recently_added">Recently Added</option>
                </select>
              </div>
            </div>
            <div class="catalogue-grid" id="catalogue-grid-container"></div>
          </section>

          <!-- 4. Add Bidder Section -->
          <section id="add-bidder-section" class="spa-section">
            <div class="form-wrappercard card">
              <h3>Create Bidder Record</h3>
              <form id="add-bidder-form" novalidate>
                <div class="form-group">
                  <label for="bidder-name">Company Name <span class="required">*</span></label>
                  <input type="text" id="bidder-name" class="form-input" placeholder="Larsen & Toubro Ltd" required>
                  <div class="error-msg" id="name-error-msg"></div>
                </div>
                <div class="form-group">
                  <label for="bidder-email">Contact Email <span class="required">*</span></label>
                  <input type="email" id="bidder-email" class="form-input" placeholder="tender@company.com" required>
                  <div class="error-msg" id="email-error-msg"></div>
                </div>
                <div class="form-group">
                  <label for="bidder-contact-person">Contact Person</label>
                  <input type="text" id="bidder-contact-person" class="form-input" placeholder="John Doe">
                </div>
                <div class="form-group">
                  <label for="bidder-phone">Phone Number</label>
                  <input type="text" id="bidder-phone" class="form-input" placeholder="+91 9876543210">
                </div>
                <button type="submit" class="btn btn-primary btn-block">Add Bidder</button>
              </form>
            </div>
            <div class="recently-added-wrapper card">
              <h3>Recently Added Bidders</h3>
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Company Name</th>
                      <th>Email Address</th>
                      <th>Contact Person</th>
                      <th>Date Added</th>
                    </tr>
                  </thead>
                  <tbody id="recently-added-list"></tbody>
                </table>
              </div>
            </div>
          </section>

          <!-- 5. Draft Mail Section -->
          <section id="email-section" class="spa-section">
            <div class="email-toolbar">
              <button class="btn btn-primary" id="email-draft-all-btn">Draft All Reminder Emails</button>
            </div>
            <div class="email-layout-split">
              <!-- Left Panel: Bidders list -->
              <div class="email-left-panel card">
                <h3>Bidders with Gaps</h3>
                <div class="email-bidder-list" id="email-bidders-list-container"></div>
              </div>
              <!-- Right Panel: Editor -->
              <div class="email-right-panel card" id="email-editor-container">
                <div id="email-editor-active-state">
                  <div class="form-group">
                    <label>To</label>
                    <input type="text" id="email-to" class="form-input" readonly>
                  </div>
                  <div class="form-group">
                    <label>Subject</label>
                    <input type="text" id="email-subject" class="form-input">
                  </div>
                  <div class="form-group">
                    <label>Message Body</label>
                    <textarea id="email-body" class="form-textarea" rows="12"></textarea>
                  </div>
                  <div class="email-actions">
                    <button class="btn btn-primary" id="email-copy-btn">Copy to Clipboard</button>
                    <a href="#" class="btn btn-secondary" id="email-mailto-btn">Open in Mail App</a>
                  </div>
                  <div class="email-warning" id="email-length-warning"></div>
                </div>
                <div id="email-editor-empty-state" class="empty-state">
                  <!-- JS Rendered -->
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>

    <!-- Modals Section -->
    <!-- Bidder Detail & Status Modal -->
    <div class="modal" id="bidder-details-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="modal-bidder-title">Bidder Checklist Details</h3>
          <button class="modal-close-btn" id="close-details-modal">&times;</button>
        </div>
        <div class="modal-body" id="modal-bidder-body"></div>
      </div>
    </div>

    <!-- Bidder Edit Form Modal -->
    <div class="modal" id="bidder-edit-modal">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h3>Edit Bidder Details</h3>
          <button class="modal-close-btn" id="close-edit-modal">&times;</button>
        </div>
        <div class="modal-body">
          <form id="edit-bidder-form" novalidate>
            <div class="form-group">
              <label for="edit-name">Company Name <span class="required">*</span></label>
              <input type="text" id="edit-name" class="form-input" required>
              <div class="error-msg" id="edit-name-error"></div>
            </div>
            <div class="form-group">
              <label for="edit-email">Email Address <span class="required">*</span></label>
              <input type="email" id="edit-email" class="form-input" required>
              <div class="error-msg" id="edit-email-error"></div>
            </div>
            <div class="form-group">
              <label for="edit-contact">Contact Person</label>
              <input type="text" id="edit-contact" class="form-input">
            </div>
            <div class="form-group">
              <label for="edit-phone">Phone Number</label>
              <input type="text" id="edit-phone" class="form-input">
            </div>
            <button type="submit" class="btn btn-primary btn-block">Save Changes</button>
          </form>
        </div>
      </div>
    </div>

    <!-- Quick Add Bidder Modal -->
    <div class="modal" id="quick-add-modal">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h3>Quick Add Bidder</h3>
          <button class="modal-close-btn" id="close-quick-add-modal">&times;</button>
        </div>
        <div class="modal-body">
          <form id="quick-add-form" novalidate>
            <div class="form-group">
              <label for="quick-name">Company Name <span class="required">*</span></label>
              <input type="text" id="quick-name" class="form-input" required>
              <div class="error-msg" id="quick-name-error"></div>
            </div>
            <div class="form-group">
              <label for="quick-email">Email Address <span class="required">*</span></label>
              <input type="email" id="quick-email" class="form-input" required>
              <div class="error-msg" id="quick-email-error"></div>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Add Bidder</button>
          </form>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div class="modal" id="confirm-modal">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h3>Confirm Action</h3>
          <button class="modal-close-btn" id="close-confirm-modal">&times;</button>
        </div>
        <div class="modal-body">
          <p id="confirm-modal-message">Are you sure you want to proceed?</p>
          <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
            <button class="btn btn-secondary" id="confirm-cancel-btn">Cancel</button>
            <button class="btn btn-destructive" id="confirm-ok-btn">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="toast-container" id="toast-container"></div>

    <script src="app.js"></script>
  </body>
  </html>
  ```

- [ ] **Step 2: Commit Task 1**
  Commit the index.html setup.
  Run: `git add index.html; git commit -m "feat: scaffold index.html skeleton"`

---

### Task 2: CSS Stylesheet & Layout Framework

**Files:**
- Create: `C:/Users/traps/Documents/antigravity/blissful-turing/styles.css`

- [ ] **Step 1: Write styles.css**
  Write the styles.css file defining HSL light and dark mode colors, layout variables, typography rules, dark mode transition classes, and media print layout.

  Code:
  ```css
  /* ===== CSS CUSTOM PROPERTIES (THEME DESIGN) ===== */
  :root {
    --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    
    /* Theme Light Mode */
    --bg-main: #f8fafc;
    --bg-card: #ffffff;
    --bg-sidebar: #18181b; /* Zinc 900 (Always Dark sidebar) */
    --bg-sidebar-hover: #27272a;
    --border-color: #e2e8f0;
    
    --text-primary: #0f172a;
    --text-secondary: #64748b;
    --text-sidebar: #a1a1aa;
    --text-sidebar-active: #ffffff;
    
    --accent: #4f46e5;
    --accent-hover: #4338ca;
    --accent-light: #e0e7ff;
    
    /* Status Colors */
    --success: #16a34a; /* Green 600 */
    --success-bg: #dcfce7;
    
    --danger: #dc2626; /* Red 600 */
    --danger-bg: #fee2e2;
    
    --warning: #ca8a04; /* Amber 600 */
    --warning-bg: #fef9c3;
    
    --neutral: #64748b; /* Slate 500 */
    --neutral-bg: #f1f5f9;
    
    --shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
    --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  body.dark {
    /* Theme Dark Mode */
    --bg-main: #09090b;
    --bg-card: #18181b;
    --border-color: #27272a;
    
    --text-primary: #fafafa;
    --text-secondary: #a1a1aa;
    
    --accent: #6366f1;
    --accent-hover: #818cf8;
    --accent-light: rgba(99, 102, 241, 0.15);
    
    --success-bg: rgba(22, 163, 74, 0.15);
    --danger-bg: rgba(220, 38, 38, 0.15);
    --warning-bg: rgba(202, 138, 4, 0.15);
    --neutral-bg: #27272a;
    
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
  }

  /* Reset */
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: var(--font-sans);
    background-color: var(--bg-main);
    color: var(--text-primary);
    overflow: hidden;
    height: 100vh;
    font-size: 0.875rem;
    transition: background-color 0.2s, color 0.2s;
  }

  /* Layout Structure */
  .app-layout {
    display: flex;
    height: 100vh;
    width: 100vw;
  }

  /* Sidebar styling */
  .sidebar {
    width: 240px;
    background-color: var(--bg-sidebar);
    color: var(--text-sidebar);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    z-index: 100;
    transition: var(--transition);
  }
  .sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--bg-sidebar-hover);
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-sidebar-active);
    font-weight: 700;
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }
  .tender-title-container {
    width: 100%;
  }
  .tender-name-input {
    width: 100%;
    background-color: var(--bg-sidebar-hover);
    border: 1px solid transparent;
    color: var(--text-sidebar-active);
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 0.8rem;
    outline: none;
  }
  .tender-name-input:focus {
    border-color: var(--accent);
  }
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    gap: 0.25rem;
  }
  .nav-item {
    background: none;
    border: none;
    color: var(--text-sidebar);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    width: 100%;
    text-align: left;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.875rem;
    transition: var(--transition);
  }
  .nav-item:hover {
    background-color: var(--bg-sidebar-hover);
    color: var(--text-sidebar-active);
  }
  .nav-item.active {
    background-color: var(--accent);
    color: var(--text-sidebar-active);
  }

  /* Workspace styling */
  .workspace-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .header {
    height: 60px;
    background-color: var(--bg-card);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
    flex-shrink: 0;
  }
  .current-section-title {
    font-size: 1.25rem;
    font-weight: 700;
  }
  .mobile-toggle {
    display: none;
    background: none;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
  }
  .theme-toggle-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }
  .theme-toggle-btn:hover {
    background-color: var(--neutral-bg);
  }
  body.dark .sun-icon { display: block; }
  body.dark .moon-icon { display: none; }
  body:not(.dark) .sun-icon { display: none; }
  body:not(.dark) .moon-icon { display: block; }

  /* Content area */
  .content-container {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }
  .spa-section {
    display: none;
    flex-direction: column;
    gap: 1.5rem;
    animation: fadeIn 0.2s ease-in-out;
  }
  .spa-section.active {
    display: flex;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Card and visual design */
  .card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: var(--shadow);
  }
  .card h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text-primary);
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: 500;
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    transition: var(--transition);
    border: 1px solid transparent;
  }
  .btn-primary {
    background-color: var(--accent);
    color: white;
  }
  .btn-primary:hover {
    background-color: var(--accent-hover);
  }
  .btn-secondary {
    background-color: var(--bg-card);
    color: var(--text-primary);
    border-color: var(--border-color);
  }
  .btn-secondary:hover {
    background-color: var(--neutral-bg);
  }
  .btn-destructive {
    background-color: transparent;
    color: var(--danger);
    border-color: var(--danger);
  }
  .btn-destructive:hover {
    background-color: var(--danger-bg);
  }
  .btn-block {
    width: 100%;
  }

  /* Tables styling */
  .table-container {
    overflow-x: auto;
    width: 100%;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.85rem;
  }
  .data-table th, .data-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-color);
  }
  .data-table th {
    font-weight: 600;
    color: var(--text-secondary);
    background-color: var(--neutral-bg);
  }

  /* Status Badge Pills */
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    gap: 4px;
  }
  .badge::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  .badge-submitted {
    background-color: var(--success-bg);
    color: var(--success);
  }
  .badge-submitted::before { background-color: var(--success); }
  .badge-pending {
    background-color: var(--danger-bg);
    color: var(--danger);
  }
  .badge-pending::before { background-color: var(--danger); }
  .badge-na {
    background-color: var(--neutral-bg);
    color: var(--neutral);
  }
  .badge-na::before { background-color: var(--neutral); }

  /* Forms & Validation styling */
  .form-wrapper {
    max-width: 500px;
    margin: 0 auto;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 1rem;
  }
  .form-group label {
    font-weight: 500;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  .required { color: var(--danger); }
  .form-input, .form-textarea {
    width: 100%;
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    color: var(--text-primary);
    font-family: inherit;
    font-size: 0.875rem;
    outline: none;
    transition: var(--transition);
  }
  .form-input:focus, .form-textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-light);
  }
  .form-input.invalid {
    border-color: var(--danger);
  }
  .error-msg {
    color: var(--danger);
    font-size: 0.75rem;
    min-height: 15px;
  }

  /* Overview Dashboard Styles */
  .overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }
  .stat-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.25rem;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .stat-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.1;
  }
  .stat-value.success-text { color: var(--success); }
  .stat-value.warning-text { color: var(--warning); }
  .distribution-bar-wrapper {
    height: 16px;
    background-color: var(--neutral-bg);
    border-radius: 8px;
    display: flex;
    overflow: hidden;
    margin: 1.5rem 0 1rem 0;
  }
  .dist-segment {
    height: 100%;
    transition: var(--transition);
  }
  .dist-segment-submitted { background-color: var(--success); }
  .dist-segment-pending { background-color: var(--danger); }
  .dist-segment-na { background-color: var(--neutral); }
  .distribution-labels {
    display: flex;
    gap: 1.5rem;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-secondary);
  }
  .dist-label-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .dist-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  /* Catalogue view */
  .catalogue-toolbar, .matrix-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    padding: 1rem;
    border-radius: 12px;
    box-shadow: var(--shadow);
  }
  .search-input {
    flex: 1;
    min-width: 250px;
    background-color: var(--bg-main);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    color: var(--text-primary);
    outline: none;
    font-size: 0.875rem;
  }
  .search-input:focus {
    border-color: var(--accent);
  }
  .filter-group {
    display: flex;
    gap: 0.5rem;
  }
  .filter-select {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    padding: 0.5rem;
    border-radius: 6px;
    color: var(--text-primary);
    outline: none;
    cursor: pointer;
  }
  .catalogue-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }
  .bidder-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 200px;
  }
  .bidder-card-header {
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.75rem;
    margin-bottom: 0.75rem;
  }
  .bidder-card-title {
    font-size: 1rem;
    font-weight: 600;
  }
  .bidder-card-email {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.125rem;
  }
  .bidder-card-stats {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .card-progress-bar-wrapper {
    height: 8px;
    background-color: var(--neutral-bg);
    border-radius: 4px;
    overflow: hidden;
  }
  .card-progress-bar {
    height: 100%;
    background-color: var(--accent);
  }
  .dot-breakdown {
    display: flex;
    gap: 0.75rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
  .bidder-card-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: auto;
  }
  .bidder-card-actions .btn {
    padding: 0.35rem 0.75rem;
    font-size: 0.75rem;
  }

  /* Checklist Matrix (Table Spreadsheet styles) */
  .matrix-toolbar {
    margin-bottom: 0.5rem;
  }
  .matrix-scroll-wrapper {
    padding: 0;
    overflow: auto;
    max-height: calc(100vh - 200px);
    width: 100%;
    position: relative;
  }
  .matrix-table {
    border-collapse: collapse;
    width: max-content;
    min-width: 100%;
    font-size: 0.8rem;
  }
  .matrix-table th, .matrix-table td {
    border-right: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
    padding: 0.5rem 0.75rem;
  }
  .matrix-table th {
    background-color: var(--bg-card);
    font-weight: 600;
  }
  /* Sticky Position Setup */
  .matrix-table thead tr th {
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: inset 0 -1px 0 var(--border-color);
  }
  /* Top-left corner cell must be highly layered */
  .matrix-table thead tr th:first-child {
    left: 0;
    z-index: 30;
    background-color: var(--bg-card);
    box-shadow: inset -1px -1px 0 var(--border-color);
  }
  .matrix-table tbody tr td:first-child {
    position: sticky;
    left: 0;
    z-index: 20;
    background-color: var(--bg-card);
    font-weight: 500;
    box-shadow: inset -1px 0 0 var(--border-color);
    width: 250px;
    max-width: 250px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .th-bidder-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .th-bidder-name {
    font-weight: 600;
    color: var(--text-primary);
  }
  .th-bidder-email {
    font-size: 0.7rem;
    font-weight: 400;
    color: var(--text-secondary);
  }
  .th-bidder-actions {
    display: flex;
    gap: 4px;
    margin-top: 4px;
  }
  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .icon-btn:hover {
    background-color: var(--neutral-bg);
    color: var(--text-primary);
  }
  .icon-btn-danger:hover {
    background-color: var(--danger-bg);
    color: var(--danger);
  }

  /* Segmented Controls */
  .segmented-control {
    display: inline-flex;
    background-color: var(--neutral-bg);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 2px;
    gap: 2px;
  }
  .seg-btn {
    border: none;
    background: none;
    padding: 3px 8px;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 4px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: var(--transition);
  }
  .seg-btn:hover {
    color: var(--text-primary);
  }
  .seg-btn.active[data-status="submitted"] {
    background-color: var(--success);
    color: white;
  }
  .seg-btn.active[data-status="not_submitted"] {
    background-color: var(--danger);
    color: white;
  }
  .seg-btn.active[data-status="not_applicable"] {
    background-color: var(--neutral);
    color: white;
  }

  /* Email Reminders Layout */
  .email-layout-split {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 1.5rem;
    height: calc(100vh - 220px);
    align-items: stretch;
  }
  .email-left-panel, .email-right-panel {
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  .email-bidder-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .email-bidder-item {
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: var(--transition);
    text-align: left;
    background-color: var(--bg-card);
  }
  .email-bidder-item:hover {
    border-color: var(--accent);
    background-color: var(--neutral-bg);
  }
  .email-bidder-item.active {
    background-color: var(--accent-light);
    border-color: var(--accent);
  }
  .email-bidder-item h4 {
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 2px;
  }
  .email-bidder-item span {
    font-size: 0.75rem;
    color: var(--danger);
    font-weight: 500;
  }
  .email-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
  }
  .email-warning {
    color: var(--danger);
    font-size: 0.75rem;
    margin-top: 0.5rem;
    font-weight: 500;
  }
  .stacked-emails-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
  }
  .stacked-email-item {
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 1.5rem;
  }
  .stacked-email-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  /* Modals Layout styling */
  .modal {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(9, 9, 11, 0.6);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 1rem;
    animation: fadeInModal 0.2s ease;
  }
  .modal.active {
    display: flex;
  }
  .modal-content {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    width: 100%;
    max-width: 600px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
  }
  .modal-content.modal-sm {
    max-width: 420px;
  }
  .modal-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .modal-close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
  }
  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
  }
  @keyframes fadeInModal {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Empty States UI */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
    text-align: center;
    background-color: var(--bg-card);
    border: 2px dashed var(--border-color);
    border-radius: 12px;
    gap: 1rem;
    width: 100%;
  }
  .empty-state-icon {
    color: var(--text-secondary);
  }
  .empty-state-msg {
    font-size: 0.95rem;
    color: var(--text-secondary);
  }

  /* Toast Notification */
  .toast-container {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 300;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .toast {
    background-color: var(--bg-sidebar);
    color: var(--text-sidebar-active);
    border: 1px solid var(--bg-sidebar-hover);
    padding: 0.75rem 1rem;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    animation: slideInToast 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .toast-link {
    color: var(--accent);
    text-decoration: underline;
    font-weight: 600;
    cursor: pointer;
    background: none;
    border: none;
  }
  @keyframes slideInToast {
    from { transform: translateY(100%) scale(0.9); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
  }

  /* Mobile Responsive adjustments */
  @media (max-width: 900px) {
    .sidebar {
      position: absolute;
      left: -240px;
      height: 100vh;
    }
    .sidebar.mobile-active {
      left: 0;
    }
    .mobile-toggle {
      display: block;
    }
    .email-layout-split {
      grid-template-columns: 1fr;
      height: auto;
    }
    .email-left-panel {
      max-height: 250px;
    }
  }

  /* Print Stylesheet overrides */
  @media print {
    body, html {
      background-color: white !important;
      color: black !important;
      overflow: visible !important;
      height: auto !important;
    }
    .sidebar, .header, .matrix-toolbar, .toast-container, .modal, .sidebar-nav, .theme-toggle-btn {
      display: none !important;
    }
    .app-layout {
      display: block !important;
    }
    .workspace-wrapper {
      display: block !important;
      overflow: visible !important;
    }
    .content-container {
      padding: 0 !important;
      overflow: visible !important;
    }
    .spa-section {
      display: none !important;
    }
    #matrix-section {
      display: block !important;
      overflow: visible !important;
    }
    .matrix-scroll-wrapper {
      overflow: visible !important;
      max-height: none !important;
      border: none !important;
      box-shadow: none !important;
    }
    .matrix-table {
      width: 100% !important;
      border-collapse: collapse !important;
    }
    /* Disable all position sticky for layout serialization */
    .matrix-table th, .matrix-table td {
      position: static !important;
      background-color: white !important;
      color: black !important;
      border: 1px solid #000 !important;
      box-shadow: none !important;
    }
    .segmented-control {
      border: none !important;
      background: none !important;
    }
    .seg-btn {
      display: none !important;
    }
    /* Explicitly print the active status button state */
    .seg-btn.active {
      display: inline-block !important;
      background: none !important;
      color: black !important;
      font-weight: bold !important;
      padding: 0 !important;
    }
    /* Print Headers clearly */
    .matrix-table thead tr th {
      border-bottom: 2px solid #000 !important;
    }
  }
  ```

- [ ] **Step 2: Commit Task 2**
  Commit the styles.css setup.
  Run: `git add styles.css; git commit -m "feat: design css system layout and theme styles"`

---

### Task 3: LocalStorage State Manager & Seeding

**Files:**
- Create: `C:/Users/traps/Documents/antigravity/blissful-turing/app.js`

- [ ] **Step 1: Write state initializers in app.js**
  Implement the standard localStorage state structure, seed default checklist items on startup, establish the auto-save debounce (300ms) with a try/catch wrapper, and initialize the SPA router listener.

  Code:
  ```javascript
  // ===== TENDER COMPLIANCE TRACKER CORE SCRIPT =====

  // 1. Initial Seeding checklist items
  const DEFAULT_CHECKLIST_ITEMS = [
    "DECLARATION ON BANNING or HOLIDAY LISTING",
    "NIL DEVIATION",
    "MSE-UDYAM",
    "ISO/NSIC",
    "INTEGRITY PACT",
    "UNDERTAKING WRT COMPLIANCE OF RESTRICTIONS FOR COUNTRIES WHICH SHARE LAND BORDER WITH INDIA",
    "SIGNED MRPL GPC & TD",
    "EMD",
    "LOCAL CONTENT & PA",
    "PRICE REDUCTION SCHEDULE (PRS) CLAUSE",
    "PERFORMANCE BANK GUARANTY (PBG) CUM SECURITY DEPOSIT (SD)",
    "PAYMENT TERMS AS PER GeM",
    "DELIVERY PERIOD AS PER TERMS AND CONDITIONS",
    "OFFER VALIDITY",
    "ANY OTHER DEVIATIONS"
  ];

  // 2. Global Application State
  let state = {
    tenderName: "MRPL GeM Tender",
    checklistItems: [...DEFAULT_CHECKLIST_ITEMS],
    bidders: []
  };

  // Debounce handle for auto-saving
  let saveDebounceTimer = null;

  // 3. LocalStorage persistence helpers
  function saveStateToStorage() {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
      try {
        localStorage.setItem("tender_compliance_state", JSON.stringify(state));
      } catch (err) {
        showToast("Error saving data to LocalStorage: " + err.message);
      }
    }, 300);
  }

  function loadStateFromStorage() {
    try {
      const data = localStorage.getItem("tender_compliance_state");
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && Array.isArray(parsed.checklistItems) && Array.isArray(parsed.bidders)) {
          state = parsed;
        }
      }
    } catch (err) {
      showToast("Error loading data from LocalStorage: " + err.message);
    }
  }

  // 4. Toast Notifications
  function showToast(message, viewCatalogueLink = false) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = "toast";
    
    const msgSpan = document.createElement("span");
    msgSpan.textContent = message;
    toast.appendChild(msgSpan);
    
    if (viewCatalogueLink) {
      const link = document.createElement("button");
      link.className = "toast-link";
      link.textContent = "View in Catalogue";
      link.addEventListener("click", () => {
        navigateToSection("catalogue-section");
        toast.remove();
      });
      toast.appendChild(link);
    }
    
    container.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // 5. Navigation Router
  function navigateToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll(".spa-section").forEach(sec => {
      sec.classList.remove("active");
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add("active");
    }
    
    // Toggle active tab inside sidebar
    document.querySelectorAll(".nav-item").forEach(btn => {
      if (btn.getAttribute("data-target") === sectionId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update page title
    const titles = {
      "overview-section": "Overview",
      "matrix-section": "Checklist Matrix",
      "catalogue-section": "Bidder Catalogue",
      "add-bidder-section": "Add Bidder",
      "email-section": "Draft Mail"
    };
    const titleHeader = document.getElementById("page-title");
    if (titleHeader) {
      titleHeader.textContent = titles[sectionId] || "Dashboard";
    }

    // Refresh contents of section
    renderActiveSection(sectionId);
  }

  // Placeholder router renderer
  function renderActiveSection(sectionId) {
    switch(sectionId) {
      case "overview-section": renderOverview(); break;
      case "matrix-section": renderMatrix(); break;
      case "catalogue-section": renderCatalogue(); break;
      case "add-bidder-section": renderAddBidder(); break;
      case "email-section": renderEmailReminders(); break;
    }
  }

  // DOMContentLoaded initialization
  document.addEventListener("DOMContentLoaded", () => {
    loadStateFromStorage();
    
    // Set Tender input field
    const tenderInput = document.getElementById("global-tender-name");
    if (tenderInput) {
      tenderInput.value = state.tenderName;
      tenderInput.addEventListener("input", (e) => {
        state.tenderName = e.target.value.trim();
        saveStateToStorage();
      });
    }

    // Navigation setup
    document.querySelectorAll(".nav-item").forEach(item => {
      item.addEventListener("click", () => {
        const target = item.getAttribute("data-target");
        navigateToSection(target);
      });
    });

    // Theme toggler
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      // Check saved preference
      const isDark = localStorage.getItem("dark_mode") === "true";
      if (isDark) document.body.classList.add("dark");
      
      themeBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        localStorage.setItem("dark_mode", document.body.classList.contains("dark"));
      });
    }

    // Mobile sidebar hamburger
    const mobileBtn = document.getElementById("mobile-toggle");
    const sidebar = document.getElementById("sidebar");
    if (mobileBtn && sidebar) {
      mobileBtn.addEventListener("click", () => {
        sidebar.classList.toggle("mobile-active");
      });
    }

    // Close modal on escape key
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".modal").forEach(modal => modal.classList.remove("active"));
      }
    });

    // Initial render
    navigateToSection("overview-section");
  });
  ```

- [ ] **Step 2: Commit Task 3**
  Commit the app.js skeleton.
  Run: `git add app.js; git commit -m "feat: initialize global state router and storage handlers"`

---

### Task 4: Section 1 - Overview Dashboard Rendering

**Files:**
- Modify: `C:/Users/traps/Documents/antigravity/blissful-turing/app.js`

- [ ] **Step 1: Write renderOverview inside app.js**
  Write the functions to compute stats, rendering the Stat Cards, the Horizontal Distribution progress bar, and the "Bidders Needing Follow-up" table.

  Code:
  ```javascript
  // Append to app.js
  function renderOverview() {
    const statsContainer = document.getElementById("overview-stats-grid");
    const distBar = document.getElementById("overview-dist-bar");
    const distLabels = document.getElementById("overview-dist-labels");
    const followUpList = document.getElementById("overview-follow-up-list");
    
    if (!statsContainer || !distBar || !distLabels || !followUpList) return;

    const totalBidders = state.bidders.length;
    const totalItems = state.checklistItems.length;
    
    // Status metrics counters
    let countSub = 0;
    let countPend = 0;
    let countNa = 0;

    // List of bidders with details
    const pendingBiddersList = [];

    state.bidders.forEach(b => {
      let bPending = 0;
      state.checklistItems.forEach(item => {
        const status = b.statuses[item] || 'not_submitted';
        if (status === 'submitted') countSub++;
        else if (status === 'not_applicable') countNa++;
        else {
          countPend++;
          bPending++;
        }
      });
      if (bPending > 0) {
        pendingBiddersList.push({ bidder: b, pendingCount: bPending });
      }
    });

    // Calculations
    const totalPossiblePoints = (totalBidders * totalItems) - countNa;
    const submissionRate = totalPossiblePoints > 0 ? ((countSub / totalPossiblePoints) * 100).toFixed(1) : "0.0";
    const pendingBiddersCount = pendingBiddersList.length;

    // 1. Render Stat Cards
    statsContainer.innerHTML = `
      <div class="stat-card">
        <span class="stat-label">Total Bidders</span>
        <span class="stat-value">${totalBidders}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Total Checklist Items</span>
        <span class="stat-value">${totalItems}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Overall Submission Rate</span>
        <span class="stat-value success-text">${submissionRate}%</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Bidders with Pending Items</span>
        <span class="stat-value ${pendingBiddersCount > 0 ? 'warning-text' : ''}">${pendingBiddersCount}</span>
      </div>
    `;

    // 2. Render Distribution Chart
    const totalStatuses = countSub + countPend + countNa;
    const pctSub = totalStatuses > 0 ? (countSub / totalStatuses * 100) : 0;
    const pctPend = totalStatuses > 0 ? (countPend / totalStatuses * 100) : 0;
    const pctNa = totalStatuses > 0 ? (countNa / totalStatuses * 100) : 0;

    distBar.innerHTML = `
      <div class="dist-segment dist-segment-submitted" style="width: ${pctSub}%" title="Submitted: ${countSub}"></div>
      <div class="dist-segment dist-segment-pending" style="width: ${pctPend}%" title="Pending: ${countPend}"></div>
      <div class="dist-segment dist-segment-na" style="width: ${pctNa}%" title="Not Applicable: ${countNa}"></div>
    `;

    distLabels.innerHTML = `
      <div class="dist-label-item"><span class="dist-dot" style="background-color: var(--success);"></span> Submitted (${countSub})</div>
      <div class="dist-label-item"><span class="dist-dot" style="background-color: var(--danger);"></span> Pending (${countPend})</div>
      <div class="dist-label-item"><span class="dist-dot" style="background-color: var(--neutral);"></span> Not Applicable (${countNa})</div>
    `;

    // 3. Render Follow-up Table
    if (pendingBiddersList.length === 0) {
      followUpList.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 2rem;">
            <div style="font-weight: 500; color: var(--text-secondary);">No bidders need follow-up. All clear!</div>
          </td>
        </tr>
      `;
    } else {
      // Sort: Most pending first
      pendingBiddersList.sort((a, b) => b.pendingCount - a.pendingCount);
      followUpList.innerHTML = pendingBiddersList.map(entry => `
        <tr>
          <td style="font-weight: 600;">${escapeHTML(entry.bidder.name)}</td>
          <td>${escapeHTML(entry.bidder.email)}</td>
          <td>
            <span class="badge badge-pending">${entry.pendingCount} missing</span>
          </td>
          <td>
            <button class="btn btn-secondary" onclick="routeToDraftMail('${entry.bidder.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
              Draft Reminder
            </button>
          </td>
        </tr>
      `).join('');
    }
  }

  // Global helper functions
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // Navigation shortcuts
  window.routeToDraftMail = function(bidderId) {
    navigateToSection("email-section");
    // Pre-select in mail view
    setTimeout(() => {
      const bidderItem = document.querySelector(`.email-bidder-item[data-id="${bidderId}"]`);
      if (bidderItem) bidderItem.click();
    }, 100);
  };
  ```

- [ ] **Step 2: Commit Task 4**
  Commit the overview renderer.
  Run: `git commit -a -m "feat: implement overview dashboard metrics and distribution progress metrics"`

---

### Task 5: Section 2 - Add Bidder Form & Recently Added

**Files:**
- Modify: `C:/Users/traps/Documents/antigravity/blissful-turing/app.js`

- [ ] **Step 1: Write renderAddBidder inside app.js**
  Write form validation logic, error displays, and recently added list rendering.

  Code:
  ```javascript
  // Append to app.js
  function renderAddBidder() {
    renderRecentlyAdded();
  }

  function renderRecentlyAdded() {
    const container = document.getElementById("recently-added-list");
    if (!container) return;

    if (state.bidders.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 1.5rem; color: var(--text-secondary);">
            No bidders added yet.
          </td>
        </tr>
      `;
      return;
    }

    // Last 5 added
    const recent = [...state.bidders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

    container.innerHTML = recent.map(b => `
      <tr>
        <td style="font-weight:600;">${escapeHTML(b.name)}</td>
        <td>${escapeHTML(b.email)}</td>
        <td>${escapeHTML(b.contactPerson) || '<span style="color:var(--text-secondary);">-</span>'}</td>
        <td style="font-size:0.8rem; color:var(--text-secondary);">${new Date(b.createdAt).toLocaleDateString()}</td>
      </tr>
    `).join('');
  }

  // Setup form submit listener
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("add-bidder-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const nameInput = document.getElementById("bidder-name");
        const emailInput = document.getElementById("bidder-email");
        const contactInput = document.getElementById("bidder-contact-person");
        const phoneInput = document.getElementById("bidder-phone");
        
        const nameErr = document.getElementById("name-error-msg");
        const emailErr = document.getElementById("email-error-msg");

        if (!nameInput || !emailInput || !contactInput || !phoneInput || !nameErr || !emailErr) return;

        let isValid = true;
        
        // Validate name
        const nameVal = nameInput.value.trim();
        if (!nameVal) {
          nameInput.classList.add("invalid");
          nameErr.textContent = "Company name is required.";
          isValid = false;
        } else {
          nameInput.classList.remove("invalid");
          nameErr.textContent = "";
        }

        // Validate email
        const emailVal = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailVal) {
          emailInput.classList.add("invalid");
          emailErr.textContent = "Email is required.";
          isValid = false;
        } else if (!emailRegex.test(emailVal)) {
          emailInput.classList.add("invalid");
          emailErr.textContent = "Please enter a valid email address.";
          isValid = false;
        } else {
          emailInput.classList.remove("invalid");
          emailErr.textContent = "";
        }

        if (!isValid) return;

        // Create new bidder status map defaulted to not_submitted
        const statuses = {};
        state.checklistItems.forEach(item => {
          statuses[item] = 'not_submitted';
        });

        const newBidder = {
          id: crypto.randomUUID(),
          name: nameVal,
          email: emailVal,
          contactPerson: contactInput.value.trim(),
          phone: phoneInput.value.trim(),
          createdAt: Date.now(),
          statuses: statuses
        };

        state.bidders.push(newBidder);
        saveStateToStorage();
        
        // Reset form
        form.reset();
        
        // Render confirmation
        showToast(`Bidder "${newBidder.name}" successfully added.`, true);
        renderRecentlyAdded();
      });
    }
  });
  ```

- [ ] **Step 2: Commit Task 5**
  Commit the Add Bidder functionality.
  Run: `git commit -a -m "feat: implement add bidder form with regex validation and recently added list"`

---

### Task 6: Section 3 - Bidder Catalogue Dashboard

**Files:**
- Modify: `C:/Users/traps/Documents/antigravity/blissful-turing/app.js`

- [ ] **Step 1: Write renderCatalogue inside app.js**
  Write searching, sorting, filtering, and catalog grid mapping.

  Code:
  ```javascript
  // Append to app.js
  function renderCatalogue() {
    const container = document.getElementById("catalogue-grid-container");
    const searchVal = (document.getElementById("catalogue-search")?.value || "").toLowerCase().trim();
    const filterStatus = document.getElementById("catalogue-filter-status")?.value || "all";
    const sortVal = document.getElementById("catalogue-sort")?.value || "name_az";

    if (!container) return;

    let filtered = [...state.bidders];

    // 1. Search Query
    if (searchVal) {
      filtered = filtered.filter(b => 
        b.name.toLowerCase().includes(searchVal) || 
        b.email.toLowerCase().includes(searchVal)
      );
    }

    // 2. Status Filters
    if (filterStatus === "fully_submitted") {
      filtered = filtered.filter(b => {
        return state.checklistItems.every(item => b.statuses[item] === 'submitted' || b.statuses[item] === 'not_applicable');
      });
    } else if (filterStatus === "has_pending") {
      filtered = filtered.filter(b => {
        return state.checklistItems.some(item => b.statuses[item] === 'not_submitted');
      });
    }

    // 3. Sort options
    if (sortVal === "name_az") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortVal === "most_pending") {
      filtered.sort((a, b) => {
        const countA = state.checklistItems.filter(item => a.statuses[item] === 'not_submitted').length;
        const countB = state.checklistItems.filter(item => b.statuses[item] === 'not_submitted').length;
        return countB - countA;
      });
    } else if (sortVal === "recently_added") {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    }

    // Empty state check
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <svg class="empty-state-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          <div class="empty-state-msg">No bidders found matching your filters.</div>
          <button class="btn btn-primary" onclick="navigateToSection('add-bidder-section')">Add a Bidder</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(b => {
      const totalItems = state.checklistItems.length;
      let countSub = 0;
      let countPend = 0;
      let countNa = 0;

      state.checklistItems.forEach(item => {
        const s = b.statuses[item] || 'not_submitted';
        if (s === 'submitted') countSub++;
        else if (s === 'not_applicable') countNa++;
        else countPend++;
      });

      const denominator = totalItems - countNa;
      const pct = denominator > 0 ? Math.round((countSub / denominator) * 100) : 0;
      const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email);

      return `
        <div class="bidder-card card">
          <div class="bidder-card-header">
            <h4 class="bidder-card-title">${escapeHTML(b.name)}</h4>
            <div class="bidder-card-email">${escapeHTML(b.email)}</div>
          </div>
          <div class="bidder-card-stats">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-weight:500;">
              <span>Progress</span>
              <span>${countSub}/${denominator} (${pct}%)</span>
            </div>
            <div class="card-progress-bar-wrapper">
              <div class="card-progress-bar" style="width: ${pct}%"></div>
            </div>
            <div class="dot-breakdown">
              <span><span style="color:var(--success)">●</span> ${countSub} Sub</span>
              <span><span style="color:var(--danger)">●</span> ${countPend} Pend</span>
              <span><span style="color:var(--neutral)">●</span> ${countNa} N/A</span>
            </div>
          </div>
          <div class="bidder-card-actions">
            <button class="btn btn-secondary" onclick="openDetailsModal('${b.id}')">Details</button>
            <button class="btn btn-secondary" onclick="openEditModal('${b.id}')">Edit</button>
            <button class="btn btn-destructive" onclick="openDeleteConfirm('${b.id}')">Delete</button>
            <button class="btn btn-primary" onclick="routeToDraftMail('${b.id}')" ${!isEmailValid || countPend === 0 ? 'disabled title="No pending items or invalid email"' : ''}>Email</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Setup toolbar filters list listeners
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("catalogue-search")?.addEventListener("input", renderCatalogue);
    document.getElementById("catalogue-filter-status")?.addEventListener("change", renderCatalogue);
    document.getElementById("catalogue-sort")?.addEventListener("change", renderCatalogue);
  });
  ```

- [ ] **Step 2: Commit Task 6**
  Commit the Catalogue logic.
  Run: `git commit -a -m "feat: implement bidder catalogue grid with searching, sorting, and state progress rendering"`

---

### Task 7: Modal Dialogue Operations (Details, Edit, Delete Bidders)

**Files:**
- Modify: `C:/Users/traps/Documents/antigravity/blissful-turing/app.js`

- [ ] **Step 1: Write Modal Handlers in app.js**
  Implement details modal rendering (listing items with inline segmented control status selectors), edit form submission (updating name/email with validation), and delete confirmation dialog logic.

  Code:
  ```javascript
  // Append to app.js
  let activeBidderId = null;

  // --- DETAILS MODAL ---
  window.openDetailsModal = function(bidderId) {
    activeBidderId = bidderId;
    const bidder = state.bidders.find(b => b.id === bidderId);
    if (!bidder) return;

    const modal = document.getElementById("bidder-details-modal");
    const title = document.getElementById("modal-bidder-title");
    const body = document.getElementById("modal-bidder-body");

    if (!modal || !title || !body) return;

    title.textContent = `Checklist: ${bidder.name}`;
    
    // Render list of statuses inside modal
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:10px;">
          Company Representative: ${escapeHTML(bidder.contactPerson) || 'N/A'} | Phone: ${escapeHTML(bidder.phone) || 'N/A'}
        </div>
        ${state.checklistItems.map(item => {
          const status = bidder.statuses[item] || 'not_submitted';
          return `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
              <span style="font-weight:500; font-size:0.85rem; max-width:60%;">${escapeHTML(item)}</span>
              <div class="segmented-control" data-bidder="${bidder.id}" data-item="${escapeHTML(item)}">
                <button class="seg-btn ${status==='submitted'?'active':''}" data-status="submitted">Sub</button>
                <button class="seg-btn ${status==='not_submitted'?'active':''}" data-status="not_submitted">Pend</button>
                <button class="seg-btn ${status==='not_applicable'?'active':''}" data-status="not_applicable">N/A</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    modal.classList.add("active");
  };

  // Close modals
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("close-details-modal")?.addEventListener("click", () => {
      document.getElementById("bidder-details-modal").classList.remove("active");
      renderActiveSection("catalogue-section");
    });
    
    document.getElementById("close-edit-modal")?.addEventListener("click", () => {
      document.getElementById("bidder-edit-modal").classList.remove("active");
    });

    document.getElementById("close-confirm-modal")?.addEventListener("click", () => {
      document.getElementById("confirm-modal").classList.remove("active");
    });

    document.getElementById("confirm-cancel-btn")?.addEventListener("click", () => {
      document.getElementById("confirm-modal").classList.remove("active");
    });
    
    // Details Modal Segmented buttons event delegation
    document.getElementById("modal-bidder-body")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".seg-btn");
      if (!btn) return;
      
      const container = btn.closest(".segmented-control");
      const bidderId = container.getAttribute("data-bidder");
      const itemName = container.getAttribute("data-item");
      const status = btn.getAttribute("data-status");

      const bidder = state.bidders.find(b => b.id === bidderId);
      if (bidder) {
        bidder.statuses[itemName] = status;
        saveStateToStorage();
        
        // Toggle active class visually
        container.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      }
    });

    // Edit Bidder Form submits
    document.getElementById("edit-bidder-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const bidder = state.bidders.find(b => b.id === activeBidderId);
      if (!bidder) return;

      const nameVal = document.getElementById("edit-name").value.trim();
      const emailVal = document.getElementById("edit-email").value.trim();
      const contactVal = document.getElementById("edit-contact").value.trim();
      const phoneVal = document.getElementById("edit-phone").value.trim();

      const nameErr = document.getElementById("edit-name-error");
      const emailErr = document.getElementById("edit-email-error");

      let isValid = true;
      if (!nameVal) {
        nameErr.textContent = "Name is required.";
        isValid = false;
      } else {
        nameErr.textContent = "";
      }

      if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        emailErr.textContent = "Please enter a valid email address.";
        isValid = false;
      } else {
        emailErr.textContent = "";
      }

      if (!isValid) return;

      bidder.name = nameVal;
      bidder.email = emailVal;
      bidder.contactPerson = contactVal;
      bidder.phone = phoneVal;

      saveStateToStorage();
      document.getElementById("bidder-edit-modal").classList.remove("active");
      showToast("Bidder details updated.");
      renderCatalogue();
    });
  });

  // --- EDIT MODAL ---
  window.openEditModal = function(bidderId) {
    activeBidderId = bidderId;
    const bidder = state.bidders.find(b => b.id === bidderId);
    if (!bidder) return;

    document.getElementById("edit-name").value = bidder.name;
    document.getElementById("edit-email").value = bidder.email;
    document.getElementById("edit-contact").value = bidder.contactPerson || '';
    document.getElementById("edit-phone").value = bidder.phone || '';

    document.getElementById("edit-name-error").textContent = "";
    document.getElementById("edit-email-error").textContent = "";

    document.getElementById("bidder-edit-modal").classList.add("active");
  };

  // --- DELETE MODAL ---
  let deleteTargetBidderId = null;
  window.openDeleteConfirm = function(bidderId) {
    deleteTargetBidderId = bidderId;
    const bidder = state.bidders.find(b => b.id === bidderId);
    if (!bidder) return;

    document.getElementById("confirm-modal-message").textContent = `Are you sure you want to delete bidder "${bidder.name}"? This action cannot be undone.`;
    document.getElementById("confirm-modal").classList.add("active");
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("confirm-ok-btn")?.addEventListener("click", () => {
      if (deleteTargetBidderId) {
        state.bidders = state.bidders.filter(b => b.id !== deleteTargetBidderId);
        saveStateToStorage();
        document.getElementById("confirm-modal").classList.remove("active");
        showToast("Bidder removed.");
        renderCatalogue();
      }
    });
  });
  ```

- [ ] **Step 2: Commit Task 7**
  Commit the Modal handling functions.
  Run: `git commit -a -m "feat: implement modal dialogues for bidder detailed checklist, edit form, and delete prompt"`

---

### Task 8: Section 4 - Checklist Matrix Spreadsheet Rendering

**Files:**
- Modify: `C:/Users/traps/Documents/antigravity/blissful-turing/app.js`

- [ ] **Step 1: Write renderMatrix inside app.js**
  Implement the sticky headers, horizontal scroll container, and 3-way segmented buttons inside the matrix layout table. Add **event delegation** inside the matrix tbody.

  Code:
  ```javascript
  // Append to app.js
  function renderMatrix() {
    const container = document.getElementById("matrix-scroll-container");
    if (!container) return;

    if (state.checklistItems.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="margin: 2rem;">
          <div class="empty-state-msg">No checklist items. Create one below:</div>
          <button class="btn btn-primary" onclick="promptAddChecklistItem()">Add Checklist Item</button>
        </div>
      `;
      return;
    }

    let html = `
      <table class="matrix-table" id="matrix-data-table">
        <thead>
          <tr>
            <th>Checklist Item</th>
    `;

    // Map bidder column headers
    state.bidders.forEach(b => {
      html += `
        <th>
          <div class="th-bidder-content">
            <span class="th-bidder-name" title="${escapeHTML(b.name)}">${escapeHTML(b.name)}</span>
            <span class="th-bidder-email">${escapeHTML(b.email)}</span>
            <div class="th-bidder-actions">
              <button class="icon-btn" onclick="openEditModal('${b.id}')" title="Edit Bidder">✏️</button>
              <button class="icon-btn icon-btn-danger" onclick="bulkMarkNA('${b.id}')" title="Mark all N/A">🚫</button>
              <button class="icon-btn icon-btn-danger" onclick="openDeleteConfirm('${b.id}')" title="Delete Bidder">🗑️</button>
            </div>
          </div>
        </th>
      `;
    });

    html += `
          </tr>
        </thead>
        <tbody>
    `;

    // Map rows (Checklist items)
    state.checklistItems.forEach(item => {
      html += `
        <tr data-item="${escapeHTML(item)}">
          <td>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <span class="item-name-text" title="${escapeHTML(item)}">${escapeHTML(item)}</span>
              <div style="display:flex; gap:2px; flex-shrink:0;">
                <button class="icon-btn" onclick="renameChecklistItem('${escapeHTML(item)}')" title="Rename item">✏️</button>
                <button class="icon-btn icon-btn-danger" onclick="deleteChecklistItem('${escapeHTML(item)}')" title="Delete item">🗑️</button>
              </div>
            </div>
          </td>
      `;

      // Map cells
      state.bidders.forEach(b => {
        const status = b.statuses[item] || 'not_submitted';
        html += `
          <td style="text-align: center;">
            <div class="segmented-control" data-bidder="${b.id}" data-item="${escapeHTML(item)}">
              <button class="seg-btn ${status==='submitted'?'active':''}" data-status="submitted" data-action="toggle-status">Sub</button>
              <button class="seg-btn ${status==='not_submitted'?'active':''}" data-status="not_submitted" data-action="toggle-status">Pend</button>
              <button class="seg-btn ${status==='not_applicable'?'active':''}" data-status="not_applicable" data-action="toggle-status">N/A</button>
            </div>
          </td>
        `;
      });

      html += `</tr>`;
    });

    html += `
        </tbody>
      </table>
    `;

    container.innerHTML = html;
  }

  // Event Delegation in Checklist Matrix tbody
  document.addEventListener("DOMContentLoaded", () => {
    const matrixContainer = document.getElementById("matrix-scroll-container");
    if (matrixContainer) {
      matrixContainer.addEventListener("click", (e) => {
        const btn = e.target.closest('[data-action="toggle-status"]');
        if (!btn) return;

        const control = btn.closest(".segmented-control");
        const bidderId = control.getAttribute("data-bidder");
        const itemKey = control.getAttribute("data-item");
        const nextStatus = btn.getAttribute("data-status");

        const bidder = state.bidders.find(b => b.id === bidderId);
        if (bidder) {
          bidder.statuses[itemKey] = nextStatus;
          saveStateToStorage();

          // Visually toggle active class
          control.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
        }
      });
    }
  });

  // Action methods
  window.bulkMarkNA = function(bidderId) {
    const bidder = state.bidders.find(b => b.id === bidderId);
    if (bidder) {
      state.checklistItems.forEach(item => {
        bidder.statuses[item] = 'not_applicable';
      });
      saveStateToStorage();
      showToast(`Marked all documents N/A for "${bidder.name}".`);
      renderMatrix();
    }
  };
  ```

- [ ] **Step 2: Commit Task 8**
  Commit the Matrix spreadsheet layout.
  Run: `git commit -a -m "feat: implement checklist matrix spreadsheet grid with event delegation and bulk NA functions"`

---

### Task 9: Checklist Matrix Inline Mutations (+Add Item, +Add Bidder)

**Files:**
- Modify: `C:/Users/traps/Documents/antigravity/blissful-turing/app.js`

- [ ] **Step 1: Write inline mutations inside app.js**
  Implement Checklist Item renaming (updating keys in all bidders' statuses maps), adding items, and the quick-add bidder popup form.

  Code:
  ```javascript
  // Append to app.js
  window.promptAddChecklistItem = function() {
    const name = prompt("Enter new checklist item name:");
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    if (state.checklistItems.includes(trimmed)) {
      showToast("Item already exists.");
      return;
    }

    state.checklistItems.push(trimmed);
    // Initialize status for all bidders
    state.bidders.forEach(b => {
      b.statuses[trimmed] = 'not_submitted';
    });

    saveStateToStorage();
    renderMatrix();
    showToast(`Added checklist item: "${trimmed}"`);
  };

  window.renameChecklistItem = function(oldName) {
    const newName = prompt(`Rename checklist item "${oldName}" to:`, oldName);
    if (!newName) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;

    if (state.checklistItems.includes(trimmed)) {
      showToast("An item with this name already exists.");
      return;
    }

    const idx = state.checklistItems.indexOf(oldName);
    if (idx !== -1) {
      state.checklistItems[idx] = trimmed;
      // Update key in all bidders
      state.bidders.forEach(b => {
        if (b.statuses[oldName] !== undefined) {
          b.statuses[trimmed] = b.statuses[oldName];
          delete b.statuses[oldName];
        }
      });
      saveStateToStorage();
      renderMatrix();
      showToast("Item renamed successfully.");
    }
  };

  window.deleteChecklistItem = function(itemName) {
    if (confirm(`Are you sure you want to delete checklist item "${itemName}"? This will erase status data for all bidders.`)) {
      state.checklistItems = state.checklistItems.filter(item => item !== itemName);
      // Clean up bidder keys
      state.bidders.forEach(b => {
        delete b.statuses[itemName];
      });
      saveStateToStorage();
      renderMatrix();
      showToast("Checklist item removed.");
    }
  };

  // Matrix toolbar button actions
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("matrix-add-item-btn")?.addEventListener("click", promptAddChecklistItem);
    
    // Quick Add Bidder modal trigger
    document.getElementById("matrix-add-bidder-btn")?.addEventListener("click", () => {
      const modal = document.getElementById("quick-add-modal");
      if (modal) {
        document.getElementById("quick-name").value = "";
        document.getElementById("quick-email").value = "";
        document.getElementById("quick-name-error").textContent = "";
        document.getElementById("quick-email-error").textContent = "";
        modal.classList.add("active");
      }
    });

    document.getElementById("close-quick-add-modal")?.addEventListener("click", () => {
      document.getElementById("quick-add-modal").classList.remove("active");
    });

    // Quick Add Form submit handler
    document.getElementById("quick-add-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameVal = document.getElementById("quick-name").value.trim();
      const emailVal = document.getElementById("quick-email").value.trim();
      const nameErr = document.getElementById("quick-name-error");
      const emailErr = document.getElementById("quick-email-error");

      let isValid = true;
      if (!nameVal) {
        nameErr.textContent = "Company Name is required.";
        isValid = false;
      } else {
        nameErr.textContent = "";
      }

      if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        emailErr.textContent = "Please enter a valid email address.";
        isValid = false;
      } else {
        emailErr.textContent = "";
      }

      if (!isValid) return;

      const statuses = {};
      state.checklistItems.forEach(item => {
        statuses[item] = 'not_submitted';
      });

      const newBidder = {
        id: crypto.randomUUID(),
        name: nameVal,
        email: emailVal,
        contactPerson: "",
        phone: "",
        createdAt: Date.now(),
        statuses: statuses
      };

      state.bidders.push(newBidder);
      saveStateToStorage();
      document.getElementById("quick-add-modal").classList.remove("active");
      showToast(`Bidder "${newBidder.name}" added successfully.`);
      renderMatrix();
    });
  });
  ```

- [ ] **Step 2: Commit Task 9**
  Commit the inline mutation events.
  Run: `git commit -a -m "feat: implement checklist item renaming, adding, deleting, and quick-add bidder modal"`

---

### Task 10: Section 5 - Draft Mail Engine

**Files:**
- Modify: `C:/Users/traps/Documents/antigravity/blissful-turing/app.js`

- [ ] **Step 1: Write renderEmailReminders inside app.js**
  Write reminder generation logic, list mapping (filtering for pending bidders only), copy-to-clipboard, mailto link builder (with characters-length boundary check), and the "Draft All" batch view.

  Code:
  ```javascript
  // Append to app.js
  let selectedBidderEmailId = null;

  function renderEmailReminders() {
    const listContainer = document.getElementById("email-bidders-list-container");
    const activeEditor = document.getElementById("email-editor-active-state");
    const emptyState = document.getElementById("email-editor-empty-state");

    if (!listContainer || !activeEditor || !emptyState) return;

    // Filter bidders with at least one not_submitted item
    const pendingBidders = state.bidders.filter(b => {
      const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email);
      if (!isEmailValid) return false;
      return state.checklistItems.some(item => b.statuses[item] === 'not_submitted');
    });

    if (pendingBidders.length === 0) {
      listContainer.innerHTML = `
        <div style="font-size:0.8rem; color:var(--text-secondary); padding:10px; text-align:center;">
          No bidders require follow-up.
        </div>
      `;
      activeEditor.style.display = "none";
      emptyState.style.display = "flex";
      emptyState.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          <div class="empty-state-msg">No reminder emails are needed. All bidders have submitted their documents!</div>
        </div>
      `;
      return;
    }

    // Render list
    listContainer.innerHTML = pendingBidders.map(b => {
      const pendingCount = state.checklistItems.filter(item => b.statuses[item] === 'not_submitted').length;
      const isActive = b.id === selectedBidderEmailId;
      return `
        <div class="email-bidder-item ${isActive?'active':''}" data-id="${b.id}">
          <h4>${escapeHTML(b.name)}</h4>
          <span>${pendingCount} pending items</span>
        </div>
      `;
    }).join('');

    // Setup selection listeners
    document.querySelectorAll(".email-bidder-item").forEach(item => {
      item.addEventListener("click", () => {
        selectedBidderEmailId = item.getAttribute("data-id");
        renderEmailReminders();
      });
    });

    // If active selected bidder is not in list, auto-select first
    const stillExists = pendingBidders.some(b => b.id === selectedBidderEmailId);
    if (!stillExists && pendingBidders.length > 0) {
      selectedBidderEmailId = pendingBidders[0].id;
    }

    const currentBidder = pendingBidders.find(b => b.id === selectedBidderEmailId);
    if (currentBidder) {
      activeEditor.style.display = "block";
      emptyState.style.display = "none";
      populateEmailEditor(currentBidder);
    }
  }

  function populateEmailEditor(bidder) {
    const toInput = document.getElementById("email-to");
    const subjectInput = document.getElementById("email-subject");
    const bodyTextarea = document.getElementById("email-body");
    const copyBtn = document.getElementById("email-copy-btn");
    const mailtoBtn = document.getElementById("email-mailto-btn");
    const warningDiv = document.getElementById("email-length-warning");

    if (!toInput || !subjectInput || !bodyTextarea || !copyBtn || !mailtoBtn || !warningDiv) return;

    // Get pending item names (full text expanded)
    const missing = state.checklistItems.filter(item => bidder.statuses[item] === 'not_submitted');
    
    // Construct default subject
    const defaultSubject = `Submission of Pending Tender Documents – ${state.tenderName}`;
    
    // Construct body
    const salutation = bidder.contactPerson ? `Dear ${bidder.contactPerson},` : "Dear Sir/Madam,";
    const bodyLines = [
      salutation,
      "",
      `With reference to the subject tender, we request you to kindly submit the following missing documents at the earliest:`,
      ""
    ];

    missing.forEach((item, index) => {
      bodyLines.push(`${index + 1}. "${item}"`);
    });

    bodyLines.push("");
    bodyLines.push("Kindly submit your reply at the earliest, else your offer will be evaluated based on available documents in your offer.");
    bodyLines.push("");
    bodyLines.push("Sincerely,");
    bodyLines.push("Tender Committee");

    toInput.value = bidder.email;
    subjectInput.value = defaultSubject;
    bodyTextarea.value = bodyLines.join("\n");

    // Update mailto URL
    updateMailtoLink();

    // Event listener on subject / body change
    subjectInput.oninput = updateMailtoLink;
    bodyTextarea.oninput = updateMailtoLink;
  }

  function updateMailtoLink() {
    const to = document.getElementById("email-to")?.value || "";
    const subject = document.getElementById("email-subject")?.value || "";
    const body = document.getElementById("email-body")?.value || "";
    const mailtoBtn = document.getElementById("email-mailto-btn");
    const warningDiv = document.getElementById("email-length-warning");

    if (!mailtoBtn || !warningDiv) return;

    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    if (mailtoUrl.length > 2000) {
      mailtoBtn.removeAttribute("href");
      mailtoBtn.style.pointerEvents = "none";
      mailtoBtn.style.opacity = "0.5";
      warningDiv.textContent = "Mailto URL exceeds 2000 characters. Please use \"Copy to Clipboard\" instead to avoid truncation.";
    } else {
      mailtoBtn.setAttribute("href", mailtoUrl);
      mailtoBtn.style.pointerEvents = "auto";
      mailtoBtn.style.opacity = "1";
      warningDiv.textContent = "";
    }
  }

  // Clipboard functionality
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("email-copy-btn")?.addEventListener("click", () => {
      const body = document.getElementById("email-body")?.value || "";
      navigator.clipboard.writeText(body).then(() => {
        showToast("Email text copied to clipboard.");
      }).catch(err => {
        showToast("Failed to copy text: " + err.message);
      });
    });

    // Draft All stacked view renderer
    document.getElementById("email-draft-all-btn")?.addEventListener("click", () => {
      const activeEditor = document.getElementById("email-editor-active-state");
      const emptyState = document.getElementById("email-editor-empty-state");
      
      if (!activeEditor || !emptyState) return;

      const pendingBidders = state.bidders.filter(b => {
        const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email);
        if (!isEmailValid) return false;
        return state.checklistItems.some(item => b.statuses[item] === 'not_submitted');
      });

      if (pendingBidders.length === 0) {
        showToast("No drafts to generate.");
        return;
      }

      activeEditor.style.display = "none";
      emptyState.style.display = "flex";

      let html = `
        <div class="stacked-emails-list">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
            <h3 style="margin:0;">All Pending Reminders (${pendingBidders.length})</h3>
            <button class="btn btn-secondary" onclick="renderEmailReminders()">Single Editor View</button>
          </div>
      `;

      pendingBidders.forEach(b => {
        const missing = state.checklistItems.filter(item => b.statuses[item] === 'not_submitted');
        const subject = `Submission of Pending Tender Documents – ${state.tenderName}`;
        const salutation = b.contactPerson ? `Dear ${b.contactPerson},` : "Dear Sir/Madam,";
        const bodyLines = [
          salutation,
          "",
          `With reference to the subject tender, we request you to kindly submit the following missing documents at the earliest:`,
          ""
        ];
        missing.forEach((item, index) => {
          bodyLines.push(`${index + 1}. "${item}"`);
        });
        bodyLines.push("");
        bodyLines.push("Kindly submit your reply at the earliest, else your offer will be evaluated based on available documents in your offer.");
        bodyLines.push("");
        bodyLines.push("Sincerely,");
        bodyLines.push("Tender Committee");

        const bodyText = bodyLines.join("\n");
        const mailtoUrl = `mailto:${encodeURIComponent(b.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
        const isTooLong = mailtoUrl.length > 2000;

        html += `
          <div class="stacked-email-item">
            <div style="font-weight:600; font-size:0.95rem; margin-bottom:4px;">To: ${escapeHTML(b.email)}</div>
            <div style="font-weight:500; font-size:0.85rem; color:var(--text-secondary); margin-bottom:10px;">Subject: ${escapeHTML(subject)}</div>
            <textarea class="form-textarea" readonly rows="8" style="font-size:0.8rem; background-color:var(--neutral-bg);">${escapeHTML(bodyText)}</textarea>
            <div style="display:flex; gap:10px; margin-top:8px; align-items:center;">
              <button class="btn btn-secondary" onclick="copyTextDirectly(this)" data-text="${escapeHTML(bodyText)}" style="padding:4px 8px; font-size:11px;">Copy</button>
              ${isTooLong ? 
                `<span style="color:var(--danger); font-size:11px;">Link too long (use copy)</span>` : 
                `<a class="btn btn-primary" href="${mailtoUrl}" style="padding:4px 8px; font-size:11px; text-decoration:none;">Open Mail App</a>`
              }
            </div>
          </div>
        `;
      });

      html += `</div>`;
      emptyState.innerHTML = html;
    });
  });

  // direct copy helper for stacked views
  window.copyTextDirectly = function(btn) {
    const text = btn.getAttribute("data-text");
    navigator.clipboard.writeText(text).then(() => {
      showToast("Email text copied.");
    }).catch(err => {
      showToast("Failed to copy: " + err.message);
    });
  };
  ```

- [ ] **Step 2: Commit Task 10**
  Commit the Draft email reminders.
  Run: `git commit -a -m "feat: implement reminder email generator, split dashboard editor, and draft all batch panels"`

---

### Task 11: SheetJS Excel Export Logic

**Files:**
- Modify: `C:/Users/traps/Documents/antigravity/blissful-turing/app.js`

- [ ] **Step 1: Write Excel Export in app.js**
  Write the SheetJS exporter function translating internal status values into full strings: `Submitted`, `Not Submitted`, and `Not Applicable`.

  Code:
  ```javascript
  // Append to app.js
  function downloadExcel() {
    try {
      if (state.bidders.length === 0) {
        showToast("No bidders available to export.");
        return;
      }

      // Build 2D array headers
      const headers = ["Checklist Item"];
      state.bidders.forEach(b => {
        headers.push(`${b.name} (${b.email})`);
      });

      const rows = [headers];

      // Map rows mapping abbreviation/status values
      state.checklistItems.forEach(item => {
        const row = [item];
        state.bidders.forEach(b => {
          const s = b.statuses[item] || 'not_submitted';
          let label = "Not Submitted";
          if (s === 'submitted') label = "Submitted";
          else if (s === 'not_applicable') label = "Not Applicable";
          row.push(label);
        });
        rows.push(row);
      });

      // SheetJS creation
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      
      // Auto size column widths
      const wscols = [{ wch: 40 }];
      state.bidders.forEach(() => {
        wscols.push({ wch: 30 });
      });
      ws['!cols'] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, "Compliance Checklist");
      XLSX.writeFile(wb, `${state.tenderName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_compliance_checklist.xlsx`);
      showToast("Excel spreadsheet downloaded successfully.");
    } catch (err) {
      showToast("Excel Export Failed: " + err.message);
    }
  }

  // Setup toolbar clicks
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("matrix-download-excel")?.addEventListener("click", downloadExcel);
  });
  ```

- [ ] **Step 2: Commit Task 11**
  Commit the Excel download behavior.
  Run: `git commit -a -m "feat: implement Excel sheet generator mapping full text status words using SheetJS"`

---

### Task 12: PDF Export (html2pdf) & Native Print Integrations

**Files:**
- Modify: `C:/Users/traps/Documents/antigravity/blissful-turing/app.js`

- [ ] **Step 1: Write PDF and Print handlers inside app.js**
  Implement non-sticky cloned table rendering for html2pdf, landscape layout margins, custom headers, and print invocation.

  Code:
  ```javascript
  // Append to app.js
  function downloadPDF() {
    try {
      if (state.bidders.length === 0) {
        showToast("No bidders available to export.");
        return;
      }

      // Clone table into an offscreen element for html2canvas
      const originalTable = document.getElementById("matrix-data-table");
      if (!originalTable) {
        showToast("Checklist Matrix table is empty.");
        return;
      }

      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "-9999px";
      tempContainer.style.width = "1200px"; // Fixed width to scale elements cleanly
      tempContainer.style.padding = "20px";
      tempContainer.style.backgroundColor = "#ffffff";
      tempContainer.style.color = "#000000";

      // Title & Date Header
      const headerTitle = document.createElement("h2");
      headerTitle.textContent = state.tenderName;
      headerTitle.style.marginBottom = "4px";
      headerTitle.style.color = "#000000";
      tempContainer.appendChild(headerTitle);

      const headerSubtitle = document.createElement("p");
      headerSubtitle.textContent = `Tender Compliance Checklist Matrix - Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      headerSubtitle.style.fontSize = "12px";
      headerSubtitle.style.color = "#555555";
      headerSubtitle.style.marginBottom = "20px";
      tempContainer.appendChild(headerSubtitle);

      // Clone the table
      const clonedTable = originalTable.cloneNode(true);
      clonedTable.style.width = "100%";
      clonedTable.style.borderCollapse = "collapse";
      clonedTable.style.fontSize = "10px";
      
      // Clean up inline styles on cloned table cells
      clonedTable.querySelectorAll("th, td").forEach(cell => {
        cell.style.position = "static";
        cell.style.boxShadow = "none";
        cell.style.backgroundColor = "#ffffff";
        cell.style.color = "#000000";
        cell.style.border = "1px solid #cccccc";
        cell.style.padding = "6px";
        
        // Remove delete/edit icons in headers and checklist item columns
        const actionBtnContainer = cell.querySelector("div button")?.closest("div");
        if (actionBtnContainer && cell.cellIndex === 0) {
          // Checklist item text
          const itemName = cell.querySelector(".item-name-text")?.textContent || "";
          cell.textContent = itemName;
        } else if (cell.tagName === "TH" && cell.cellIndex > 0) {
          // Bidder Header
          const bidderName = cell.querySelector(".th-bidder-name")?.textContent || "";
          const bidderEmail = cell.querySelector(".th-bidder-email")?.textContent || "";
          cell.innerHTML = `<div style="font-weight:bold;">${bidderName}</div><div style="font-size:8px;color:#555;">${bidderEmail}</div>`;
        }

        // Convert segmented control back to flat labels
        const control = cell.querySelector(".segmented-control");
        if (control) {
          const activeBtn = control.querySelector(".seg-btn.active");
          const status = activeBtn ? activeBtn.getAttribute("data-status") : "not_submitted";
          
          let statusText = "Not Submitted";
          let color = "#ef4444";
          if (status === "submitted") {
            statusText = "Submitted";
            color = "#22c55e";
          } else if (status === "not_applicable") {
            statusText = "Not Applicable";
            color = "#71717a";
          }

          cell.innerHTML = `<span style="color:${color}; font-weight:bold;">${statusText}</span>`;
        }
      });

      tempContainer.appendChild(clonedTable);
      document.body.appendChild(tempContainer);

      // html2pdf configuration
      const opt = {
        margin:       10,
        filename:     `${state.tenderName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_compliance_checklist.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      html2pdf().from(tempContainer).set(opt).save().then(() => {
        document.body.removeChild(tempContainer);
        showToast("PDF report downloaded successfully.");
      }).catch(err => {
        document.body.removeChild(tempContainer);
        showToast("PDF Export failed: " + err.message);
      });
    } catch (err) {
      showToast("PDF Export error: " + err.message);
    }
  }

  // Setup toolbar clicks
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("matrix-download-pdf")?.addEventListener("click", downloadPDF);
    document.getElementById("matrix-print")?.addEventListener("click", () => {
      window.print();
    });
  });
  ```

- [ ] **Step 2: Commit Task 12**
  Commit the PDF and Print behaviors.
  Run: `git commit -a -m "feat: implement html2pdf landscape report exporter and windows native print mappings"`

---

### Task 13: UI Refinements, Verification, & Persistence Verification

**Files:**
- Modify: `C:/Users/traps/Documents/antigravity/blissful-turing/app.js`

- [ ] **Step 1: Check initial empty state loading**
  Ensure that when the page is loaded with zero bidders, correct friendly empty state call-to-actions appear inside the Catalogue and Matrix.

  Code:
  ```javascript
  // Append to app.js
  function renderCatalogueEmptyState() {
    const container = document.getElementById("catalogue-grid-container");
    if (container && state.bidders.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <svg class="empty-state-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <div class="empty-state-msg">No bidders registered yet.</div>
          <button class="btn btn-primary" onclick="navigateToSection('add-bidder-section')">Add your first bidder</button>
        </div>
      `;
    }
  }

  // Ensure renderCatalogue call executes this
  const originalRenderCatalogue = renderCatalogue;
  renderCatalogue = function() {
    originalRenderCatalogue();
    renderCatalogueEmptyState();
  };
  ```

- [ ] **Step 2: Run through Verification Checklist**
  Execute and log results for the 15-point checklist inside `walkthrough.md`.

- [ ] **Step 3: Commit Task 13**
  Commit final polish.
  Run: `git commit -a -m "style: final dashboard CSS improvements and checklist loader verification"`
