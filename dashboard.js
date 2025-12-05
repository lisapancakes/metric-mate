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

  // 1) URL ?data=... (preferred, always freshest)
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
  if (
    typeof info.designerId === "number" &&
    Array.isArray(dir.designers)
  ) {
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
// Helpers
// -------------------------------
function setText(el, text) {
  if (!el) return;
  el.textContent = text || "";
}

function joinList(labels) {
  if (!labels || !labels.length) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

// Build kickoff-based copy for each card
function buildKickoffCardCopy(kickoff) {
  const business = (kickoff.businessGoals || []).filter(g => g.selected);
  const product = (kickoff.productGoals || []).filter(g => g.selected);
  const userGoals = (kickoff.userGoals || []).filter(g => g.selected);
  const pains = (kickoff.userPains || []).filter(p => p.selected);

  const businessLabels = business.map(g => g.label);
  const productLabels = product.map(g => g.label);
  const goalLabels = userGoals.map(g => g.label);
  const painLabels = pains.map(p => p.label);

  // What we shipped (baseline = what we plan to change)
  let whatWeShipped;
  if (productLabels.length) {
    whatWeShipped = `At kickoff, we agreed to focus the work on ${
      joinList(productLabels)
    }. These will shape what we ultimately ship.`;
  } else if (businessLabels.length) {
    whatWeShipped = `At kickoff, we framed the project around business outcomes like ${joinList(
      businessLabels
    )}. Specific product changes will be defined as we move forward.`;
  } else {
    whatWeShipped =
      "No product or experience goals were selected during kickoff. This dashboard will update once Midterm and Final reviews are completed.";
  }

  // Results & impact (baseline = what success will look like)
  let resultsImpact;
  if (businessLabels.length) {
    resultsImpact = `Success will be measured against outcomes such as ${joinList(
      businessLabels
    )}. As we complete Midterm and Final reviews, this section will describe actual impact against those goals.`;
  } else {
    resultsImpact =
      "No business goals were selected during kickoff. Once goals are defined and later surveys are completed, this section will describe measured impact.";
  }

  // Biggest wins (baseline = opportunities / focus)
  let biggestWins;
  if (goalLabels.length) {
    biggestWins = `The biggest opportunities we identified for users are to help them ${joinList(
      goalLabels
    )}. Future wins will map back to how much we improve these goals.`;
  } else {
    biggestWins =
      "No user goals were captured during kickoff. As we collect more insight at Midterm and Final, this section will highlight concrete wins.";
  }

  // Challenges (baseline = user pains)
  let challenges;
  if (painLabels.length) {
    challenges = `Key user challenges we’re targeting include ${joinList(
      painLabels
    )}. Design and implementation work will focus on reducing these pain points.`;
  } else {
    challenges =
      "No user pain points were captured during kickoff. Later reviews will surface where users still struggle and what remains challenging.";
  }

  // Key learnings
  const keyLearnings =
    "Kickoff establishes our initial assumptions about goals, users, and constraints. Midterm and Final surveys will capture what we actually learned from the build and launch.";

  // Next steps
  const nextSteps =
    "Use this baseline to plan next steps and prioritize work. Completing the Midterm and Final surveys will turn this dashboard into a full narrative of what we shipped, the outcome, and what we’d do differently next time.";

  // Full summary text (baseline)
  const summaryText =
    "Kickoff-only view: final narrative summary will appear here once the Final Review survey is completed.";

  return {
    whatWeShipped,
    resultsImpact,
    biggestWins,
    challenges,
    keyLearnings,
    nextSteps,
    summaryText
  };
}

// -------------------------------
// Status chip
// -------------------------------
function renderStatusChip(container, data) {
  if (!container) return;

  container.innerHTML = "";

  let text = "Kickoff baseline only";
  let cls = "chip chip--info";

  if (data.final) {
    text = "Final review completed";
    cls = "chip chip--success";
  } else if (data.midterm) {
    text = "Midterm review completed";
    cls = "chip chip--progress";
  }

  const chip = document.createElement("span");
  chip.className = cls;
  chip.textContent = text;
  container.appendChild(chip);
}

// -------------------------------
// Render dashboard UI
// -------------------------------
function renderDashboard(rawData) {
  const errorPanel = document.getElementById("errorPanel");
  const emptyState = document.getElementById("dashboardEmpty");
  const content = document.getElementById("dashboardContent");

  const titleEl = document.getElementById("dashboardProjectTitle");
  const metaEl = document.getElementById("dashboardProjectMeta");
  const datesEl = document.getElementById("dashboardDates");
  const statusChipsEl = document.getElementById("statusChips");

  const outEl = document.getElementById("dashOutcomes");
  const resultsEl = document.getElementById("dashResults");
  const winsEl = document.getElementById("dashWins");
  const challengesEl = document.getElementById("dashChallenges");
  const learningsEl = document.getElementById("dashLearnings");
  const nextStepsEl = document.getElementById("dashNextSteps");
  const summaryPre = document.getElementById("dashSummaryText");

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
  const kickoff = data.kickoff || {};
  const final = data.final || {};
  const finalSummary = data.finalSummary || "";

  // ---- Header ----
  setText(titleEl, project.name || "Untitled project");

  const metaBits = [];
  if (project.client) metaBits.push(project.client);
  if (project.pm) metaBits.push(`PM: ${project.pm}`);
  if (project.designer) metaBits.push(`Designer: ${project.designer}`);
  if (project.dev) metaBits.push(`Dev: ${project.dev}`);
  setText(metaEl, metaBits.join(" • "));

  const dateBits = [];
  if (project.kickoffDate)
    dateBits.push(`Kickoff: ${project.kickoffDate}`);
  if (project.finalReviewDate)
    dateBits.push(`Final review: ${project.finalReviewDate}`);
  setText(datesEl, dateBits.join(" • "));

  renderStatusChip(statusChipsEl, data);

  // ---- Cards ----
  if (final && (
      final.outcomes ||
      final.results ||
      final.wins ||
      final.challenges ||
      final.learnings ||
      final.nextSteps
    )) {
    // We have final data – use it directly
    setText(outEl, final.outcomes || "—");
    setText(resultsEl, final.results || "—");
    setText(winsEl, final.wins || "—");
    setText(challengesEl, final.challenges || "—");
    setText(learningsEl, final.learnings || "—");
    setText(nextStepsEl, final.nextSteps || "—");
    summaryPre.textContent = finalSummary || "—";
  } else if (kickoff && kickoff.businessGoals) {
    // Kickoff-only baseline view
    const baseline = buildKickoffCardCopy(kickoff);
    setText(outEl, baseline.whatWeShipped);
    setText(resultsEl, baseline.resultsImpact);
    setText(winsEl, baseline.biggestWins);
    setText(challengesEl, baseline.challenges);
    setText(learningsEl, baseline.keyLearnings);
    setText(nextStepsEl, baseline.nextSteps);
    summaryPre.textContent = baseline.summaryText;
  } else {
    // Fallback (should be rare)
    setText(outEl, "No data available yet.");
    setText(resultsEl, "No data available yet.");
    setText(winsEl, "No data available yet.");
    setText(challengesEl, "No data available yet.");
    setText(learningsEl, "No data available yet.");
    setText(nextStepsEl, "No data available yet.");
    summaryPre.textContent =
      "No survey responses have been captured for this project.";
  }
}

// -------------------------------
// Init
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const data = loadDashboardData();
  renderDashboard(data);
});
