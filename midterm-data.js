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
  metaExpanded: false,
  info: {
    projectName: "",
    client: "",
    pm: "",
    designer: "",
    dev: "",
    otherContributors: "",
    date: ""
  },
  healthScore: null,
  progressScore: null,
  progressGood: "",
  progressOff: "",
  goalStatuses: [],
  risks: [],
  wins: "",
  learnings: "",
  nextSteps: ""
};

// DOM refs (elements exist because script is loaded at bottom of body)
const form = document.getElementById("surveyForm");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const progressBar = document.getElementById("progressBar");

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

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

function loadSavedMidterm() {
  try {
    const stored = localStorage.getItem("metricMateMidterm");
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (e) {
    console.warn("Failed to load saved midterm", e);
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

function normalizeGoalStatusesFromKickoff(kickoff, existingStatuses = []) {
  if (!kickoff) return [];

  const selections = [];
  const existingMap = new Map(
    (existingStatuses || []).map(item => [item.id, item])
  );

  function addGoals(list, type) {
    (list || [])
      .filter(g => g && g.selected)
      .forEach(g => {
        const previous = existingMap.get(g.id) || {};
        selections.push({
          id: g.id,
          label: g.label,
          type,
          status: previous.status || "not-started",
          notes: previous.notes || ""
        });
      });
  }

  addGoals(kickoff.businessGoals, "business");
  addGoals(kickoff.productGoals, "product");
  addGoals(kickoff.userGoals, "user");
  addGoals(kickoff.userPains, "pain");

  return selections;
}

function saveMidtermForDashboard() {
  try {
    const exportObj = {
      info: { ...midterm.info },
      healthScore: midterm.healthScore,
      progressScore: midterm.progressScore,
      goalStatuses: midterm.goalStatuses,
      risks: midterm.risks,
      wins: midterm.wins,
      learnings: midterm.learnings,
      nextSteps: midterm.nextSteps
    };
    localStorage.setItem("metricMateMidterm", JSON.stringify(exportObj));
  } catch (e) {
    console.warn("Failed to save midterm data for dashboard", e);
  }
}
