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

function createCard(title, bodyContent) {
  const card = document.createElement("section");
  card.className = "mm-card";

  const h2 = document.createElement("h2");
  h2.className = "mm-card-title";
  h2.textContent = title;

  const body = document.createElement("div");
  body.className = "mm-card-body";

  if (typeof bodyContent === "string") {
    const p = document.createElement("p");
    p.textContent = bodyContent;
    body.appendChild(p);
  } else if (bodyContent instanceof Node) {
    body.appendChild(bodyContent);
  } else if (Array.isArray(bodyContent)) {
    bodyContent.forEach((node) => body.appendChild(node));
  }

  card.appendChild(h2);
  card.appendChild(body);
  return card;
}

function renderDashboard(data) {
  const app = document.getElementById("app");
  const errorPanel = document.getElementById("errorPanel");

  if (!app) return;
  app.innerHTML = "";

  if (!data) {
    if (errorPanel) {
      errorPanel.style.display = "block";
      errorPanel.textContent =
        "No project data found. Please open the dashboard from the Final Review page so all context is passed in.";
    } else {
      const p = document.createElement("p");
      p.textContent =
        "No project data found. Please open the dashboard from the Final Review page so all context is passed in.";
      app.appendChild(p);
    }
    return;
  }

  if (errorPanel) {
    errorPanel.style.display = "none";
    errorPanel.textContent = "";
  }

  const project = data.project || {};
  const midterm = data.midterm || null;
  const final = data.final || {};
  const finalSummary = data.finalSummary || "";

  // --- Quick snapshot card ---
  const snapshotNodes = [];

  const titleLine = document.createElement("p");
  titleLine.className = "mm-kv";
  titleLine.innerHTML = `<strong>Project:</strong> ${
    project.name || "Untitled project"
  }`;
  snapshotNodes.push(titleLine);

  if (project.client) {
    const clientLine = document.createElement("p");
    clientLine.className = "mm-kv";
    clientLine.innerHTML = `<strong>Client:</strong> ${project.client}`;
    snapshotNodes.push(clientLine);
  }

  const teamBits = [];
  if (project.pm) teamBits.push(`PM: ${project.pm}`);
  if (project.designer) teamBits.push(`Designer: ${project.designer}`);
  if (project.dev) teamBits.push(`Dev: ${project.dev}`);

  if (teamBits.length) {
    const teamLine = document.createElement("p");
    teamLine.className = "mm-kv";
    teamLine.innerHTML = `<strong>Team:</strong> ${teamBits.join(" • ")}`;
    snapshotNodes.push(teamLine);
  }

  if (project.finalReviewDate) {
    const dateLine = document.createElement("p");
    dateLine.className = "mm-kv";
    dateLine.innerHTML = `<strong>Final review:</strong> ${project.finalReviewDate}`;
    snapshotNodes.push(dateLine);
  }

  if (midterm && midterm.info && midterm.info.date) {
    const midLine = document.createElement("p");
    midLine.className = "mm-kv";
    midLine.innerHTML = `<strong>Mid-project review:</strong> ${midterm.info.date}`;
    snapshotNodes.push(midLine);
  }

  if (midterm && typeof midterm.healthScore === "number") {
    const healthLine = document.createElement("p");
    healthLine.className = "mm-kv";
    healthLine.innerHTML = `<strong>Mid-project health:</strong> ${midterm.healthScore}/5`;
    snapshotNodes.push(healthLine);
  }

  const snapshotCard = createCard("Quick snapshot", snapshotNodes);

  // --- Mid-project snapshot card (if any) ---
  let midCard = null;
  if (midterm && midterm.internalSummary) {
    const pre = document.createElement("textarea");
    pre.className = "mm-summary-block";
    pre.readOnly = true;
    pre.rows = 12;
    pre.value = midterm.internalSummary;

    midCard = createCard("Mid-project snapshot", pre);
  }

  // --- Outcomes & impact card ---
  const outcomesNodes = [];

  const labelValue = (label, value) => {
    if (!value || !value.trim()) return;
    const p = document.createElement("p");
    p.className = "mm-kv-block";
    const strong = document.createElement("strong");
    strong.textContent = label;
    const span = document.createElement("span");
    span.textContent = ` ${value.trim()}`;
    p.appendChild(strong);
    p.appendChild(span);
    outcomesNodes.push(p);
  };

  labelValue("What we shipped:", final.outcomes);
  labelValue("Results / impact:", final.results);
  labelValue("Biggest wins:", final.wins);
  labelValue("Challenges / misses:", final.challenges);
  labelValue("Key learnings:", final.learnings);
  labelValue("Next steps / follow-ups:", final.nextSteps);

  if (!outcomesNodes.length) {
    const p = document.createElement("p");
    p.textContent = "No final outcomes captured yet.";
    outcomesNodes.push(p);
  }

  const outcomesCard = createCard("Outcomes & impact", outcomesNodes);

  // --- Final summary card ---
  const summaryArea = document.createElement("textarea");
  summaryArea.className = "mm-summary-block";
  summaryArea.readOnly = true;
  summaryArea.rows = 16;
  summaryArea.value =
    finalSummary || "No final summary has been generated yet.";

  const summaryCard = createCard("Final summary to reuse", summaryArea);

  // Append everything
  app.appendChild(snapshotCard);
  if (midCard) app.appendChild(midCard);
  app.appendChild(outcomesCard);
  app.appendChild(summaryCard);
}

document.addEventListener("DOMContentLoaded", () => {
  const data = loadDashboardData();
  renderDashboard(data);
});
