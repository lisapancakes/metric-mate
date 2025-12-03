// Metric Mate - Final Review
// Generates a reusable final summary as the user types and feeds the dashboard.

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

// Get kickoff data from URL or localStorage
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

function hydrateFromKickoff() {
  const kickoffData = getKickoffDataFromUrl();
  if (!kickoffData || !kickoffData.info) return;

  const info = kickoffData.info;
  const dir = kickoffData.directory || {};

  // Project name
  finalState.projectName =
    info.projectName || info.name || finalState.projectName;

  // Client
  if (typeof info.clientId === "number" && Array.isArray(dir.clients)) {
    finalState.client = dir.clients[info.clientId] || finalState.client;
  } else {
    finalState.client =
      info.client || info.clientName || finalState.client;
  }

  // PM
  if (typeof info.pmId === "number" && Array.isArray(dir.pms)) {
    finalState.pm = dir.pms[info.pmId] || finalState.pm;
  } else {
    finalState.pm = info.pm || info.pmName || finalState.pm;
  }

  // Designer
  if (typeof info.designerId === "number" && Array.isArray(dir.designers)) {
    finalState.designer = dir.designers[info.designerId] || finalState.designer;
  } else {
    finalState.designer =
      info.designer || info.designerName || finalState.designer;
  }

  // Dev
  if (typeof info.devId === "number" && Array.isArray(dir.devs)) {
    finalState.dev = dir.devs[info.devId] || finalState.dev;
  } else {
    finalState.dev = info.dev || info.devName || finalState.dev;
  }

  // Push into the DOM if fields exist
  const projectInput = $("projectName");
  const clientInput = $("client");
  const pmInput = $("pm");
  const designerInput = $("designer");
  const devInput = $("dev");

  if (projectInput) projectInput.value = finalState.projectName;
  if (clientInput) clientInput.value = finalState.client;
  if (pmInput) pmInput.value = finalState.pm;
  if (designerInput) designerInput.value = finalState.designer;
  if (devInput) devInput.value = finalState.dev;
}

function initFinal() {
  const form = $("finalForm");
  const copyBtn = $("copyFinalSummaryBtn");

  // Hydrate from kickoff before wiring events
  hydrateFromKickoff();

  if (!form) return;

  form.addEventListener("input", handleInput);
  updateSummary(); // initial render based on any prefilled data

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const summary = $("finalSummary").value;
      copyToClipboard(summary);
      showStatus("✅ Final summary copied to clipboard");
    });
  }
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

// Build the big reusable text block
function buildFinalSummary() {
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

  return lines.join("\n");
}

// Central place: updates textarea + dashboard data
function updateSummary() {
  const summaryEl = $("finalSummary");
  if (!summaryEl) return;

  const summaryText = buildFinalSummary();
  summaryEl.value = summaryText;

  // Persist + update dashboard link
  updateDashboardLink(summaryText);
}

// Push combined data for dashboard into localStorage + link href
function updateDashboardLink(summaryText) {
  try {
    // Midterm snapshot (if the user actually ran a midterm review)
    let midtermData = null;
    const midtermRaw = localStorage.getItem("metricMateMidterm");
    if (midtermRaw) {
      try {
        midtermData = JSON.parse(midtermRaw);
      } catch (e) {
        console.warn("Failed to parse midterm snapshot", e);
      }
    }

    // Project meta comes from finalState (user can tweak here)
    const project = {
      name: finalState.projectName || "Untitled project",
      client: finalState.client || "",
      pm: finalState.pm || "",
      designer: finalState.designer || "",
      dev: finalState.dev || "",
      finalReviewDate: finalState.date || ""
    };

    const finalPayload = {
      ...finalState
    };

    const dashboardData = {
      project,
      midterm: midtermData,
      final: finalPayload,
      finalSummary: summaryText
    };

    const encoded = encodeURIComponent(JSON.stringify(dashboardData));
    localStorage.setItem("metricMateDashboard", JSON.stringify(dashboardData));

    const link = $("dashboardLink");
    if (link) {
      // Pass data along in the URL as well
      link.href = `dashboard.html?data=${encoded}`;
    }
  } catch (e) {
    console.warn("Failed to update dashboard link/data", e);
  }
}

// --- Shared helpers (same as other pages) ---
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
