# Specification: Tender Compliance Tracker

A standalone, single-purpose web application designed to replace a manual Excel-based bidder document checklist with a robust digital dashboard. It manages bidders, tracks tender-compliance documents, drafts email reminders for missing items, and supports spreadsheet-style exports and printing.

---

## 1. File Structure & Component Separation

To ensure clean maintenance, debugging, and testing, the application is strictly partitioned into three separate files:
1. **[index.html](file:///C:/Users/traps/Documents/antigravity/blissful-turing/index.html)**: Contains the semantic HTML structure, routing containers for the 5 SPA sections, modal placeholders, and CDN inclusions. No raw Javascript logic is allowed inside this file.
2. **[styles.css](file:///C:/Users/traps/Documents/antigravity/blissful-turing/styles.css)**: Holds the CSS custom variables, theme rules (light/dark toggle), structural layout (sidebar, content container), visual card and table design, and print stylesheet directive (`@media print`).
3. **[app.js](file:///C:/Users/traps/Documents/antigravity/blissful-turing/app.js)**: Contains all functional Javascript: state management, event listeners (using event delegation), localStorage persistence, SheetJS and html2pdf.js integration, email drafting algorithms, and dynamic DOM render operations.

---

## 2. Design System & Aesthetics (Linear-Style)

### Theme & Layout System
- **Overall Style**: Sleek, developer-tool-oriented design with clean borders, high information density, and interactive animations.
- **Sidebar**: Fixed left sidebar (240px wide) styled in a dark theme (`#18181b`/zinc-900) containing the application logo, the editable Tender Name, and the 5 navigation sections. It collapses to icons-only or a hamburger drawer on screens under 900px wide.
- **Color Palette (CSS Variables)**:
  - `--bg-main`: White (Light Mode) / Dark Charcoal `#09090b` (Dark Mode)
  - `--bg-card`: Pure White `#ffffff` (Light Mode) / Deep Slate `#18181b` (Dark Mode)
  - `--border-color`: Light Gray `#e4e4e7` (Light Mode) / Zinc `#27272a` (Dark Mode)
  - `--text-primary`: Dark Gray `#09090b` (Light Mode) / Cool White `#fafafa` (Dark Mode)
  - `--text-secondary`: Muted Gray `#71717a` (Light Mode) / Muted Slate `#a1a1aa` (Dark Mode)
  - `--accent`: Brand Blue/Indigo `#0071e3` or `#4f46e5`
  - `--success`: Green `#22c55e` (used strictly for "Submitted" status pills)
  - `--danger`: Red `#ef4444` (used strictly for "Not Submitted" status pills)
  - `--warning`: Amber `#eab308` (used strictly for pending/urgent counts on Overview cards)
  - `--neutral`: Slate Gray `#a1a1aa` (used strictly for "Not Applicable" status pills and neutral indicators)
- **Dark Mode Toggle**: Located in the top header bar, allowing instant transition by appending/removing a `.dark` class to the `<html>` or `<body>` element.

---

## 3. UI Sections (Single-Page Application)

Only one section is visible at any given time. Toggle classes manage section visibility.

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
  - `N/A` (Muted Slate when active)
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

## 4. Data Architecture, Persistence, and Export Conversion

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
- **Auto-Save**: Triggered on every state change, debounced at 300ms.
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

### Export Label Conversion Rules
To ensure professional-grade exports and reminders, cell status values (`submitted`, `not_submitted`, `not_applicable`) and cell abbreviations (`Sub`, `Pend`, `N/A`) **must be expanded to their full words** when generating data for external consumption:
1. **Excel Export**: The 2D cell grid passed to SheetJS must map the values as:
   - `'submitted'` $\rightarrow$ `"Submitted"`
   - `'not_submitted'` $\rightarrow$ `"Not Submitted"`
   - `'not_applicable'` $\rightarrow$ `"Not Applicable"`
2. **PDF Export**: The print-only matrix table must show full-length statuses or cleanly styled pills displaying `"Submitted"`, `"Not Submitted"`, and `"Not Applicable"`.
3. **Email Draft Text**: The mail body templates must expand items into the user-friendly phrase (e.g., `You have not submitted "[ITEM NAME]"`). Bidders with zero pending items should not be available for drafting.

---

## 5. Verification Plan

The application must pass the following 15 verification checks before completion. The implementing engineer must run through each scenario and document the results:

1. **Fresh Load Test**: Clear `localStorage`, reload the page. The app must load with 0 bidders and the 15 default checklist items seeded. No console errors or warnings.
2. **Bidder Creation**: Add a bidder using the Form. Verify that the bidder instantly appears in the Catalogue and the Matrix, with all 15 item statuses defaulted to `not_submitted` (Pending).
3. **Invalid Email Handling**: Input an invalid email (e.g. `test@invalid`) in the form or inline editing modal. Verify that an inline validation error is shown and submission is blocked, or the "Draft Email" button is disabled for them in the Catalogue/Matrix with an descriptive message.
4. **Add Checklist Item**: Click "+ Add Checklist Item", input a new document name. Verify that a new row is appended to the Matrix for all bidders, defaulted to `not_submitted`.
5. **Rename Checklist Item**: Rename an existing checklist item. Confirm that status values for that item are retained for all bidders under the new key name.
6. **Stat Card Recalculation**: Toggle statuses in the Matrix (e.g. set some to Submitted and others to Not Applicable). Confirm that the Overall Submission Rate (%) and other stats in the Overview section update instantly and accurately.
7. **Bulk N/A Action**: Click "Mark all Not Applicable" on a bidder column header. Confirm all items for that bidder update to `not_applicable`. If they had pending items, verify that the "Draft Email" button is now disabled (since they have no missing documents left).
8. **Delete Bidder**: Select "Delete Bidder" in the Catalogue. Ensure a confirmation dialog appears. After approval, verify they are removed from both Catalogue and Matrix, and no orphaned data remains in state.
9. **Single Draft Email**: Click "Draft Email" on a bidder card. Verify it routes to the Mail tab, pre-selects the bidder, pulls their correct email, and generates the list of missing items exactly as a bulleted/listed body text.
10. **Draft All View**: Click "Draft All" in the Mail tab. Ensure a stacked layout shows draft templates for *all* bidders with pending documents, and hides bidders with no pending documents.
11. **Excel Export Validity**: Click "Download as Excel". Open the generated `.xlsx` file. Ensure that row 0 contains header names (`Checklist Item`, `Bidder A`, `Bidder B`), and columns contain full names like `"Submitted"`, `"Not Submitted"`, and `"Not Applicable"`.
12. **PDF Export Layout**: Click "Download as PDF". Ensure the matrix displays in landscape mode, margins are neat, the header contains the Tender Name and today's date, and no columns are chopped off.
13. **Print Layout**: Run the browser print command (Ctrl+P). The print preview must exclude the sidebar, buttons, and headers, and print the Checklist Matrix table flat and paginated nicely across sheets without sticky artifacts.
14. **State Persistence**: Perform several changes (add bidders, change statuses), then refresh the browser. Confirm that the state is fully recovered from `localStorage`.
15. **Dark Mode Integrity**: Toggle Dark Mode. Check that the sidebar, overview cards, catalogue cards, matrix buttons, edit forms, and mail drafting area all transition to their dark colors cleanly with no white flashes or unreadable text contrasts.
