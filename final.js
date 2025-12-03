// ===============================
// Metric Mate – Final Review
// CLEAN + WORKING VERSION
// ===============================

// -------------------------------
// STATE
// -------------------------------
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

function $(id) {
  return document.getElementById(id);
}

// -------------------------------
// LOAD KICKOFF + MIDTERM
// -------------------------------
function loadKickoffData() {
  try {
    const stored = localStorage.getItem("metricMateKickoff");
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return null;
}

function loadMidtermData() {
  try {
    const stored = localStorage.getItem("metricMateMidterm");
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return null;
}

// -------------------------------
// INIT
// -------------------------------
function initFinal() {
  const form = $("finalForm");
  const copyBtn = $("copyFinalSummaryBtn");

  hydrateForm();

  if (form) form.addEventListener("input", handleInput);

  updateSummary();

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      copyToClipboard($("finalSummary").value);
      showStatus("✅ Final summary copied");
    });
  }
}

// -------------------------------
// HYDRATE FROM KICKOFF + MIDTERM
// -------------------------------
function hydrateFormFromKickoffMidterm() {
  const kickoff = loadKickoffData();
  const midterm = loadMidtermData();

  // Kickoff data (simple text fields)
  if (kickoff && kickoff.info) {
    finalState.projectName = kickoff.info.name || "";
    finalState.client      = kickoff.info.client || "";
    finalState.pm          = kickoff.info.pm || "";
    finalState.designer    = kickoff.info.designer || "";
    finalState.dev         = kickoff.info.dev || "";
  }

  // Midterm fallback for review date
  if (midterm && midterm.info) {
    finalState.date = midterm.info.date || "";
  }

  // Fill UI
  $("projectName").value = finalState.projectName;
  $("client").value      = finalState.client;
  $("pm").value          = finalState.pm;
  $("designer").value    = finalState.designer;
  $("dev").value         = finalState.dev;
  $("date").value        = finalState.date;
}

// -------------------------------
// INPUT HANDLER
// -------------------------------
function handleInput(e) {
  const id = e.target.id;
  if (finalState.hasOwnProperty(id)) {
    finalState[id] = e.target.value;
  }
  updateSummary();
}

// -------------------------------
// SUMMARY + DASHBOARD LINK
// -------------------------------
function updateSummary() {
  const summaryEl = $("finalSummary");
  if (!summaryEl) return;

  const summary = buildFinalSummary();
  summaryEl.value = summary;

  saveFinalToStorage(summary);
  updateDashboardLink(summary);
}

function buildFinalSummary() {
  const s = finalState;
  let out = [];

  out.push("FINAL PROJECT REVIEW — INTERNAL");
  out.push("--------------------------------");
  out.push(`Project: ${s.projectName || "Untitled project"}`);
  if (s.client) out.push(`Client: ${s.client}`);
  if (s.pm) out.push(`PM: ${s.pm}`);
  if (s.designer) out.push(`Product Designer: ${s.designer}`);
  if (s.dev) out.push(`Lead Developer: ${s.dev}`);
  if (s.date) out.push(`Final review date: ${s.date}`);
  out.push("");

  if (s.outcomes.trim()) {
    out.push("What we shipped:"); 
    out.push(s.outcomes.trim(), "");
  }
  if (s.results.trim()) {
    out.push("Results / impact:");
    out.push(s.results.trim(), "");
  }
  if (s.wins.trim()) {
    out.push("Biggest wins:");
    out.push(s.wins.trim(), "");
  }
  if (s.challenges.trim()) {
    out.push("Challenges / misses:");
    out.push(s.challenges.trim(), "");
  }
  if (s.learnings.trim()) {
    out.push("Key learnings:");
    out.push(s.learnings.trim(), "");
  }
  if (s.nextSteps.trim()) {
    out.push("Next steps / follow-ups:");
    out.push(s.nextSteps.trim());
  }

  return out.join("\n");
}

// -------------------------------
// DASHBOARD LINK + STORAGE
// -------------------------------
function saveFinalToStorage(summaryText) {
  const kickoff = loadKickoffData();

  const payload = {
    project: {
      name: finalState.projectName,
      client: finalState.client,
      pm: finalState.pm,
      designer: finalState.designer,
      dev: finalState.dev,
      kickoffDate: kickoff?.info?.date || "",
      finalReviewDate: finalState.date
    },
    final: { ...finalState },
    finalSummary: summaryText
  };

  localStorage.setItem("metricMateFinal", JSON.stringify(payload));
  localStorage.setItem("metricMateDashboard", JSON.stringify(payload));
}

function updateDashboardLink(summaryText) {
  const link = $("openDashboardBtn");
  if (!link) return;

  const kickoff = loadKickoffData();
  const midterm = loadMidtermData();
  const final = JSON.parse(localStorage.getItem("metricMateFinal") || "{}");

  const payload = {
    kickoff,
    midterm,
    final,
    project: final.project,
    finalSummary: summaryText
  };

  const encoded = encodeURIComponent(JSON.stringify(payload));
  link.href = `dashboard.html?data=${encoded}`;
}

// -------------------------------
// HELPERS
// -------------------------------
function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  });
}

function showStatus(msg) {
  let el = $("copyStatus");
  if (!el) {
    el = document.createElement("div");
    el.id = "copyStatus";
    el.className = "status-message";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => (el.style.display = "none"), 2200);
}

// -------------------------------
document.addEventListener("DOMContentLoaded", initFinal);
