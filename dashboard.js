// ===============================
// Metric Mate – Project Dashboard
// ===============================

function loadDashboardData() {
  // 1) Try URL first
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("data");
    if (raw) {
      return JSON.parse(decodeURIComponent(raw));
    }
  } catch (e) {
    console.warn("Failed to parse dashboard data from URL", e);
  }

  // 2) Fallback: localStorage
  try {
    const stored = localStorage.getItem("metricMateDashboard");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Failed to load dashboard data from localStorage", e);
  }

  return null;
}

function renderDashboard(data) {
  const emptyEl = document.getElementById("dashboardEmpty");
  const contentEl = document.getElementById("dashboardContent");
  if (!emptyEl || !contentEl) return;

  if (!data || !data.project) {
    emptyEl.style.display = "block";
    contentEl.style.display = "none";
    return;
  }

  emptyEl.style.display = "none";
  contentEl.style.display = "grid";

  const project = data.project || {};
  const final = data.final || {};
  const summaryText = data.finalSummary || "";

  // Header
  const nameEl = document.getElementById("dashProjectName");
  const metaEl = document.getElementById("dashProjectMeta");
  const datesEl = document.getElementById("dashDates");

  if (nameEl) {
    nameEl.textContent = project.name || "Untitled project";
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
    const parts = [];
    if (project.kickoffDate) parts.push(`Kickoff: ${project.kickoffDate}`);
    if (project.finalReviewDate)
      parts.push(`Final review: ${project.finalReviewDate}`);
    datesEl.textContent = parts.join("  •  ");
  }

  // Body cards
  function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const v = (value || "").trim();
    el.textContent = v ? v : "—";
  }

  setText("dashOutcomes", final.outcomes);
  setText("dashResults", final.results);
  setText("dashWins", final.wins);
  setText("dashChallenges", final.challenges);
  setText("dashLearnings", final.learnings);
  setText("dashNextSteps", final.nextSteps);

  const summaryEl = document.getElementById("dashSummaryText");
  if (summaryEl) {
    summaryEl.textContent = summaryText || "—";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const data = loadDashboardData();
  renderDashboard(data);
});
