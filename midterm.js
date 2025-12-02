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

// DOM refs (elements exist because script is loaded at bottom of body)
const form = document.getElementById("surveyForm");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const progressBar = document.getElementById("progressBar");

// Get kickoff data from URL or localStorage
function getKickoffDataFromUrl() {
  try {
    // 1) Try URL ?data=...
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('data');
    if (raw) {
      return JSON.parse(decodeURIComponent(raw));
    }

    // 2) Fallback: localStorage (saved by the kickoff survey)
    const stored = localStorage.getItem('metricMateKickoff');
    if (stored) {
      return JSON.parse(stored);
    }

    return null;
  } catch (err) {
    console.error('Failed to load kickoff data', err);
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
  setTimeout(() => {
    statusEl.style.display = "none";
  }, 2500);
}

// ============================================================================
// INIT
// ============================================================================
function init() {
  // 0) Try to hydrate from kickoff data (URL or localStorage)
  const kickoffData = getKickoffDataFromUrl();

  if (kickoffData && kickoffData.info) {
    const info = kickoffData.info;
    const dir  = kickoffData.directory || {};

    // Project name
    midterm.info.projectName =
      info.projectName || info.name || midterm.info.projectName;

    // Client
    if (typeof info.clientId === 'number' && Array.isArray(dir.clients)) {
      midterm.info.client = dir.clients[info.clientId] || '';
    } else {
      midterm.info.client =
        info.client || info.clientName || midterm.info.client;
    }

    // PM
    if (typeof info.pmId === 'number' && Array.isArray(dir.pms)) {
      midterm.info.pm = dir.pms[info.pmId] || '';
    } else {
      midterm.info.pm = info.pm || info.pmName || midterm.info.pm;
    }

    // Designer
    if (typeof info.designerId === 'number' && Array.isArray(dir.designers)) {
      midterm.info.designer = dir.designers[info.designerId] || '';
    } else {
      midterm.info.designer =
        info.designer || info.designerName || midterm.info.designer;
    }

    // Dev
    if (typeof info.devId === 'number' && Array.isArray(dir.devs)) {
      midterm.info.dev = dir.devs[info.devId] || '';
    } else {
      midterm.info.dev = info.dev || info.devName || midterm.info.dev;
    }
  }

  // 1) Wire up navigation
  if (prevBtn) prevBtn.addEventListener("click", goToPreviousStep);
  if (nextBtn) nextBtn.addEventListener("click", goToNextStep);

  // 2) Form events (use the handlers that actually exist in this file)
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      goToNextStep();
    });

    form.addEventListener("change", handleChange);
    form.addEventListener("input", handleInput);
  }

  // 3) Start on Step 1
  midterm.currentStep = 1;
  renderStep(midterm.currentStep);
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
    showThankYouPage();
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

  // Clear previous
  form.innerHTML = "";

  let stepEl = document.createElement("section");
  stepEl.className = "step active";
  stepEl.id = `step-${step}`;

  if (step === 1) {
    stepEl.innerHTML = renderStep1();
  } else if (step === 2) {
    stepEl.innerHTML = renderStep2();
  } else if (step === 3) {
    const internalSummary = buildInternalSummary();
    const clientSummary = buildClientSummary();
    stepEl.innerHTML = renderStep3(internalSummary, clientSummary);
    setupSummaryActions(internalSummary, clientSummary);
  }

  form.appendChild(stepEl);

  if (prevBtn) prevBtn.disabled = step === 1;
  if (nextBtn)
    nextBtn.textContent = step === midterm.totalSteps ? "Finish" : "Next";
}

// STEP 1 – Project info for midterm
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

// STEP 2 – Health + progress questions
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
      <textarea id="progressGood" rows="3"
        placeholder="Wins, green lights, decisions that paid off...">${midterm.progressGood}</textarea>
    </div>

    <div class="form-group">
      <label for="progressOff">What’s off track or unclear?</label>
      <textarea id="progressOff" rows="3"
        placeholder="Scope creep, blockers, misalignments, unanswered questions...">${midterm.progressOff}</textarea>
    </div>

    <div class="form-group">
      <label for="risks">Risks to call out</label>
      <textarea id="risks" rows="3"
        placeholder="Dependencies, technical unknowns, timeline risks...">${midterm.risks}</textarea>
    </div>

    <div class="form-group">
      <label for="decisions">Key decisions since kickoff</label>
      <textarea id="decisions" rows="3"
        placeholder="What did we lock in? What changed from the original plan?">${midterm.decisions}</textarea>
    </div>

    <div class="form-group">
      <label for="nextSteps">Next 2–3 concrete next steps</label>
      <textarea id="nextSteps" rows="3"
        placeholder="What should happen next to keep this project healthy?">${midterm.nextSteps}</textarea>
    </div>
  `;
}

// STEP 3 – Summaries
function renderStep3(internalSummary, clientSummary) {
  return `
    <h2>Review & Share</h2>
    <p class="help-text">
      Use these summaries in your mid-project sync, internal notes, or client email.
    </p>

    <section class="summary-section">
      <h3>1. Internal Mid-Project Summary</h3>
      <p class="help-text">Drop this into Asana, Slack, or your team doc.</p>
      <textarea id="internalSummary" rows="10" readonly>${internalSummary}</textarea>
      <div class="form-actions" style="margin-top: 0.75rem;">
        <button type="button" id="copyInternalSummary" class="btn btn-secondary">
          📋 Copy Internal Summary
        </button>
      </div>
    </section>

    <section class="summary-section">
      <h3>2. Client-Friendly Check-In</h3>
      <p class="help-text">Use this in a short email or slide to align on where things stand.</p>
      <textarea id="clientSummary" rows="10" readonly>${clientSummary}</textarea>
      <div class="form-actions" style="margin-top: 0.75rem;">
        <button type="button" id="copyClientSummary" class="btn btn-secondary">
          📋 Copy Client Summary
        </button>
      </div>
    </section>

    <section class="summary-section">
      <h3>3. Final Review Reminder</h3>
      <p class="help-text">
        Create a calendar event for your end-of-project / retrospective conversation.
      </p>
      <div class="form-actions">
        <button type="button" id="createCalendarEventBtn" class="btn btn-primary">
        <i class="fa-solid fa-calendar"></i>
          Add Final Review to Google Calendar
        </button>
      </div>
    </section>
  `;
}

// ============================================================================
// SUMMARY BUILDERS
// ============================================================================
function buildInternalSummary() {
  const i = midterm.info;

  let lines = [];
  lines.push("MID-PROJECT REVIEW — INTERNAL");
  lines.push("--------------------------------");
  lines.push(`Project: ${i.projectName || "Untitled project"}`);
  if (i.client) lines.push(`Client: ${i.client}`);
  if (i.pm) lines.push(`PM: ${i.pm}`);
  if (i.designer) lines.push(`Product Designer: ${i.designer}`);
  if (i.dev) lines.push(`Lead Developer: ${i.dev}`);
  if (i.date) lines.push(`Review Date: ${i.date}`);
  lines.push("");
  lines.push(`Overall project health (self-rated): ${midterm.healthScore}/5`);
  lines.push("");
  if (midterm.progressGood.trim()) {
    lines.push("What’s going well:");
    lines.push(midterm.progressGood.trim());
    lines.push("");
  }
  if (midterm.progressOff.trim()) {
    lines.push("What’s off track or unclear:");
    lines.push(midterm.progressOff.trim());
    lines.push("");
  }
  if (midterm.risks.trim()) {
    lines.push("Risks:");
    lines.push(midterm.risks.trim());
    lines.push("");
  }
  if (midterm.decisions.trim()) {
    lines.push("Key decisions since kickoff:");
    lines.push(midterm.decisions.trim());
    lines.push("");
  }
  if (midterm.nextSteps.trim()) {
    lines.push("Next 2–3 concrete steps:");
    lines.push(midterm.nextSteps.trim());
  }

  return lines.join("\n");
}

function buildClientSummary() {
  const i = midterm.info;
  const nameForGreeting = i.client || "there";

  let lines = [];
  lines.push(`Hi ${nameForGreeting},`);
  lines.push("");
  lines.push(
    `Here’s a quick mid-project snapshot for ${i.projectName || "the project"}:`
  );
  lines.push("");
  lines.push(`• Overall health: ${midterm.healthScore}/5`);
  if (midterm.progressGood.trim()) {
    lines.push("");
    lines.push("What’s going well:");
    lines.push(midterm.progressGood.trim());
  }
  if (midterm.progressOff.trim()) {
    lines.push("");
    lines.push("What’s off track / needs attention:");
    lines.push(midterm.progressOff.trim());
  }
  if (midterm.risks.trim()) {
    lines.push("");
    lines.push("Risks we’re watching:");
    lines.push(midterm.risks.trim());
  }
  if (midterm.nextSteps.trim()) {
    lines.push("");
    lines.push("Proposed next steps:");
    lines.push(midterm.nextSteps.trim());
  }
  lines.push("");
  lines.push(
    "If anything here feels off or if you’d like to adjust scope or priorities, we’re happy to recalibrate together."
  );
  lines.push("");
  lines.push("Best,");
  lines.push("The Thinklogic team");

  return lines.join("\n");
}

// ============================================================================
// SUMMARY ACTIONS + CALENDAR
// ============================================================================
function setupSummaryActions(internalSummary, clientSummary) {
  const internalBtn = document.getElementById("copyInternalSummary");
  const clientBtn = document.getElementById("copyClientSummary");
  const calendarBtn = document.getElementById("createCalendarEventBtn");

  if (internalBtn) {
    internalBtn.addEventListener("click", () => {
      copyToClipboard(internalSummary);
      showStatus("✅ Internal summary copied to clipboard");
    });
  }

  if (clientBtn) {
    clientBtn.addEventListener("click", () => {
      copyToClipboard(clientSummary);
      showStatus("✅ Client summary copied to clipboard");
    });
  }

  if (calendarBtn) {
    calendarBtn.addEventListener("click", () => {
      const url = buildFinalReviewCalendarUrl();
      console.log("Opening final review calendar (step 3):", url);
      // Use same-tab navigation to avoid popup blockers
      window.location.href = url;
    });
  }
}

function buildFinalReviewCalendarUrl() {
  const projectName = midterm.info.projectName || "Project";
  const clientName = midterm.info.client || "Client";

  // 21 days from today, 10–11am
  const start = new Date();
  start.setDate(start.getDate() + 21);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start.getTime());
  end.setHours(11);

  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    const secs = String(d.getSeconds()).padStart(2, "0");
    return `${year}${month}${day}T${hours}${mins}${secs}`;
  };

  const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";

  const details =
    buildInternalSummary() +
    "\n\nFinal review form:\nhttps://lisapancakes.github.io/metric-mate/final.html";

  const params = new URLSearchParams({
    text: `Final review: ${projectName} (${clientName})`,
    details,
    dates: `${formatDate(start)}/${formatDate(end)}`
  });

  return `${base}&${params.toString()}`;
}

// ============================================================================
// FORM HANDLERS
// ============================================================================
function handleChange(e) {
  const t = e.target;

  // healthScore radio
  if (t.name === "healthScore" && t.type === "radio") {
    midterm.healthScore = parseInt(t.value, 10);
    return;
  }
}

function handleInput(e) {
  const t = e.target;
  const val = t.value;

  switch (t.id) {
    case "projectName":
      midterm.info.projectName = val;
      break;
    case "client":
      midterm.info.client = val;
      break;
    case "pm":
      midterm.info.pm = val;
      break;
    case "designer":
      midterm.info.designer = val;
      break;
    case "dev":
      midterm.info.dev = val;
      break;
    case "date":
      midterm.info.date = val;
      break;

    case "progressGood":
      midterm.progressGood = val;
      break;
    case "progressOff":
      midterm.progressOff = val;
      break;
    case "risks":
      midterm.risks = val;
      break;
    case "decisions":
      midterm.decisions = val;
      break;
    case "nextSteps":
      midterm.nextSteps = val;
      break;
  }
}

// ============================================================================
// THANK YOU PAGE
// ============================================================================
function showThankYouPage() {
  if (form) form.style.display = "none";
  if (prevBtn) prevBtn.style.display = "none";
  if (nextBtn) nextBtn.style.display = "none";

  const app = document.getElementById("app");
  if (!app) return;

  const thankYou = document.createElement("section");
  thankYou.className = "step thank-you active";
  thankYou.innerHTML = `
    <h2>Mid-project review captured 🎉</h2>
    <p>
      You’ve just documented how this project is really doing — what’s going well,
      what’s at risk, and what needs to happen next. This makes it much easier
      to course-correct before the final delivery.
    </p>
    <p style="margin-top: 1rem;">
      If you haven’t already, you can also set a 
      <strong>final review calendar event</strong> so this reflection doesn’t get lost:
    </p>
    <div class="form-actions" style="margin-top: 1.5rem;">
      <button type="button" id="createCalendarEventBtnThankYou" class="btn btn-primary">
        <i class="fa-solid fa-calendar"></i>
        Save Final Review to Google Calendar
      </button>
    </div>
  `;

  const nav = document.querySelector(".navigation");
  if (nav && nav.parentNode === app) {
    app.insertBefore(thankYou, nav);
  } else {
    app.appendChild(thankYou);
  }

  const btn = document.getElementById("createCalendarEventBtnThankYou");
  if (btn) {
    btn.addEventListener("click", () => {
      const url = buildFinalReviewCalendarUrl();
      console.log("Opening final review calendar (thank you):", url);
      // Same-tab navigation here as well
      window.location.href = url;
    });
  }
}

// ============================================================================
// BOOTSTRAP
// ============================================================================
document.addEventListener('DOMContentLoaded', init);
