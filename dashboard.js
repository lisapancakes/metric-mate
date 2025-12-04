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
// Render helpers
// -------------------------------
function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (typeof text === "string") el.textContent = text;
  return el;
}

// -------------------------------
// Render dashboard UI
// -------------------------------
function renderDashboard(rawData) {
  const app = document.getElementById("app");
  const errorPanel = document.getElementById("errorPanel");

  if (!app) return;

  const data = normalizeDashboardData(rawData);

  if (!data || !data.project) {
    if (errorPanel) {
      errorPanel.style.display = "block";
      errorPanel.textContent =
        "No project data found. Open this dashboard from any survey page so it can pass in context.";
    }
    app.innerHTML = "";
    return;
  }

  if (errorPanel) {
    errorPanel.style.display = "none";
    errorPanel.textContent = "";
  }

  const project = data.project;
  const final = data.final || {};
  const summaryText = data.finalSummary || "";

  app.innerHTML = ""; // clear previous content

  // Shell
  const shell = createEl("div", "dash-shell");

  // Header pill
  const headerCard = createEl("div", "dash-header-card");
  const title = createEl(
    "div",
    "dash-project-name",
    project.name || "Untitled project"
  );

  const metaBits = [];
  if (project.client) metaBits.push(project.client);
  if (project.pm) metaBits.push(`PM: ${project.pm}`);
  if (project.designer) metaBits.push(`Designer: ${project.designer}`);
  if (project.dev) metaBits.push(`Dev: ${project.dev}`);

  const meta = createEl(
    "div",
    "dash-project-meta",
    metaBits.join(" • ")
  );

  const dateBits = [];
  if (project.kickoffDate)
    dateBits.push(`Kickoff: ${project.kickoffDate}`);
  if (project.finalReviewDate)
    dateBits.push(`Final review: ${project.finalReviewDate}`);

  const dates = createEl(
    "div",
    "dash-project-dates",
    dateBits.join(" • ")
  );

  headerCard.appendChild(title);
  if (metaBits.length) headerCard.appendChild(meta);
  if (dateBits.length) headerCard.appendChild(dates);

  // Content card
  const contentCard = createEl("div", "dash-content-card");

  function addSection(label, value) {
    const section = createEl("section", "dash-section");
    const h = createEl("h3", "dash-section-title", label);
    const p = createEl("p", "dash-section-body", value || "—");
    section.appendChild(h);
    section.appendChild(p);
    contentCard.appendChild(section);
  }

  addSection("What we shipped", final.outcomes || "");
  addSection("Results & impact", final.results || "");
  addSection("Biggest wins", final.wins || "");
  addSection("Challenges", final.challenges || "");
  addSection("Key learnings", final.learnings || "");
  addSection("Next steps", final.nextSteps || "");

  // Full summary
  const summarySection = createEl("section", "dash-section dash-summary");
  const summaryTitle = createEl(
    "h3",
    "dash-section-title",
    "Full Final Summary"
  );
  const summaryPre = createEl("pre", "dash-summary-pre");
  summaryPre.textContent = summaryText || "—";

  summarySection.appendChild(summaryTitle);
  summarySection.appendChild(summaryPre);

  contentCard.appendChild(summarySection);

  // Assemble
  shell.appendChild(headerCard);
  shell.appendChild(contentCard);
  app.appendChild(shell);
}

// -------------------------------
// Init
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const data = loadDashboardData();
  renderDashboard(data);
});
