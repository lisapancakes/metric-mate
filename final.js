// Metric Mate - Final Review
// Generates a reusable final summary as the user types and links to the dashboard.

const finalState = {
  projectName: "",
  client: "",
  pm: "",
  designer: "",
  dev: "",
  date: "",
  outcomes: "",
  results: "",
  wins: "",
  challenges: "",
  learnings: "",
  nextSteps: ""
};

function $(id) {
  return document.getElementById(id);
}

// --- Kickoff + Midterm data loaders ---

function getKickoffDataFromUrlOrStorage() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("data");
    if (raw) {
      return JSON.parse(decodeURIComponent(raw));
    }
  } catch (err) {
    console.warn("Failed to parse kickoff data from URL", err);
  }

  try {
    const stored = localStorage.getItem("metricMateKickoff");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error("Failed to load kickoff data from localStorage", err);
  }

  return null;
}

function getMidtermDataFromStorage() {
  try {
    const stored = localStorage.getItem("metricMateMidterm");
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (err) {
    console.error("Failed to load midterm data from localStorage", err);
    return null;
  }
}

// Hydrate finalState from kickoff info (project meta)
function hydrateFinalStateFromKickoff(kickoff) {
  if (!kickoff || !kickoff.info) return;

  const info = kickoff.info;
  const dir = kickoff.directory || {};

  finalState.projectName =
    info.projectName || info.name || finalState.projectName;

  if (typeof info.clientId === "number" && Array.isArray(dir.clients)) {
    finalState.client = dir.clients[info.clientId] || finalState.client;
  } else {
    finalState.client = info.client || info.clientName || finalState.client;
  }

  if (typeof info.pmId === "number" && Array.isArray(dir.pms)) {
    finalState.pm = dir.pms[info.pmId] || finalState.pm;
  } else {
    finalState.pm = info.pm || info.pmName || finalState.pm;
  }

  if (typeof info.designerId === "number" && Array.isArray(dir.designers)) {
    finalState.designer = dir.designers[info.designerId] || finalState.designer;
  } else {
    finalState.designer =
      info.designer || info.designerName || finalState.designer;
  }

  if (typeof info.devId === "number" && Array.isArray(dir.devs)) {
    finalState.dev = dir.devs[info.devId] || finalState.dev;
  } else {
    finalState.dev = info.dev || info.devName || finalState.dev;
  }
}

// Push state into the visible form (without overwriting what user already typed)
function syncStateToForm() {
  const mapping = [
    ["projectName", finalState.projectName],
    ["client", finalState.client],
    ["pm", finalState.pm],
    ["designer", finalState.designer],
    ["dev", finalState.dev],
    ["date", finalState.date],
    ["outcomes", finalState.outcomes],
    ["results", finalState.results],
    ["wins", finalState.wins],
    ["challenges", finalState.challenges],
    ["learnings", finalState.learnings],
    ["nextSteps", finalState.nextSteps]
  ];

  mapping.forEach(([id, value]) => {
    const el = $(id);
    if (el && !el.value) {
      el.value = value || "";
    }
  });
}

function initFinal() {
  const form = $("finalForm");
  const copyBtn = $("copyFinalSummaryBtn");

  // 1) Hydrate from kickoff data if available
  const kickoffData = getKickoffDataFromUrlOrStorage();
  if (kickoffData) {
    hydrateFinalStateFromKickoff(kickoffData);
  }

  // 2) Sync into form controls
  syncStateToForm();

  // 3) Wire input handling
  if (form) {
    form.addEventListener("input", handleInput);
  }

  // 4) Generate initial summary
  updateSummary();

  // 5) Wire copy button
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const summary = $("finalSummary").value;
      copyToClipboard(summary);
      showStatus("✅ Final summary copied to clipboard");
    });
  }

function openDashboard(kickoffData) {
  const midtermData = getMidtermDataFromStorage() || null;

  const payload = {
    kickoff: kickoffData || null,
    midterm: midtermData,
    final: { ...finalState }
  };

  const encoded = encodeURIComponent(JSON.stringify(payload));
  const url = `dashboard.html?data=${encoded}`;
  window.open(url, "_blank");
}

function handleInput(e) {
  const t = e.target;
  const val = t.value;

  switch (t.id) {
    case "projectName":
      finalState.projectName = val;
      break;
    case "client":
      finalState.client = val;
      break;
    case "pm":
      finalState.pm = val;
      break;
    case "designer":
      finalState.designer = val;
      break;
    case "dev":
      finalState.dev = val;
      break;
    case "date":
      finalState.date = val;
      break;
    case "outcomes":
      finalState.outcomes = val;
      break;
    case "results":
      finalState.results = val;
      break;
    case "wins":
      finalState.wins = val;
      break;
    case "challenges":
      finalState.challenges = val;
      break;
    case "learnings":
      finalState.learnings = val;
      break;
    case "nextSteps":
      finalState.nextSteps = val;
      break;
  }

  updateSummary();
}

function updateSummary() {
  const summaryEl = $("finalSummary");
  if (!summaryEl) return;

  const s = finalState;
  let lines = [];

  lines.push("FINAL PROJECT REVIEW — INTERNAL");
  lines.push("--------------------------------");
  lines.push(`Project: ${s.projectName || "Untitled project"}`);
  if (s.client) lines.push(`Client: ${s.client}`);
  if (s.pm) lines.push(`PM: ${s.pm}`);
  if (s.designer) lines.push(`Product Designer: ${s.designer}`);
  if (s.dev) lines.push(`Lead Developer: ${s.dev}`);
  if (s.date) lines.push(`Final review date: ${s.date}`);
  lines.push("");

  if (s.outcomes.trim()) {
    lines.push("What we shipped:");
    lines.push(s.outcomes.trim());
    lines.push("");
  }

  if (s.results.trim()) {
    lines.push("Results / impact:");
    lines.push(s.results.trim());
    lines.push("");
  }

  if (s.wins.trim()) {
    lines.push("Biggest wins:");
    lines.push(s.wins.trim());
    lines.push("");
  }

  if (s.challenges.trim()) {
    lines.push("Challenges / misses:");
    lines.push(s.challenges.trim());
    lines.push("");
  }

  if (s.learnings.trim()) {
    lines.push("Key learnings:");
    lines.push(s.learnings.trim());
    lines.push("");
  }

  if (s.nextSteps.trim()) {
    lines.push("Next steps / follow-ups:");
    lines.push(s.nextSteps.trim());
  }

  summaryEl.value = lines.join("\n");
}

// --- Shared helpers (copied from other pages) ---
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

document.addEventListener("DOMContentLoaded", initFinal);
