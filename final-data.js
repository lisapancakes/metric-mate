// ===============================
// Metric Mate – Final Project Review (Data & Helpers)
// ===============================

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

// Load Kickoff Data
function loadKickoffData() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("data");
    if (raw) {
      return JSON.parse(decodeURIComponent(raw));
    }
  } catch (e) {
    console.warn("Failed to parse kickoff data from URL", e);
  }

  try {
    const stored = localStorage.getItem("metricMateKickoff");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Failed to load kickoff data from localStorage", e);
  }

  return null;
}

// Load Midterm Data (optional)
function loadMidtermData() {
  try {
    const stored = localStorage.getItem("metricMateMidterm");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Failed to load midterm data from localStorage", e);
  }
  return null;
}

// Shared helpers
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
