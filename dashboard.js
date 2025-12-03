// dashboard.js – Metric Mate Project Dashboard (matches current dashboard.html)

// --------------------------------------
// Load data from URL ?data=... or localStorage
// --------------------------------------
function loadDashboardData() {
  let rawPayload = null;

  // 1) Try ?data=... in the URL
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("data");
    if (raw) {
      rawPayload = JSON.parse(decodeURIComponent(raw));
    }
  } catch (e) {
    console.warn("Dashboard: failed to parse data from URL", e);
  }

  // 2) Fallback: localStorage
  if (!rawPayload) {
    try {
      const stored = localStorage.getItem("metricMateDashboard");
      if (stored) {
        rawPayload = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Dashboard: failed to parse metricMateDashboard from localStorage", e);
    }
  }

  return normalizeDashboardData(rawPayload);
}

// --------------------------------------
// Normalize data shape (handles new + old formats)
// --------------------------------------
function normalizeDashboardData(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      project: {},
      final: {},
      finalSummary: ""
    };
  }

  // New-style payload (what final.js is currently writing):
  // { project: {...}, final: {...}, finalSummary: "..." }
  if (raw.project || raw.final || raw.finalSummary) {
    return {
      project: raw.project || {},
      final: raw.final || {},
      finalSummary: raw.finalSummary || ""
    };
  }

  // Fallback: older / flat shape
  const project = {
    name: raw.projectName || raw.name || "",
    client: raw.client || "",
    pm: raw.pm || "",
    designer: raw.designer || "",
    dev: raw.dev || "",
    kickoffDate: raw.kickoffDate || raw.kickoff_date || "",
    finalReviewDate: raw.date || raw.finalReviewDate || ""
  };

  const final = {
    outcomes: raw.outcomes || "",
    results: raw.results || "",
    wins: raw.wins || "",
    challenges: raw.challenges || "",
    learnings: raw.learnings || "",
    nextSteps: raw.nextSteps || ""
  };

  const finalSummary = raw.summary || raw.finalSummary || "";

  return { project, final, finalSummary };
}

// --------------------------------------
// Rendering helpers
// --------------------------------------
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nl2br(str) {
  if (!str) return "";
  return str.replace(/\n/g, "<br>");
}

// --------------------------------------
// Render dashboard into #app
// --------------------------------------
function renderDashboard(data) {
  const app = document.getElementById("app");
  const errorPanel = document.getElementById("errorPanel");
  const projectMetaEl = document.getElementById("projectMeta");

  if (!app || !errorPanel) return;

  const project = data.project || {};
  const final = data.final || {};
  const finalSummary = data.finalSummary || "";

  const hasProjectBits =
    project.name ||
    project.client ||
    project.pm ||
    project.designer ||
    project.dev;

  const hasFinalBits = Object.values(final).some(
    (v) => typeof v === "string" && v.trim() !== ""
  );

  const hasSummary = typeof finalSummary === "string" && finalSummary.trim() !== "";

  // If there's really nothing, show the "open from Final Review" message
  if (!hasProjectBits && !hasFinalBits && !hasSummary) {
    app.innerHTML = "";
    errorPanel.textContent =
      "No project data found. Open this dashboard from the Final Review page so it can pass in all context.";
    errorPanel.style.display = "block";
    return;
  }

  errorPanel.style.display = "none";

  // Header meta line under "Project Dashboard"
  if (projectMetaEl) {
    const bits = [];
    if (project.client) bits.push(project.client);

    const peopleBits = [];
    if (project.pm) peopleBits.push(`PM: ${project.pm}`);
    if (project.designer) peopleBits.push(`Designer: ${project.designer}`);
    if (project.dev) peopleBits.push(`Dev: ${project.dev}`);

    if (peopleBits.length) bits.push(peopleBits.join(" • "));
    projectMetaEl.textContent = bits.join(" • ");
  }

  // Shell
  const shell = document.createElement("div");
  shell.className = "dash-shell";

  // Project pill
  const pill = document.createElement("div");
  pill.className = "dash-pill";
  const dates = [
    project.kickoffDate ? `Kickoff: ${escapeHtml(project.kickoffDate)}` : "",
    project.finalReviewDate
      ? `Final review: ${escapeHtml(project.finalReviewDate)}`
      : ""
  ]
    .filter(Boolean)
    .join(" • ");

  pill.innerHTML = `
    <div class="dash-pill-title">${escapeHtml(
      project.name || "Untitled project"
    )}</div>
    <div class="dash-pill-meta">${dates}</div>
  `;
  shell.appendChild(pill);

  // Grid of cards
  const grid = document.createElement("div");
  grid.className = "dash-grid";

  const sections = [
    ["What we shipped", final.outcomes],
    ["Results & impact", final.results],
    ["Biggest wins", final.wins],
    ["Challenges", final.challenges],
    ["Key learnings", final.learnings],
    ["Next steps", final.nextSteps]
  ];

  sections.forEach(([title, value]) => {
    const card = document.createElement("section");
    card.className = "dash-card";
    card.innerHTML = `
      <h2 class="dash-card-title">${escapeHtml(title)}</h2>
      <p class="dash-card-body">${
        value && value.trim()
          ? nl2br(escapeHtml(value.trim()))
          : "—"
      }</p>
    `;
    grid.appendChild(card);
  });

  const summaryCard = document.createElement("section");
  summaryCard.className = "dash-card dash-card-wide";
  summaryCard.innerHTML = `
    <h2 class="dash-card-title">Full Final Summary</h2>
    <pre class="dash-summary-block">${
      finalSummary && finalSummary.trim()
        ? escapeHtml(finalSummary.trim())
        : "—"
    }</pre>
  `;
  grid.appendChild(summaryCard);

  shell.appendChild(grid);

  app.innerHTML = "";
  app.appendChild(shell);
}

// --------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const data = loadDashboardData();
  renderDashboard(data);
});
