// Metric Mate - Final Review
// Generates a reusable final summary as the user types
// and passes data to the dashboard.

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------
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

let kickoffCache = null;

function $(id) {
  return document.getElementById(id);
}

// ---------------------------------------------------------------------------
// KICKOFF DATA HELPERS
// ---------------------------------------------------------------------------
function getKickoffDataFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("data");
    if (raw) {
      return JSON.parse(decodeURIComponent(raw));
    }

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

function getKickoffContext() {
  if (kickoffCache !== null) return kickoffCache;
  kickoffCache = getKickoffDataFromUrl() || {};
  return kickoffCache;
}

// Prefill finalState + inputs from kickoff if available
function hydrateFromKickoff() {
  const kickoff = getKickoffContext();
  if (!kickoff || !kickoff.info) return;

  const info = kickoff.info;
  const dir = kickoff.directory || {};

  const mapPerson = (idProp, listKey, fallbackProp) => {
    if (typeof info[idProp] === "number" && Array.isArray(dir[listKey])) {
      return dir[listKey][info[idProp]] || "";
    }
    return info[fallbackProp] || "";
  };

  // Only fill if finalState is still empty
  if (!finalState.projectName) {
    finalState.projectName = info.projectName || info.name || "";
  }
  if (!finalState.client) {
    finalState.client =
      mapPerson("clientId", "clients", "client") ||
      info.clientName ||
      "";
  }
  if (!finalState.pm) {
    finalState.pm =
      mapPerson("pmId", "pms", "pm") ||
      info.pmName ||
      "";
  }
  if (!finalState.designer) {
    finalState.designer =
      mapPerson("designerId", "designers", "designer") ||
      info.designerName ||
      "";
  }
  if (!finalState.dev) {
    finalState.dev =
      mapPerson("devId", "devs", "dev") ||
      info.devName ||
      "";
  }

  // Push into inputs if they exist
  const projectNameEl = $("projectName");
  const clientEl = $("client");
  const pmEl = $("pm");
  const designerEl = $("designer");
  const devEl = $("dev");

  if (projectNameEl && !projectNameEl.value) projectNameEl.value = finalState.projectName;
  if (clientEl && !clientEl.value) clientEl.value = finalState.client;
  if (pmEl && !pmEl.value) pmEl.value = finalState.pm;
  if (designerEl && !designerEl.value) designerEl.value = finalState.designer;
  if (devEl && !devEl.value) devEl.value = finalState.dev;
}

// ---------------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------------
function initFinal() {
  const form = $("finalForm");
  const copyBtn = $("copyFinalSummaryBtn");

  hydrateFromKickoff();

  if (form) {
    form.addEventListener("input", handleInput);
  }

  // Initial summary + dashboard link
  updateSummary();

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const summary = $("finalSummary").value;
      copyToClipboard(summary);
      showStatus("✅ Final summary copied to clipboard");
    });
  }
}

// ---------------------------------------------------------------------------
// INPUT + SUMMARY
// ---------------------------------------------------------------------------
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

function buildDashboardPayload() {
  return {
    project: {
      name: finalState.projectName,
      client: finalState.client,
      pm: finalState.pm,
      designer: finalState.designer,
      dev: finalState.dev,
      kickoffDate: finalState.kickoffDate || "", 
      finalReviewDate: finalState.date || ""
    },
    final: {
      outcomes: finalState.outcomes,
      results: finalState.results,
      wins: finalState.wins,
      challenges: finalState.challenges,
      learnings: finalState.learnings,
      nextSteps: finalState.nextSteps
    },
    finalSummary: $("finalSummary").value
  };
}

function updateSummary() {
  const summaryEl = $("finalSummary");
  if (!summaryEl) return;

  // Build summary text
  const summaryText = buildFinalSummary();
  summaryEl.value = summaryText;

  // ---- Dashboard Linking Logic ----
  const dashBtn = document.getElementById("viewDashboardBtn");
  if (dashBtn) {
    // Build dashboard payload
    const payload = {
      project: {
        name: finalState.projectName || "",
        client: finalState.client || "",
        pm: finalState.pm || "",
        designer: finalState.designer || "",
        dev: finalState.dev || "",
        kickoffDate: finalState.kickoffDate || "",     // will be empty if not stored
        finalReviewDate: finalState.date || ""
      },
      final: {
        outcomes: finalState.outcomes || "",
        results: finalState.results || "",
        wins: finalState.wins || "",
        challenges: finalState.challenges || "",
        learnings: finalState.learnings || "",
        nextSteps: finalState.nextSteps || ""
      },
      finalSummary: summaryText
    };

    // Encode for URL
    const encoded = encodeURIComponent(JSON.stringify(payload));

    // Update dashboard link
    dashBtn.href = `dashboard.html?data=${encoded}`;

    // Also persist for fallback
    localStorage.setItem("metricMateDashboard", JSON.stringify(payload));
  }
}

// ---------------------------------------------------------------------------
// DASHBOARD PAYLOAD + LINK
// ---------------------------------------------------------------------------
function buildDashboardPayload(summaryText) {
  const kickoff = getKickoffContext();
  const info = kickoff.info || {};

  const project = {
    name: finalState.projectName || info.projectName || info.name || "",
    client: finalState.client || info.client || info.clientName || "",
    pm: finalState.pm || info.pm || info.pmName || "",
    designer: finalState.designer || info.designer || info.designerName || "",
    dev: finalState.dev || info.dev || info.devName || "",
    kickoffDate: info.date || info.kickoffDate || "",
    finalReviewDate: finalState.date || ""
  };

  return {
    project,
    kickoff,
    final: { ...finalState },
    finalSummary: summaryText || ""
  };
}

function updateDashboardLink(summaryText) {
  const link = $("dashboardLink");
  if (!link) return;

  try {
    const payload = buildDashboardPayload(summaryText);
    const encoded = encodeURIComponent(JSON.stringify(payload));
    link.href = `dashboard.html?data=${encoded}`;

    // Also drop into localStorage as a backup
    localStorage.setItem("metricMateDashboard", JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to update dashboard link", err);
  }
}

// ---------------------------------------------------------------------------
// SHARED HELPERS
// ---------------------------------------------------------------------------
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
