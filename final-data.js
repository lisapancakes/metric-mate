// ===============================
// Metric Mate – Final Project Review (Data & Helpers)
// ===============================

const finalState = {
  projectName: "",
  projectSummary: "",
  client: "",
  pm: "",
  designer: "",
  dev: "",
  date: "",
  outcomes: "",
  results: "",
  outcomesList: [],
  resultsList: [],
  wins: "",
  challenges: "",
  learnings: "",
  nextSteps: "",
  winsList: [],
  challengesList: [],
  learningsList: [],
  nextStepsList: []
};

let finalGoals = [];
let finalMetaExpanded = false;
const finalSummaryState = {
  finalSummary: "",
  finalClientSummary: ""
};

function $(id) {
  return document.getElementById(id);
}

// Load Kickoff Data
function loadKickoffData() {
  try {
    const stored = localStorage.getItem("metricMateKickoff");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Failed to load kickoff data from localStorage", e);
  }

  return null;
}

// Load Midterm Data (optional)
function loadMidtermData() {
  try {
    const stored = localStorage.getItem("metricMateMidterm");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Failed to load midterm data from localStorage", e);
  }
  return null;
}

function buildProjectMeta(kickoff) {
  if (!kickoff || !kickoff.info) return {};
  const info = kickoff.info || {};
  const dir = kickoff.directory || {};

  const meta = {};
  meta.name = info.projectName || info.name || "";
  meta.summary = info.projectSummary || info.summary || "";

  if (typeof info.clientId === "number" && Array.isArray(dir.clients)) {
    meta.client = dir.clients[info.clientId] || "";
  } else {
    meta.client = info.client || info.clientName || "";
  }

  if (typeof info.pmId === "number" && Array.isArray(dir.pms)) {
    meta.pm = dir.pms[info.pmId] || "";
  } else {
    meta.pm = info.pm || info.pmName || "";
  }

  if (typeof info.designerId === "number" && Array.isArray(dir.designers)) {
    meta.designer = dir.designers[info.designerId] || "";
  } else {
    meta.designer = info.designer || info.designerName || "";
  }

  if (typeof info.devId === "number" && Array.isArray(dir.devs)) {
    meta.dev = dir.devs[info.devId] || "";
  } else {
    meta.dev = info.dev || info.devName || "";
  }

  meta.kickoffDate =
    info.kickoffDate || info.date || info.startDate || kickoff.kickoffDate || "";

  return meta;
}

function normalizeGoalsFromKickoff(kickoff, midterm) {
  if (!kickoff) return [];

  const midMap = new Map(
    (midterm && Array.isArray(midterm.goalStatuses)
      ? midterm.goalStatuses
      : []
    ).map(g => [g.id, g])
  );

  const goals = [];

  function add(list, type) {
    (list || [])
      .filter(g => g && g.selected)
      .forEach(g => {
        const mid = midMap.get(g.id) || {};
        goals.push({
          id: g.id,
          label: g.label,
          type,
          importance:
            typeof g.importance === "number"
              ? g.importance
              : typeof g.currentScore === "number"
                ? g.currentScore
                : typeof g.severity === "number"
                  ? g.severity
                  : 3,
          midtermStatus: mid.status || "",
          midtermNotes: mid.notes || "",
          completionNote: g.completionNote || mid.completionNote || "",
          finalStatus: "",
          finalNotes: ""
        });
      });
  }

  add(kickoff.businessGoals, "business");
  add(kickoff.productGoals, "product");
  add(kickoff.userGoals, "user");
  add(kickoff.userPains, "pain");

  return goals;
}

// Shared helpers
function copyToClipboard(text) {
  const doFallback = () => fallbackCopy(text);

  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(text).catch(doFallback);
  } else {
    doFallback();
  }
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.top = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    console.error("Copy failed", err);
  }
  document.body.removeChild(ta);
}

function showStatus(message) {
  let statusEl = document.getElementById("copyStatus");
  if (!statusEl) {
    statusEl = document.createElement("div");
    statusEl.id = "copyStatus";
    statusEl.className = "status-message";
    document.body.appendChild(statusEl);
  }

  statusEl.textContent = message;
  statusEl.style.display = "block";
  setTimeout(() => {
    statusEl.style.display = "none";
  }, 2200);
}

function saveDashboardPayload(summaryText) {
  const kickoff = loadKickoffData();
  const midterm = loadMidtermData();
  const project = buildProjectMeta(kickoff);

  project.name = finalState.projectName || project.name || "";
  project.summary = finalState.projectSummary || project.summary || "";
  project.client = finalState.client || project.client || "";
  project.pm = finalState.pm || project.pm || "";
  project.designer = finalState.designer || project.designer || "";
  project.dev = finalState.dev || project.dev || "";
  project.finalReviewDate = finalState.date || "";

  const payload = {
    kickoff,
    midterm,
    final: { ...finalState },
    goals: finalGoals.map(g => ({ ...g })),
    finalSummary: summaryText || "",
    project
  };

  try {
    localStorage.setItem("metricMateDashboard", JSON.stringify(payload));
  } catch (e) {
    console.warn("Failed to save dashboard payload", e);
  }

  const linkEl = $("openDashboardBtn");
  if (linkEl) {
    linkEl.href = "dashboard.html";
  }
}
