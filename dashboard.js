// =====================================
// Metric Mate – Project Dashboard
// Works with:
//  - kickoff-only payloads: { kickoff: { info, directory, ... } }
//  - final payloads:        { project, final, finalSummary }
//  - combined payloads:     { kickoff, project, midterm, final, finalSummary }
// =====================================

// -------------------------------
// Load dashboard data
// -------------------------------
function loadDashboardData() {
  let data = null;

  // 1) URL ?data=... (preferred)
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("data");
    if (raw) {
      data = JSON.parse(decodeURIComponent(raw));
    }
  } catch (e) {
    console.warn("Failed to parse dashboard data from URL", e);
  }

  // 2) Fallback: localStorage snapshot
  if (!data) {
    try {
      const stored = localStorage.getItem("metricMateDashboard");
      if (stored) {
        data = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to load dashboard data from localStorage", e);
    }
  }

  return data;
}

// -------------------------------
// Derive project meta from kickoff
// (handles both id-based directory & direct strings)
// -------------------------------
function deriveProjectFromKickoff(kickoff) {
  if (!kickoff || !kickoff.info) return {};

  const info = kickoff.info || {};
  const dir = kickoff.directory || {};

  const project = {};

  // Name
  project.name = info.projectName || info.name || "";

  // Client
  if (typeof info.clientId === "number" && Array.isArray(dir.clients)) {
    project.client = dir.clients[info.clientId] || "";
  } else {
    project.client = info.client || info.clientName || "";
  }

  // PM
  if (typeof info.pmId === "number" && Array.isArray(dir.pms)) {
    project.pm = dir.pms[info.pmId] || "";
  } else {
    project.pm = info.pm || info.pmName || "";
  }

  // Designer
  if (typeof info.designerId === "number" && Array.isArray(dir.designers)) {
    project.designer = dir.designers[info.designerId] || "";
  } else {
    project.designer = info.designer || info.designerName || "";
  }

  // Dev
  if (typeof info.devId === "number" && Array.isArray(dir.devs)) {
    project.dev = dir.devs[info.devId] || "";
  } else {
    project.dev = info.dev || info.devName || "";
  }

  // Dates
  project.kickoffDate =
    info.kickoffDate || info.date || info.startDate || "";

  return project;
}

// -------------------------------
// Normalise any payload shape into
//   { project, kickoff, midterm, final, finalSummary }
// -------------------------------
function normalizeDashboardData(raw) {
  if (!raw) return null;

  const data = {
    kickoff: raw.kickoff || null,
    midterm: raw.midterm || null,
    final: raw.final || null,
    finalSummary: raw.finalSummary || "",
    project: raw.project ? { ...raw.project } : {}
  };

  // If we don't have a project.name, derive from kickoff.info
  if (!data.project.name && data.kickoff) {
    const fromKickoff = deriveProjectFromKickoff(data.kickoff);
    data.project = { ...fromKickoff, ...data.project };
  }

  return data;
}

// -------------------------------
// Small helper
// -------------------------------
function setText(el, value, fallback = "—") {
  if (!el) return;
  el.textContent = value && String(value).trim() ? value : fallback;
}

// -------------------------------
// Render dashboard UI
// -------------------------------
function renderDashboard(rawData) {
  const app = document.getElementById("app"); // old container, we clear it
  const errorPanel = document.getElementById("errorPanel");
  const emptyState = document.getElementById("dashboardEmpty");
  const content = document.getElementById("dashboardContent");

  if (app) app.innerHTML = ""; // we don't use this anymore, just clear it

  const data = normalizeDashboardData(rawData);

  if (!data || !data.project) {
    if (errorPanel) {
      errorPanel.style.display = "block";
      errorPanel.textContent =
        "No project data found. Open this dashboard from any survey page so it can pass in context.";
    }
    if (emptyState) emptyState.style.display = "block";
    if (content) content.style.display = "none";
    return;
  }

  if (errorPanel) {
    errorPanel.style.display = "none";
    errorPanel.textContent = "";
  }
  if (emptyState) emptyState.style.display = "none";
  if (content) content.style.display = "grid";

  const project = data.project;
  const kickoff = data.kickoff || null;
  const final = data.final || null;
  const finalSummary = data.finalSummary || "";

  // ---------------------------
  // Header: title, meta, dates
  // ---------------------------
  const titleEl = document.getElementById("dashboardProjectTitle");
  const projectMetaTop = document.getElementById("projectMeta");
  const projectMetaPill = document.getElementById("dashboardProjectMeta");
  const datesEl = document.getElementById("dashboardDates");
  const chipsEl = document.getElementById("statusChips");

  setText(titleEl, project.name || "Untitled project");

  const metaBits = [];
  if (project.client) metaBits.push(project.client);
  if (project.pm) metaBits.push(`PM: ${project.pm}`);
  if (project.designer) metaBits.push(`Designer: ${project.designer}`);
  if (project.dev) metaBits.push(`Dev: ${project.dev}`);
  const metaLine = metaBits.join(" • ");

  setText(projectMetaTop, metaLine, "");
  setText(projectMetaPill, metaLine, "");

  const dateBits = [];
  if (project.kickoffDate)
    dateBits.push(`Kickoff: ${project.kickoffDate}`);
  if (project.finalReviewDate)
    dateBits.push(`Final review: ${project.finalReviewDate}`);
  setText(datesEl, dateBits.join(" • "), "");

  // ---------------------------
  // Status chips
  // ---------------------------
  if (chipsEl) {
    chipsEl.innerHTML = "";

    // Simple rules for now
    if (final && Object.keys(final).length) {
      const chip = document.createElement("span");
      chip.className = "chip chip-success";
      chip.textContent = "Final review completed";
      chipsEl.appendChild(chip);
    } else if (kickoff) {
      const chip = document.createElement("span");
      chip.className = "chip chip-info";
      chip.textContent = "Kickoff completed • Midterm & Final not filled yet";
      chipsEl.appendChild(chip);
    } else {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = "No survey data yet";
      chipsEl.appendChild(chip);
    }
  }

  // ---------------------------
  // Content cards
  // ---------------------------
  const dashOutcomes = document.getElementById("dashOutcomes");
  const dashResults = document.getElementById("dashResults");
  const dashWins = document.getElementById("dashWins");
  const dashChallenges = document.getElementById("dashChallenges");
  const dashLearnings = document.getElementById("dashLearnings");
  const dashNextSteps = document.getElementById("dashNextSteps");
  const dashSummaryText = document.getElementById("dashSummaryText");

  // If we already have a final payload, use that
  const hasFinalContent =
    final &&
    (final.outcomes ||
      final.results ||
      final.wins ||
      final.challenges ||
      final.learnings ||
      final.nextSteps ||
      finalSummary);

  if (hasFinalContent) {
    setText(dashOutcomes, final.outcomes);
    setText(dashResults, final.results);
    setText(dashWins, final.wins);
    setText(dashChallenges, final.challenges);
    setText(dashLearnings, final.learnings);
    setText(dashNextSteps, final.nextSteps);
    if (dashSummaryText) {
      dashSummaryText.textContent = finalSummary || "—";
    }
    return;
  }

  // ---------------------------------
  // Kickoff-only view (baseline)
  // ---------------------------------
  let businessGoals = [];
  let productGoals = [];
  let userGoals = [];
  let userPains = [];

  if (kickoff) {
    if (Array.isArray(kickoff.businessGoals)) {
      businessGoals = kickoff.businessGoals.filter(g => g.selected);
    }
    if (Array.isArray(kickoff.productGoals)) {
      productGoals = kickoff.productGoals.filter(g => g.selected);
    }
    if (Array.isArray(kickoff.userGoals)) {
      userGoals = kickoff.userGoals.filter(g => g.selected);
    }
    if (Array.isArray(kickoff.userPains)) {
      userPains = kickoff.userPains.filter(p => p.selected);
    }
  }

  // For kickoff-only, we re-label cards as a baseline snapshot

  if (dashOutcomes) {
    if (businessGoals.length) {
      dashOutcomes.innerHTML =
        "<strong>Business goals at kickoff:</strong><br>" +
        businessGoals
          .map(
            g =>
              `• ${g.label}` +
              (g.currentScore ? ` (current state: ${g.currentScore}/5)` : "")
          )
          .join("<br>");
    } else {
      dashOutcomes.textContent =
        "No business goals were selected during kickoff.";
    }
  }

  if (dashResults) {
    if (productGoals.length) {
      dashResults.innerHTML =
        "<strong>Product / experience goals at kickoff:</strong><br>" +
        productGoals
          .map(
            g =>
              `• ${g.label}` +
              (g.currentScore ? ` (current state: ${g.currentScore}/5)` : "")
          )
          .join("<br>");
    } else {
      dashResults.textContent =
        "No product / experience goals were selected during kickoff.";
    }
  }

  if (dashWins) {
    if (userGoals.length) {
      dashWins.innerHTML =
        "<strong>User goals we’re aiming to support:</strong><br>" +
        userGoals
          .map(
            g =>
              `• ${g.label}` +
              (g.severity ? ` (importance today: ${g.severity}/5)` : "")
          )
          .join("<br>");
    } else {
      dashWins.textContent =
        "No user goals were selected during kickoff.";
    }
  }

  if (dashChallenges) {
    if (userPains.length) {
      dashChallenges.innerHTML =
        "<strong>User pain points identified at kickoff:</strong><br>" +
        userPains
          .map(
            p =>
              `• ${p.label}` +
              (p.severity ? ` (severity today: ${p.severity}/5)` : "")
          )
          .join("<br>");
    } else {
      dashChallenges.textContent =
        "No user pain points were captured during kickoff.";
    }
  }

  if (dashLearnings) {
    dashLearnings.textContent =
      "Midterm and Final surveys will capture learnings over time. For now, this is a kickoff-only baseline.";
  }

  if (dashNextSteps) {
    dashNextSteps.textContent =
      "Use this baseline to plan next steps. Once you complete the Midterm and Final reviews, this dashboard will show progress and outcomes over the full project lifecycle.";
  }

  if (dashSummaryText) {
    dashSummaryText.textContent =
      "Kickoff-only view: final narrative summary will appear here once the Final Review survey is completed.";
  }
}

// -------------------------------
// Init
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const data = loadDashboardData();
  renderDashboard(data);
});
