// ===============================
// Metric Mate – Final Review
// CLEAN VERSION
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
// Load Kickoff + Midterm Data
// -------------------------------
function loadKickoffData() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("data");
    if (raw) return JSON.parse(decodeURIComponent(raw));
  } catch (e) {
    console.warn("Failed URL kickoff data", e);
  }

  try {
    const stored = localStorage.getItem("metricMateKickoff");
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn("Failed local kickoff data", e);
  }

  return null;
}

function loadMidtermData() {
  try {
    const stored = localStorage.getItem("metricMateMidterm");
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn("No midterm data found", e);
  }

  return null;
}

// -------------------------------
// INIT
// -------------------------------
function initFinal() {
  const form = $("finalForm");
  const copyBtn = $("copyFinalSummaryBtn");

  hydrateFormFromKickoffMidterm();

  if (form) {
    form.addEventListener("input", handleInput);
  }

  updateSummary(); // generate initial summary

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const summary = $("finalSummary").value;
      copyToClipboard(summary);
      showStatus("✅ Final summary copied to clipboard");
    });
  }
}

// -------------------------------
// Hydrate Final Form
// -------------------------------
function hydrateFormFromKickoffMidterm() {
  const kickoff = loadKickoffData();
  const midterm = loadMidtermData();

  const info = kickoff?.info || {};

  finalState.projectName = info.projectName || "";
  finalState.client = info.client || "";
  finalState.pm = info.pm || "";
  finalState.designer = info.designer || "";
  finalState.dev = info.dev || "";

  // If midterm had a date (end-review suggestion), allow fallback
  finalState.date = midterm?.info?.date || "";

  $("projectName").value = finalState.projectName;
  $("client").value = finalState.client;
  $("pm").value = finalState.pm;
  $("designer").value = finalState.designer;
  $("dev").value = finalState.dev;
  $("date").value = finalState.date;
}

// -------------------------------
// INPUT HANDLERS
// -------------------------------
function handleInput(e) {
  const t = e.target;
  const val = t.value || "";

  if (finalState.hasOwnProperty(t.id)) {
    finalState[t.id] = val;
  }

  updateSummary();
}

// -------------------------------
// SUMMARY GENERATION
// -------------------------------
// ===============================
// Metric Mate – Final Review
// CLEAN VERSION
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
// Load Kickoff + Midterm Data
// -------------------------------
function loadKickoffData() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("data");
    if (raw) return JSON.parse(decodeURIComponent(raw));
  } catch (e) {
    console.warn("Failed URL kickoff data", e);
  }

  try {
    const stored = localStorage.getItem("metricMateKickoff");
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn("Failed local kickoff data", e);
  }

  return null;
}

function loadMidtermData() {
  try {
    const stored = localStorage.getItem("metricMateMidterm");
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn("No midterm data found", e);
  }

  return null;
}

// -------------------------------
// INIT
// -------------------------------
function initFinal() {
  const form = $("finalForm");
  const copyBtn = $("copyFinalSummaryBtn");

  hydrateFormFromKickoffMidterm();

  if (form) {
    form.addEventListener("input", handleInput);
  }

  updateSummary(); // generate initial summary

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const summary = $("finalSummary").value;
      copyToClipboard(summary);
      showStatus("✅ Final summary copied to clipboard");
    });
  }
}

// -------------------------------
// Hydrate Final Form
// -------------------------------
function hydrateFormFromKickoffMidterm() {
  const kickoff = loadKickoffData();
  const midterm = loadMidtermData();

  const info = kickoff?.info || {};

  finalState.projectName = info.projectName || "";
  finalState.client = info.client || "";
  finalState.pm = info.pm || "";
  finalState.designer = info.designer || "";
  finalState.dev = info.dev || "";

  // If midterm had a date (end-review suggestion), allow fallback
  finalState.date = midterm?.info?.date || "";

  $("projectName").value = finalState.projectName;
  $("client").value = finalState.client;
  $("pm").value = finalState.pm;
  $("designer").value = finalState.designer;
  $("dev").value = finalState.dev;
  $("date").value = finalState.date;
}

// -------------------------------
// INPUT HANDLERS
// -------------------------------
function handleInput(e) {
  const t = e.target;
  const val = t.value || "";

  if (finalState.hasOwnProperty(t.id)) {
    finalState[t.id] = val;
  }

  updateSummary();
}

// -------------------------------
// SUMMARY GENERATION
// -------------------------------
function updateSummary() {
  const summaryEl = $("finalSummary");
  if (!summaryEl) return;

  const summaryText = buildFinalSummary();
  summaryEl.value = summaryText;

  updateDashboardLink(summaryText);
  saveDashboardData(summaryText);
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
// DASHBOARD LINK + DATA
// -------------------------------
function updateDashboardLink(summaryText) {
  const kickoff = loadKickoffData();
  const linkEl = document.querySelector('a[href="dashboard.html"]');
  if (!linkEl) return;

  const project = {
    name: finalState.projectName,
    client: finalState.client,
    pm: finalState.pm,
    designer: finalState.designer,
    dev: finalState.dev,
    kickoffDate: kickoff?.info?.date || "",
    finalReviewDate: finalState.date || ""
  };

  const payload = {
    project,
    final: { ...finalState },
    finalSummary: summaryText
  };

  const encoded = encodeURIComponent(JSON.stringify(payload));
  linkEl.href = `dashboard.html?data=${encoded}`;
}

function saveDashboardData(summaryText) {
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

  localStorage.setItem("metricMateDashboard", JSON.stringify(payload));
}

// -------------------------------
// HELPERS
// -------------------------------
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.top = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
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
// DASHBOARD LINK + DATA
// -------------------------------
function updateDashboardLink(summaryText) {
  const kickoff = loadKickoffData();
  const linkEl = document.querySelector('a[href="dashboard.html"]');
  if (!linkEl) return;

  const project = {
    name: finalState.projectName,
    client: finalState.client,
    pm: finalState.pm,
    designer: finalState.designer,
    dev: finalState.dev,
    kickoffDate: kickoff?.info?.date || "",
    finalReviewDate: finalState.date || ""
  };

  const payload = {
    project,
    final: { ...finalState },
    finalSummary: summaryText
  };

  const encoded = encodeURIComponent(JSON.stringify(payload));
  linkEl.href = `dashboard.html?data=${encoded}`;
}

function saveDashboardData(summaryText) {
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

  localStorage.setItem("metricMateDashboard", JSON.stringify(payload));
}

// -------------------------------
// HELPERS
// -------------------------------
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.top = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
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
