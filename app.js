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

// Router renderer
function renderActiveSection(sectionId) {
  switch(sectionId) {
    case "overview-section": if (typeof renderOverview === "function") renderOverview(); break;
    case "matrix-section": if (typeof renderMatrix === "function") renderMatrix(); break;
    case "catalogue-section": if (typeof renderCatalogue === "function") renderCatalogue(); break;
    case "add-bidder-section": if (typeof renderAddBidder === "function") renderAddBidder(); break;
    case "email-section": if (typeof renderEmailReminders === "function") renderEmailReminders(); break;
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

// ===== SECTION 1: OVERVIEW DASHBOARD RENDERER =====
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

// Global utility helper functions
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

// ===== SECTION 2: ADD BIDDER FORM & RECENTLY ADDED =====
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


