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
