// ============================================================================
// STATE
// ============================================================================
const midterm = {
  currentStep: 1,
  totalSteps: 3,
  info: {
    projectName: "",
    client: "",
    pm: "",
    designer: "",
    dev: "",
    date: ""
  },
  healthScore: 3,
  progressGood: "",
  progressOff: "",
  risks: "",
  decisions: "",
  nextSteps: ""
};

// DOM refs
const form = document.getElementById("surveyForm");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const progressBar = document.getElementById("progressBar");

// ============================================================================
// LOAD KICKOFF DATA
// ============================================================================
function getKickoffDataFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("data");
    if (raw) return JSON.parse(decodeURIComponent(raw));

    const stored = localStorage.getItem("metricMateKickoff");
    if (stored) return JSON.parse(stored);

    return null;
  } catch (err) {
    console.error("Failed to load kickoff data", err);
    return null;
  }
}

// ============================================================================
// HELPERS
// ============================================================================
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    console.error("Copy failed", err);
  }
  document.body.removeChild(textarea);
}

function showStatus(message) {
  let statusEl = document.getElementById("copyStatus");
  if (!statusEl) {
    statusEl = document.createElement("div");
    statusEl.id = "copyStatus";
    statusEl.className = "status-message";
    statusEl.style.display = "none";
    document.body.appendChild(statusEl);
  }

  statusEl.textContent = message;
  statusEl.style.display = "block";
  setTimeout(() => (statusEl.style.display = "none"), 2500);
}

// ============================================================================
// INIT
// ============================================================================
function init() {
  const kickoffData = getKickoffDataFromUrl();

  if (kickoffData && kickoffData.info) {
    const info = kickoffData.info;
    const dir = kickoffData.directory || {};

    midterm.info.projectName =
      info.projectName || info.name || midterm.info.projectName;

    midterm.info.client =
      (typeof info.clientId === "number" && dir.clients?.[info.clientId]) ||
      info.client ||
      info.clientName ||
      midterm.info.client;

    midterm.info.pm =
      (typeof info.pmId === "number" && dir.pms?.[info.pmId]) ||
      info.pm ||
      info.pmName ||
      midterm.info.pm;

    midterm.info.designer =
      (typeof info.designerId === "number" &&
        dir.designers?.[info.designerId]) ||
      info.designer ||
      info.designerName ||
      midterm.info.designer;

    midterm.info.dev =
      (typeof info.devId === "number" && dir.devs?.[info.devId]) ||
      info.dev ||
      info.devName ||
      midterm.info.dev;
  }

  if (prevBtn) prevBtn.addEventListener("click", goToPreviousStep);
  if (nextBtn) nextBtn.addEventListener("click", goToNextStep);

  if (form) {
    form.addEventListener("submit", (e) => e.preventDefault());
    form.addEventListener("change", handleChange);
    form.addEventListener("input", handleInput);
  }

  midterm.currentStep = 1;
  renderStep(1);
  updateProgressBar();
}

// ============================================================================
// NAVIGATION
// ============================================================================
function goToNextStep() {
  if (!validateCurrentStep()) return;

  if (midterm.currentStep < midterm.totalSteps) {
    midterm.currentStep++;
    renderStep(midterm.currentStep);
    updateProgressBar();
    window.scrollTo(0, 0);
  } else {
    if (nextBtn) nextBtn.style.display = "none";
  }
}

function goToPreviousStep() {
  if (midterm.currentStep > 1) {
    midterm.currentStep--;
    renderStep(midterm.currentStep);
    updateProgressBar();
    window.scrollTo(0, 0);
  }
}

function updateProgressBar() {
  if (!progressBar) return;
  const progress =
    ((midterm.currentStep - 1) / (midterm.totalSteps - 1)) * 100;
  progressBar.style.width = `${progress}%`;
}

// ============================================================================
// VALIDATION
// ============================================================================
function validateCurrentStep() {
  if (midterm.currentStep === 1) {
    if (!midterm.info.projectName.trim()) {
      alert("Please enter a project name");
      return false;
    }
  }
  return true;
}

// ============================================================================
// RENDER STEPS
// ============================================================================
function renderStep(step) {
  if (!form) return;

  // Clear previous content
  form.innerHTML = "";

  let stepEl = document.createElement("section");
  stepEl.className = "step active";
  stepEl.id = `step-${step}`;

  let internalSummary = "";
  let clientSummary = "";

  if (step === 1) {
    stepEl.innerHTML = renderStep1();
  } 
  else if (step === 2) {
    stepEl.innerHTML = renderStep2();
  } 
  else if (step === 3) {
    internalSummary = buildInternalSummary();
    clientSummary = buildClientSummary();
    stepEl.innerHTML = renderStep3(internalSummary, clientSummary);
  }

  // Add the HTML to the form
  form.appendChild(stepEl);

  // Step 3 needs summary actions
  if (step === 3) {
    setupSummaryActions(internalSummary, clientSummary);
  }

  // Navigation buttons
  if (prevBtn) prevBtn.disabled = step === 1;

  if (nextBtn) {
    if (step === midterm.totalSteps) {
      nextBtn.style.display = "none";   // hide Next button
    } else {
      nextBtn.style.display = "inline-block";
      nextBtn.textContent = "Next";
    }
  }
}
// ============================================================================
// STEP MARKUP
// ============================================================================
function renderStep1() {
  return `
    <h2>Project Information</h2>

    <div class="form-group">
      <label for="projectName">Project Name</label>
      <input type="text" id="projectName" value="${midterm.info.projectName}" />
    </div>

    <div class="form-group">
      <label for="client">Client</label>
      <input type="text" id="client" value="${midterm.info.client}" />
    </div>

    <div class="form-group">
      <label for="pm">Project Manager</label>
      <input type="text" id="pm" value="${midterm.info.pm}" />
    </div>

    <div class="form-group">
      <label for="designer">Product Designer</label>
      <input type="text" id="designer" value="${midterm.info.designer}" />
    </div>

    <div class="form-group">
      <label for="dev">Lead Developer</label>
      <input type="text" id="dev" value="${midterm.info.dev}" />
    </div>

    <div class="form-group">
      <label for="date">Review Date</label>
      <input type="text" id="date" placeholder="e.g. Dec 10, 2025" value="${midterm.info.date}" />
    </div>
  `;
}

function renderStep2() {
  return `
    <h2>Mid-Project Check-In</h2>

    <div class="form-group">
      <label>Overall project health today</label>
      <div class="rating">
        <div class="rating-label">At risk</div>
        <div class="rating-scale">
          ${[1, 2, 3, 4, 5]
            .map(
              (num) => `
            <label class="rating-option">
              <input 
                type="radio" 
                name="healthScore" 
                value="${num}" 
                ${midterm.healthScore === num ? "checked" : ""}>
              <span>${num}</span>
            </label>
          `
            )
            .join("")}
        </div>
        <div class="rating-label">On track</div>
      </div>
    </div>

    <div class="form-group">
      <label for="progressGood">What’s going well?</label>
      <textarea id="progressGood" rows="3">${midterm.progressGood}</textarea>
    </div>

    <div class="form-group">
      <label for="progressOff">What’s off track or unclear?</label>
      <textarea id="progressOff" rows="3">${midterm.progressOff}</textarea>
    </div>

    <div class="form-group">
      <label for="risks">Risks to call out</label>
      <textarea id="risks" rows="3">${midterm.risks}</textarea>
    </div>

    <div class="form-group">
      <label for="decisions">Key decisions since kickoff</label>
      <textarea id="decisions" rows="3">${midterm.decisions}</textarea>
    </div>

    <div class="form-group">
      <label for="nextSteps">Next 2–3 concrete next steps</label>
      <textarea id="nextSteps" rows="3">${midterm.nextSteps}</textarea>
    </div>
  `;
}

function renderStep3(internalSummary, clientSummary) {
  return `
    <h2>Review & Share</h2>
    <p class="help-text">Use these summaries in your mid-project sync, internal notes, or client email.</p>

    <section class="summary-section">
      <h3>1. Internal Mid-Project Summary</h3>
      <textarea id="internalSummary" rows="10" readonly>${internalSummary}</textarea>
      <button type="button" id="copyInternalSummary" class="btn btn-secondary">Copy Internal Summary</button>
    </section>

    <section class="summary-section">
      <h3>2. Client-Friendly Check-In</h3>
      <textarea id="clientSummary" rows="10" readonly>${clientSummary}</textarea>
      <button type="button" id="copyClientSummary" class="btn btn-secondary">Copy Client Summary</button>
    </section>

    <section class="summary-section">
      <h3>3. Final Review Reminder</h3>
      <a id="finalReviewCalendarLink" class="btn btn-primary" href="#" target="_blank" rel="noopener">
        Add Final Review to Google Calendar
      </a>
    </section>

    <section class="summary-section">
      <h3>4. Project Dashboard</h3>
      <button type="button" class="btn btn-primary" onclick="openDashboardFromMidterm()">View Project Dashboard</button>
    </section>
  `;
}

// ============================================================================
// SUMMARY ACTIONS
// ============================================================================
function setupSummaryActions(internalSummary, clientSummary) {
  const internalBtn = document.getElementById("copyInternalSummary");
  const clientBtn = document.getElementById("copyClientSummary");
  const calendarLink = document.getElementById("finalReviewCalendarLink");

  if (internalBtn) {
    internalBtn.addEventListener("click", () => {
      copyToClipboard(internalSummary);
      showStatus("✅ Internal summary copied");
    });
  }

  if (clientBtn) {
    clientBtn.addEventListener("click", () => {
      copyToClipboard(clientSummary);
      showStatus("✅ Client summary copied");
    });
  }

  if (calendarLink) {
    calendarLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.open(buildFinalReviewCalendarUrl(), "_blank");
    });
  }
}

// ============================================================================
// CALENDAR URL
// ============================================================================
function buildFinalReviewCalendarUrl() {
  const projectName = midterm.info.projectName || "Project";
  const clientName = midterm.info.client || "Client";

  const start = new Date();
  start.setDate(start.getDate() + 21);
  start.setHours(10, 0, 0, 0);

  const end = new Date(start.getTime());
  end.setHours(11);

  const formatDate = (d) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";

  const params = new URLSearchParams({
    text: `Final review: ${projectName} (${clientName})`,
    details:
      buildInternalSummary() +
      "\n\nFinal review form:\nhttps://lisapancakes.github.io/metric-mate/final.html",
    dates: `${formatDate(start)}/${formatDate(end)}`
  });

  return `${base}&${params.toString()}`;
}

// ============================================================================
// FORM HANDLERS
// ============================================================================
function handleChange(e) {
  if (e.target.name === "healthScore") {
    midterm.healthScore = Number(e.target.value);
  }
}

function handleInput(e) {
  const id = e.target.id;
  midterm.info[id] ??= undefined;

  switch (id) {
    case "projectName":
    case "client":
    case "pm":
    case "designer":
    case "dev":
    case "date":
      midterm.info[id] = e.target.value;
      break;

    case "progressGood":
    case "progressOff":
    case "risks":
    case "decisions":
    case "nextSteps":
      midterm[id] = e.target.value;
      break;
  }
}

// ============================================================================
// DASHBOARD STORAGE
// ============================================================================
function saveMidtermForDashboard() {
  try {
    const exportObj = {
      info: { ...midterm.info },
      healthScore: midterm.healthScore,
      progressGood: midterm.progressGood,
      progressOff: midterm.progressOff,
      risks: midterm.risks,
      decisions: midterm.decisions,
      nextSteps: midterm.nextSteps
    };
    localStorage.setItem("metricMateMidterm", JSON.stringify(exportObj));
  } catch (e) {
    console.warn("Failed to save midterm data for dashboard", e);
  }
}

// ============================================================================
// BOOTSTRAP
// ============================================================================
document.addEventListener("DOMContentLoaded", init);
