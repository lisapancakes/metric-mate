// =====================================
// Metric Mate – Project Dashboard
// Supports:
//  - kickoff-only: { kickoff: { info, directory, businessGoals, ... } }
//  - full:         { kickoff, midterm, final, finalSummary, project }
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
    info.kickoffDate || info.date || info.startDate || kickoff.kickoffDate || "";

  return project;
}

// -------------------------------
// Normalise payload into
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

  // Derive from kickoff if needed
  if (!data.project.name && data.kickoff) {
    const fromKickoff = deriveProjectFromKickoff(data.kickoff);
    data.project = { ...fromKickoff, ...data.project };
  }

  return data;
}

function buildKickoffBaseline(kickoff) {
  if (!kickoff) return null;

  const bg = (kickoff.businessGoals || []).filter(g => g.selected);
  const pg = (kickoff.productGoals || []).filter(g => g.selected);
  const ug = (kickoff.userGoals || []).filter(g => g.selected);
  const up = (kickoff.userPains || []).filter(g => g.selected);

  return {
    outcomes: bg.length
      ? `Business goals we committed to at kickoff: ${bg.map(g => g.label).join(', ')}.`
      : 'No business goals were selected during kickoff.',

    results: pg.length
      ? `Product / experience areas we agreed to improve: ${pg.map(g => g.label).join(', ')}.`
      : 'No product / experience goals were selected during kickoff.',

    wins: ug.length
      ? `User outcomes we want to enable: ${ug.map(g => g.label).join(', ')}.`
      : 'No user goals were selected during kickoff.',

    challenges: up.length
      ? `User pain points we want to reduce: ${up.map(g => g.label).join(', ')}.`
      : 'No user pain points were captured during kickoff.',

    learnings:
      'Midterm and Final surveys will capture learnings over time. For now, this is a kickoff-only baseline.',

    nextSteps:
      'Use this baseline to plan next steps. Once you complete the Midterm and Final reviews, this dashboard will show progress and outcomes over the full project lifecycle.'
  };
}

// -------------------------------
// Render dashboard UI
// -------------------------------
// -------------------------------
// Render dashboard UI
// -------------------------------
function renderDashboard(rawData) {
  const app = document.getElementById("app"); // mostly unused now, but we clear it
  const errorPanel = document.getElementById("errorPanel");
  const emptyState = document.getElementById("dashboardEmpty");
  const dashboardContent = document.getElementById("dashboardContent");

  const titleEl = document.getElementById("dashboardProjectTitle");
  const metaEl = document.getElementById("dashboardProjectMeta");
  const datesEl = document.getElementById("dashboardDates");
  const chipsEl = document.getElementById("statusChips");

  const dashOutcomes = document.getElementById("dashOutcomes");
  const dashResults = document.getElementById("dashResults");
  const dashWins = document.getElementById("dashWins");
  const dashChallenges = document.getElementById("dashChallenges");
  const dashLearnings = document.getElementById("dashLearnings");
  const dashNextSteps = document.getElementById("dashNextSteps");
  const dashSummaryText = document.getElementById("dashSummaryText");

  if (app) app.innerHTML = "";

  // Normalised data (for project meta, final, etc.)
  const data = normalizeDashboardData(rawData);

  console.log("DASHBOARD DATA:", rawData);

  if (!data || !data.project || !data.project.name) {
    if (errorPanel) {
      errorPanel.style.display = "block";
      errorPanel.textContent =
        "No project data found. Open this dashboard from a survey page so it can pass in context.";
    }
    if (dashboardContent) dashboardContent.style.display = "none";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (errorPanel) {
    errorPanel.style.display = "none";
    errorPanel.textContent = "";
  }

  if (emptyState) emptyState.style.display = "none";
  if (dashboardContent) dashboardContent.style.display = "grid";

  // Prefer normalised kickoff, but also keep a direct reference to the raw one
  const kickoff = data.kickoff || rawData && rawData.kickoff || null;
  const midterm = data.midterm;
  const final = data.final || {};
  const finalSummary = data.finalSummary || "";
  const project = data.project;

  console.log("KICKOFF OBJECT:", kickoff);

  // --- Status helpers ---
  const hasMidterm = !!(
    midterm &&
    (
      midterm.healthScore != null ||
      midterm.progressScore != null ||
      (Array.isArray(midterm.risks) && midterm.risks.length)
    )
  );

  const hasFinal = !!(
    final &&
    (
      final.outcomes ||
      final.results ||
      final.wins ||
      final.challenges ||
      final.learnings ||
      final.nextSteps
    )
  );

  // --- Header: title, meta, dates ---
  if (titleEl) {
    titleEl.textContent = project.name || "Untitled project";
  }

  if (metaEl) {
    const bits = [];
    if (project.client) bits.push(project.client);
    if (project.pm) bits.push(`PM: ${project.pm}`);
    if (project.designer) bits.push(`Designer: ${project.designer}`);
    if (project.dev) bits.push(`Dev: ${project.dev}`);
    metaEl.textContent = bits.join(" • ");
  }

  if (datesEl) {
    const dates = [];
    if (project.kickoffDate) dates.push(`Kickoff: ${project.kickoffDate}`);
    if (project.finalReviewDate && hasFinal) {
      dates.push(`Final review: ${project.finalReviewDate}`);
    }
    datesEl.textContent = dates.join(" • ");
  }

  if (chipsEl) {
    const chips = [];

    if (kickoff) {
      chips.push({ label: "Kickoff completed", tone: "primary" });
    }

    if (!hasMidterm) {
      chips.push({ label: "Midterm not started", tone: "muted" });
    } else {
      chips.push({ label: "Midterm completed", tone: "info" });
    }

    if (!hasFinal) {
      chips.push({ label: "Final review not started", tone: "muted" });
    } else {
      chips.push({ label: "Final review completed", tone: "success" });
    }

    chipsEl.innerHTML = chips
      .map(c => `<span class="chip chip--${c.tone}">${c.label}</span>`)
      .join("");
  }

  // --- Card content ---

  // If we have final data, show that (full project view)
  if (hasFinal) {
    if (dashOutcomes) {
      dashOutcomes.textContent = final.outcomes || "No data available yet.";
    }
    if (dashResults) {
      dashResults.textContent = final.results || "No data available yet.";
    }
    if (dashWins) {
      dashWins.textContent = final.wins || "No data available yet.";
    }
    if (dashChallenges) {
      dashChallenges.textContent = final.challenges || "No data available yet.";
    }
    if (dashLearnings) {
      dashLearnings.textContent = final.learnings || "No data available yet.";
    }
    if (dashNextSteps) {
      dashNextSteps.textContent = final.nextSteps || "No data available yet.";
    }
    if (dashSummaryText) {
      dashSummaryText.textContent =
        finalSummary ||
        "No final summary captured yet. Complete the Final Review survey to generate one.";
    }
    return;
  }

  // ---------- KICKOFF-ONLY BASELINE VIEW ----------

  // Helper to safely pull an array from kickoff (supports a couple of shapes)
  function getKickoffArray(propName) {
    if (!kickoff) return [];
    if (Array.isArray(kickoff[propName])) return kickoff[propName];

    // Fallback if we ever nest them under kickoff.goals.{...}
    if (kickoff.goals && Array.isArray(kickoff.goals[propName])) {
      return kickoff.goals[propName];
    }

    return [];
  }

  const selectedBusinessGoals = getKickoffArray("businessGoals").filter(g => g.selected);
  const selectedProductGoals = getKickoffArray("productGoals").filter(g => g.selected);
  const selectedUserGoals = getKickoffArray("userGoals").filter(g => g.selected);
  const selectedUserPains = getKickoffArray("userPains").filter(p => p.selected);

  console.log("SELECTED BUSINESS GOALS:", selectedBusinessGoals);

  // What we shipped → baseline business goals
  if (dashOutcomes) {
    if (selectedBusinessGoals.length) {
      const labels = selectedBusinessGoals.map(g => g.label).join(", ");
      dashOutcomes.textContent = `Baseline business focus at kickoff: ${labels}.`;
    } else {
      dashOutcomes.textContent =
        "No business goals were selected during kickoff.";
    }
  }

  // Results & Impact → product / experience goals baseline
  if (dashResults) {
    if (selectedProductGoals.length) {
      const labels = selectedProductGoals.map(g => g.label).join(", ");
      dashResults.textContent =
        `Baseline product / experience focus at kickoff: ${labels}. ` +
        "Results & impact will be captured at Midterm and Final review.";
    } else {
      dashResults.textContent =
        "No product / experience goals were selected during kickoff.";
    }
  }

  // Biggest Wins → user goals we want to enable
  if (dashWins) {
    if (selectedUserGoals.length) {
      const labels = selectedUserGoals.map(g => g.label).join(", ");
      dashWins.textContent =
        `Key user wins we’re aiming for: ${labels}. ` +
        "Future surveys will confirm if we achieved them.";
    } else {
      dashWins.textContent = "No user goals were selected during kickoff.";
    }
  }

  // Challenges → user pains
  if (dashChallenges) {
    if (selectedUserPains.length) {
      const labels = selectedUserPains.map(p => p.label).join(", ");
      dashChallenges.textContent =
        `User pain points we’re targeting: ${labels}.`;
    } else {
      dashChallenges.textContent =
        "No user pain points were captured during kickoff.";
    }
  }

  // Key Learnings → explanation
  if (dashLearnings) {
    dashLearnings.textContent =
      "Midterm and Final surveys will capture learnings over time. For now, this is a kickoff-only baseline.";
  }

  // Next Steps → explanation
  if (dashNextSteps) {
    dashNextSteps.textContent =
      "Use this baseline to plan next steps. Once you complete the Midterm and Final reviews, this dashboard will show progress and outcomes over the full project lifecycle.";
  }

  // Full Final Summary → placeholder
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
