// dashboard.js - Metric Mate Project Dashboard

function loadDashboardData() {
  // 1) Try URL ?data=...
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

  const project = data.project;
  const final = data.final || {};
  const summaryText = data.finalSummary || "";

  // Header pill
  const titleEl = document.getElementById("dashboardProjectTitle");
  const metaEl = document.getElementById("dashboardProjectMeta");
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

  // Dates
  const datesEl = document.getElementById("dashboardDates");
  if (datesEl) {
    const parts = [];
    if (project.kickoffDate) parts.push(`Kickoff: ${project.kickoffDate}`);
    if (project.finalReviewDate) parts.push(`Final review: ${project.finalReviewDate}`);
    datesEl.textContent = parts.join("  •  ");
  }

  // Cards
  const outcomesEl = document.getElementById("dashOutcomes");
  const resultsEl = document.getElementById("dashResults");
  const winsEl = document.getElementById("dashWins");
  const challengesEl = document.getElementById("dashChallenges");
  const learningsEl = document.getElementById("dashLearnings");
  const nextStepsEl = document.getElementById("dashNextSteps");
  const summaryEl = document.getElementById("dashSummaryText");

  if (outcomesEl) outcomesEl.textContent = final.outcomes || "—";
  if (resultsEl) resultsEl.textContent = final.results || "—";
  if (winsEl) winsEl.textContent = final.wins || "—";
  if (challengesEl) challengesEl.textContent = final.challenges || "—";
  if (learningsEl) learningsEl.textContent = final.learnings || "—";
  if (nextStepsEl) nextStepsEl.textContent = final.nextSteps || "—";
  if (summaryEl) summaryEl.textContent = summaryText || "—";
}

document.addEventListener("DOMContentLoaded", () => {
  const data = loadDashboardData();
  renderDashboard(data);
});
