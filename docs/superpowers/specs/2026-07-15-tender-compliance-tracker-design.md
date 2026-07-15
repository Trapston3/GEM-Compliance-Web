# Specification: Tender Compliance Tracker

A standalone, single-purpose web application designed to replace a manual Excel-based bidder document checklist with a robust digital dashboard. It manages bidders, tracks tender-compliance documents, drafts email reminders for missing items, and supports spreadsheet-style exports and printing.

---

## 1. User Interface Design & Aesthetics

### Theme & Layout System (Linear-Style)
- **Overall Style**: Sleek, developer-tool-oriented design with clean borders, high information density, and interactive animations.
- **Sidebar**: Fixed left sidebar (240px wide) styled in a dark theme (`#18181b`/zinc-900) containing the application logo, the editable Tender Name, and the 5 navigation sections. It collapses to icons-only or a hamburger drawer on screens under 900px wide.
- **Color Palette (CSS Variables)**:
  - `--bg-main`: White (Light Mode) / Dark Charcoal `#09090b` (Dark Mode)
  - `--bg-card`: Pure White `#ffffff` (Light Mode) / Deep Slate `#18181b` (Dark Mode)
  - `--border-color`: Light Gray `#e4e4e7` (Light Mode) / Zinc `#27272a` (Dark Mode)
  - `--text-primary`: Dark Gray `#09090b` (Light Mode) / Cool White `#fafafa` (Dark Mode)
  - `--text-secondary`: Muted Gray `#71717a` (Light Mode) / Muted Slate `#a1a1aa` (Dark Mode)
  - `--accent`: Brand Blue/Indigo `#0071e3` or `#4f46e5`
  - `--success`: Green `#22c55e` (used sparingly for "Submitted" status pills)
  - `--danger`: Red `#ef4444` (used sparingly for "Not Submitted" status pills)
  - `--warning`: Muted Gray/Amber `#a1a1aa` or `#eab308` (used for "Not Applicable" or pending counts)
- **Dark Mode Toggle**: Located in the top header bar, allowing instant transition by appending/removing a `.dark` class to the `<html>` or `<body>` element.

---

## 2. Component Layout & Application Sections

The application is structured as a Single-Page Application (SPA) divided into 5 navigation sections. Only one section is visible at any given time.

### Section 1: Overview (Landing Screen)
- **Key Metrics Cards**:
  - *Total Bidders*: Count of all bidders.
  - *Total Checklist Items*: Count of all checklist items.
  - *Overall Submission Rate (%)*: Calculated as `(Submitted Items / (Total Bidders * Total Items - N/A Items)) * 100`.
  - *Bidders with Pending Items*: Count of bidders with at least one document marked as `not_submitted`.
- **Distribution Summary Chart**: A horizontal progress bar representing the total counts of `Submitted` (green), `Not Submitted` (red), and `Not Applicable` (gray) across all cell statuses.
- **Urgent Follow-Up List**: A table showing bidders with missing items, sorted descending by number of missing documents, with a button that links directly to their draft reminder mail.

### Section 2: Add Bidder
- **Focused Form (Max-width 500px)**:
  - Fields: Bidder Company Name (required), Contact Email (required, regex validated with inline error messages), Contact Person (optional), Phone Number (optional).
  - Actions: Submit button that resets form, saves data, triggers a toast notification with a link to view the bidder in the Catalogue, and populates the bidder's checklist statuses with `not_submitted`.
- **Recently Added Bidders**: A table of the last 5 added bidders, updating in real-time.

### Section 3: Bidder Catalogue
- **Grid Layout**: Responsive 3-column (desktop) / 1-column (mobile) card grid.
- **Each Card Displays**:
  - Bidder details (Company Name, Email, Contact Person).
  - Progress bar showing the fraction and percentage of submitted documents (e.g. `11/15 (73%)`).
  - Small dot counts for each state: ● 11 Submitted ● 3 Pending ● 1 N/A.
- **Card Actions**:
  - *View Details*: Opens a modal dialog with an inline-editable list of all items and their status for this bidder.
  - *Edit Bidder*: Opens a modal form to modify company name, email, contact person, or phone.
  - *Delete Bidder*: Opens a confirmation prompt before removing the bidder from state.
  - *Draft Email*: Jumps to the Draft Mail section, pre-selecting this bidder.
- **Filters Toolbar**:
  - Search input (queries name/email).
  - Status filter dropdown: All, Fully Submitted (no pending items), Has Pending Items.
  - Sort dropdown: Name (A-Z), Most Pending First, Recently Added.

### Section 4: Checklist Matrix (Spreadsheet View)
- **Sticky Column & Header Layout**:
  - Left column (Checklist Items) is frozen. Includes a rename edit icon and delete icon per row.
  - Header row (Bidders) is frozen. Includes bidder name, email, an edit icon (triggering a details modal), and a bulk "Mark All N/A" action icon.
- **Table Cell Control**: A 3-way segmented button:
  - `Sub` (Green when active)
  - `Pend` (Red when active)
  - `N/A` (Muted Zinc when active)
- **Grid Add Tools**:
  - `+ Add Checklist Item` button: Prompts for name, appends a row, and sets all bidders' statuses for it to `not_submitted`.
  - `+ Add Bidder` button: Compact inline popup form (name and email only) for fast data entry.
- **Toolbar Actions**:
  - *Download as Excel*: Uses SheetJS to generate a clean tabular spreadsheet.
  - *Download as PDF*: Generates a landscape PDF via `html2pdf.js` from a non-sticky cloned DOM table.
  - *Print*: Invokes window print with print-specific styles (sidebar hidden, static table cells).

### Section 5: Draft Mail
- **Split Panel Layout**:
  - *Left Panel*: List of bidders with pending items (sorted by count descending). Clicking a bidder loads their reminder template into the editor.
  - *Right Panel*: Interactive editor.
    - *To*: Read-only bidder email.
    - *Subject*: Text input, defaults to `"Submission of Pending Tender Documents – [Tender Name]"`. The Tender Name is a global setting field at the top of the editor.
    - *Body*: Textarea populated with the dynamic template:
      `"Dear [Contact Person / Sir/Madam],\n\nYou have not submitted \"[ITEM NAME]\", kindly submit the same.\n...\nKindly submit your reply at the earliest, else your offer will be evaluated based on available documents in your offer.\n\nSincerely,\nTender Committee"`
- **Actions**:
  - *Copy to Clipboard*: Standard copy toast notification.
  - *Open in Mail App*: Formats a `mailto:` link. Disables the button with a warning if the generated link exceeds 2000 characters to prevent browser/mail-client truncation.
  - *Draft All*: Renders a stacked list of all pending bidders' draft emails for fast review and batch-copying.

---

## 3. Data Architecture & Persistence

### Data Model
```js
state = {
  tenderName: string,       // Persisted global tender name
  checklistItems: string[], // Ordered list of document checklist item names
  bidders: [
    {
      id: string,           // Unique identifier generated via crypto.randomUUID()
      name: string,
      email: string,
      contactPerson: string,
      phone: string,
      createdAt: number,    // Epoch timestamp for sorting
      statuses: {           // Keyed by item name
        [itemName]: 'submitted' | 'not_submitted' | 'not_applicable'
      }
    }
  ]
}
```

### Persistence Logic
- **Storage**: JSON serialized structure in `localStorage`.
- **Auto-Save**: Triggered on every state change, debounced at 300ms to avoid performance bottlenecks.
- **Seeding**: On first load, if no `localStorage` is found, seed with 15 default checklist items:
  1. DECLARATION ON BANNING or HOLIDAY LISTING
  2. NIL DEVIATION
  3. MSE-UDYAM
  4. ISO/NSIC
  5. INTEGRITY PACT
  6. UNDERTAKING WRT COMPLIANCE OF RESTRICTIONS FOR COUNTRIES WHICH SHARE LAND BORDER WITH INDIA
  7. SIGNED MRPL GPC & TD
  8. EMD
  9. LOCAL CONTENT & PA
  10. PRICE REDUCTION SCHEDULE (PRS) CLAUSE
  11. PERFORMANCE BANK GUARANTY (PBG) CUM SECURITY DEPOSIT (SD)
  12. PAYMENT TERMS AS PER GeM
  13. DELIVERY PERIOD AS PER TERMS AND CONDITIONS
  14. OFFER VALIDITY
  15. ANY OTHER DEVIATIONS

### Integrity Safeguards
- **Item Renaming**: When editing an item name, a function traverses all bidders and translates their `statuses[oldName]` key to `statuses[newName]`, then deletes the old key.
- **Item Deletion**: When an item is removed, the corresponding key is deleted from each bidder's `statuses` object to prevent memory bloat.

---

## 4. Implementation details & Quality Gates

- **Event Delegation**: Rather than binding event listeners to thousands of cell buttons, we attach single event listeners to the matrix table's `<tbody>` and `<thead>` using `e.target.closest('[data-action]')` checks.
- **Robust Error Handling**: Wrap all `localStorage` access and export libraries in `try/catch` statements, displaying error messages via a custom toast notification system.
- **Regex Email Validation**: Enforces standard RFC 5322 format checking: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
- **Print stylesheet**: CSS `@media print` directives set margins, hide sidebars/headers/buttons, override color states to high-contrast monochrome, and disable position sticky to ensure correct pagination.
