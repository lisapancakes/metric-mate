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
  totalSteps: 4,
  metaExpanded: false,
  info: {
    projectName: "",
    projectSummary: "",
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
  nextSteps: "",
  winsList: [],
  learningsList: [],
  nextStepsList: []
};

const midtermSummaryState = {
  internalSummary: "",
  clientSummary: ""
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
    const parsed = JSON.parse(stored);
    parsed.winsList = Array.isArray(parsed.winsList)
      ? parsed.winsList
      : (parsed.wins ? parsed.wins.split(/\n+/).map(s => s.trim()).filter(Boolean) : []);
    parsed.learningsList = Array.isArray(parsed.learningsList)
      ? parsed.learningsList
      : (parsed.learnings ? parsed.learnings.split(/\n+/).map(s => s.trim()).filter(Boolean) : []);
    parsed.nextStepsList = Array.isArray(parsed.nextStepsList)
      ? parsed.nextStepsList
      : (parsed.nextSteps ? parsed.nextSteps.split(/\n+/).map(s => s.trim()).filter(Boolean) : []);
    return parsed;
  } catch (e) {
    console.warn("Failed to load saved midterm", e);
    return null;
  }
}

// HELPERS
function copyToClipboard(text) {
  const doFallback = () => fallbackCopy(text);

  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(text).catch(doFallback);
  } else {
    doFallback();
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
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
        const baseImportance =
          previous.importance ??
          g.currentScore ??
          g.severity ??
          3;
        selections.push({
          id: g.id,
          label: g.label,
          type,
          importance: baseImportance,
          status: previous.status || "not-started",
          notes: previous.notes || "",
          completionNote: previous.completionNote || ""
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
  if (typeof syncNarrativeStrings === "function") {
    syncNarrativeStrings();
  }
  try {
    const exportObj = {
      info: { ...midterm.info },
      healthScore: midterm.healthScore,
      progressScore: midterm.progressScore,
      goalStatuses: midterm.goalStatuses,
      risks: midterm.risks,
      wins: midterm.wins,
      learnings: midterm.learnings,
      nextSteps: midterm.nextSteps,
      winsList: midterm.winsList,
      learningsList: midterm.learningsList,
      nextStepsList: midterm.nextStepsList
    };
    localStorage.setItem("metricMateMidterm", JSON.stringify(exportObj));
  } catch (e) {
    console.warn("Failed to save midterm data for dashboard", e);
  }
}
