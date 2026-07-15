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

// ===== SECTION 3: BIDDER CATALOGUE DASHBOARD =====
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

// ===== SECTION 3.5: MODALS FOR DETAILS, EDIT, & DELETE OPERATIONS =====
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
    renderActiveSection("catalogue-section");
    renderActiveSection("matrix-section");
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
  document.getElementById("confirm-ok-btn").textContent = "Delete";
  document.getElementById("confirm-modal").classList.add("active");
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("confirm-ok-btn")?.addEventListener("click", () => {
    if (deleteTargetBidderId) {
      state.bidders = state.bidders.filter(b => b.id !== deleteTargetBidderId);
      saveStateToStorage();
      document.getElementById("confirm-modal").classList.remove("active");
      showToast("Bidder removed.");
      deleteTargetBidderId = null;
      renderActiveSection("catalogue-section");
      renderActiveSection("matrix-section");
      renderActiveSection("overview-section");
    }
  });
});

// ===== SECTION 4: CHECKLIST MATRIX SPREADSHEET RENDERER =====
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

// ===== SECTION 4.5: CHECKLIST MATRIX INLINE MUTATIONS =====
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
    renderActiveSection("overview-section");
  });
});






