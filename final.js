// ===============================
// Metric Mate – Final Project Review
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
// Load Kickoff Data
// -------------------------------
function loadKickoffData() {
  try {
    // 1) URL ?data=...
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("data");
    if (raw) {
      return JSON.parse(decodeURIComponent(raw));
    }
  } catch (e) {
    console.warn("Failed to parse kickoff data from URL", e);
  }

  try {
    // 2) localStorage (saved by kickoff)
    const stored = localStorage.getItem("metricMateKickoff");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Failed to load kickoff data from localStorage", e);
  }

  return null;
}

// -------------------------------
// INIT
// -------------------------------
function initFinal() {
  const form = $("finalForm");
  const copyBtn = $("copyFinalSummaryBtn");

  hydrateFromKickoff();

  if (form) {
    form.addEventListener("input", handleInput);
  }

  // Initial summary + dashboard payload
  updateSummary();

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const summary = $("finalSummary").value || "";
      copyToClipboard(summary);
      showStatus("✅ Final summary copied to clipboard");
    });
  }
}

// -------------------------------
// HYDRATE FROM KICKOFF
// -------------------------------
function hydrateFromKickoff() {
  const kickoff = loadKickoffData();
  if (!kickoff || !kickoff.info) return;

  const info = kickoff.info;

  // Keep all the fallbacks we used in midterm
  finalState.projectName =
    info.projectName || info.name || finalState.projectName;
  finalState.client =
    info.client || info.clientName || finalState.client;
  finalState.pm = info.pm || info.pmName || finalState.pm;
  finalState.designer =
    info.designer || info.designerName || finalState.designer;
  finalState.dev = info.dev || info.devName || finalState.dev;

  // Push into DOM if the fields exist
  const map = ["projectName", "client", "pm", "designer", "dev"];
  map.forEach((id) => {
    const el = $(id);
    if (el) el.value = finalState[id] || "";
  });
}

// -------------------------------
// INPUT HANDLER
// -------------------------------
function handleInput(e) {
  const t = e.target;
  const id = t.id;
  const val = t.value || "";

  if (Object.prototype.hasOwnProperty.call(finalState, id)) {
    finalState[id] = val;
  }

  updateSummary();
}

// -------------------------------
// SUMMARY GENERATION
// -------------------------------
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

function updateSummary() {
  const summaryEl = $("finalSummary");
  if (!summaryEl) return;

  const summaryText = buildFinalSummary();
  summaryEl.value = summaryText;

  updateDashboardPayload(summaryText);
}

// -------------------------------
// DASHBOARD PAYLOAD + LINK
// -------------------------------
function updateDashboardPayload(summaryText) {
  const kickoff = loadKickoffData();
  const info = kickoff && kickoff.info ? kickoff.info : {};

  const project = {
    name: finalState.projectName || info.projectName || info.name || "",
    client: finalState.client || info.client || info.clientName || "",
    pm: finalState.pm || info.pm || info.pmName || "",
    designer:
      finalState.designer || info.designer || info.designerName || "",
    dev: finalState.dev || info.dev || info.devName || "",
    kickoffDate: info.date || "",
    finalReviewDate: finalState.date || ""
  };

  const payload = {
    project,
    final: { ...finalState },
    finalSummary: summaryText || ""
  };

  // 1) Save for fallback
  try {
    localStorage.setItem("metricMateDashboard", JSON.stringify(payload));
  } catch (e) {
    console.warn("Failed to save dashboard payload", e);
  }

  // 2) Update the View Dashboard link
  const linkEl = $("openDashboardBtn");
  if (!linkEl) return;

  const encoded = encodeURIComponent(JSON.stringify(payload));
  linkEl.href = `dashboard.html?data=${encoded}`;
}

// -------------------------------
// SHARED HELPERS
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

function showStatus(message) {
  let statusEl = document.getElementById("copyStatus");
  if (!statusEl) {
    statusEl = document.createElement("div");
    statusEl.id = "copyStatus";
    statusEl.className = "status-message";
    document.body.appendChild(statusEl);
  }

  statusEl.textContent = message;
  statusEl.style.display = "block";
  setTimeout(() => {
    statusEl.style.display = "none";
  }, 2200);
}

// -------------------------------
document.addEventListener("DOMContentLoaded", initFinal);
