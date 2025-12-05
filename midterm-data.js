// =====================================
// Metric Mate – Midterm Data & Helpers
// Responsibilities:
//  - State container for midterm survey
//  - Load kickoff context (URL or localStorage)
//  - Utility helpers (clipboard, status toast, save)
// =====================================

// STATE
const midterm = {
  currentStep: 1,
  totalSteps: 3,
  info: {
    projectName: "",
    client: "",
    pm: "",
    designer: "",
    dev: "",
    date: ""
  },
  healthScore: 3,
  progressGood: "",
  progressOff: "",
  risks: "",
  decisions: "",
  nextSteps: ""
};

// DOM refs (elements exist because script is loaded at bottom of body)
const form = document.getElementById("surveyForm");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const progressBar = document.getElementById("progressBar");

// LOAD KICKOFF DATA
function getKickoffDataFromUrl() {
  try {
    // 1) Try URL ?data=...
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("data");
    if (raw) {
      return JSON.parse(decodeURIComponent(raw));
    }

    // 2) Fallback: localStorage (saved by the kickoff survey)
    const stored = localStorage.getItem("metricMateKickoff");
    if (stored) {
      return JSON.parse(stored);
    }

    return null;
  } catch (err) {
    console.error("Failed to load kickoff data", err);
    return null;
  }
}

// HELPERS
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    console.error("Copy failed", err);
  }
  document.body.removeChild(textarea);
}

function showStatus(message) {
  let statusEl = document.getElementById("copyStatus");
  if (!statusEl) {
    statusEl = document.createElement("div");
    statusEl.id = "copyStatus";
    statusEl.className = "status-message";
    statusEl.style.display = "none";
    document.body.appendChild(statusEl);
  }

  statusEl.textContent = message;
  statusEl.style.display = "block";
  setTimeout(() => {
    statusEl.style.display = "none";
  }, 2500);
}

function saveMidtermForDashboard() {
  try {
    const exportObj = {
      info: { ...midterm.info },
      healthScore: midterm.healthScore,
      progressGood: midterm.progressGood,
      progressOff: midterm.progressOff,
      risks: midterm.risks,
      decisions: midterm.decisions,
      nextSteps: midterm.nextSteps
    };
    localStorage.setItem("metricMateMidterm", JSON.stringify(exportObj));
  } catch (e) {
    console.warn("Failed to save midterm data for dashboard", e);
  }
}
