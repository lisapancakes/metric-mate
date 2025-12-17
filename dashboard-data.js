// =====================================
// Metric Mate – Dashboard Data Helpers
// Responsibilities:
//  - Load dashboard data from URL or localStorage
//  - Normalize payloads into a consistent shape
//  - Derive project metadata from kickoff inputs
// =====================================

// Load dashboard data from either the URL query param or a saved snapshot
function loadDashboardData() {
  let data = null;
  let source = "none";

  // Primary: saved snapshot
  try {
    const stored = localStorage.getItem("metricMateDashboard");
    if (stored) {
      data = JSON.parse(stored);
      source = "metricMateDashboard";
    }
  } catch (e) {
    console.warn("Failed to load dashboard data from localStorage snapshot", e);
  }

  // If we loaded a snapshot, opportunistically fill in any missing survey payloads
  // from their canonical localStorage keys (midterm flow can save `final: null`).
  if (data) {
    try {
      const forcePhase = data.forcePhase || data.phase || null;
      const allowMergingOtherSurveys = forcePhase !== "kickoff";

      const kickoffStored = JSON.parse(localStorage.getItem("metricMateKickoff") || "null");
      const midtermStored = JSON.parse(localStorage.getItem("metricMateMidterm") || "null");
      const finalStored = JSON.parse(localStorage.getItem("metricMateFinal") || "null");

      if (!data.kickoff && kickoffStored) data.kickoff = kickoffStored;
      if (allowMergingOtherSurveys) {
        if (!data.midterm && midtermStored) data.midterm = midtermStored;
        if (!data.final && finalStored) data.final = finalStored;
      }

      // Prefer final goals when available so the dashboard can render the final view correctly.
      if (
        allowMergingOtherSurveys &&
        (!Array.isArray(data.goals) || data.goals.length === 0) &&
        finalStored &&
        Array.isArray(finalStored.goals) &&
        finalStored.goals.length
      ) {
        data.goals = finalStored.goals;
      }
    } catch (e) {
      console.warn("Failed to merge survey localStorage into dashboard snapshot", e);
    }
  }

  // Last-resort fallback: stitch together whatever survey data exists
  if (!data) {
    try {
      const kickoff = JSON.parse(localStorage.getItem("metricMateKickoff") || "null");
      const midterm = JSON.parse(localStorage.getItem("metricMateMidterm") || "null");
      const final = JSON.parse(localStorage.getItem("metricMateFinal") || "null");
      if (kickoff || midterm || final) {
        const goals = final && Array.isArray(final.goals) ? final.goals : [];
        data = { kickoff, midterm, final, goals };
        source = "survey-localStorage";
      }
    } catch (e) {
      console.warn("Failed to assemble fallback dashboard data", e);
    }
  }

  if (data) {
    console.log("[dashboard-data] Loaded dashboard data from:", source);
  } else {
    console.log("[dashboard-data] No dashboard data found (source:", source, ")");
  }

  return data;
}

// Derive project meta from kickoff (supports both id-based directory & direct strings)
function deriveProjectFromKickoff(kickoff) {
  if (!kickoff || !kickoff.info) return {};

  const info = kickoff.info || {};
  const dir = kickoff.directory || {};

  const project = {};

  // Name
  project.name = info.projectName || info.name || "";

  // Summary (one-sentence)
  project.summary = info.projectSummary || info.summary || "";

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

// Normalize payload into a consistent { project, kickoff, midterm, final, finalSummary }
function normalizeDashboardData(raw) {
  if (!raw) return null;

  const data = {
    forcePhase: raw.forcePhase || raw.phase || null,
    kickoff: raw.kickoff || null,
    midterm: raw.midterm || null,
    final: raw.final || null,
    goals: Array.isArray(raw.goals)
      ? [...raw.goals]
      : (raw.midterm && Array.isArray(raw.midterm.goalStatuses))
        ? [...raw.midterm.goalStatuses]
        : [],
    finalSummary: raw.finalSummary || "",
    project: raw.project ? { ...raw.project } : {}
  };

  // Derive from kickoff and merge any missing fields
  if (data.kickoff) {
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
      ? `Business goals we committed to at kickoff: ${bg.map(g => g.label).join(", ")}.`
      : "No business goals were selected during kickoff.",

    results: pg.length
      ? `Product / experience areas we agreed to improve: ${pg.map(g => g.label).join(", ")}.`
      : "No product / experience goals were selected during kickoff.",

    wins: ug.length
      ? `User outcomes we want to enable: ${ug.map(g => g.label).join(", ")}.`
      : "No user goals were selected during kickoff.",

    challenges: up.length
      ? `User pain points we want to reduce: ${up.map(g => g.label).join(", ")}.`
      : "No user pain points were captured during kickoff.",

    learnings:
      "Midterm and Final surveys will capture learnings over time. For now, this is a kickoff-only baseline.",

    nextSteps:
      "Use this baseline to plan next steps. Once you complete the Midterm and Final reviews, this dashboard will show progress and outcomes over the full project lifecycle."
  };
}
