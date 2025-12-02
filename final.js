// ============================================================================
// FINAL REVIEW – STATE
// ============================================================================
const finalReview = {
  currentStep: 1,
  totalSteps: 3,

  info: {
    projectName: "",
    client: "",
    pm: "",
    designer: "",
    dev: "",
    launchDate: ""
  },

  outcomes: "",
  wins: "",
  lessons: "",
  nextSteps: ""
};

const form = document.getElementById("surveyForm");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const progressBar = document.getElementById("progressBar");

// ===============================================================
// Pull kickoff + midterm data from URL if present
// ===============================================================
function getPrefillData() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("data")) return null;
    return JSON.parse(decodeURIComponent(params.get("data")));
  } catch (e) {
    console.warn("Could not parse prefill data", e);
    return null;
  }
}

// ============================================================================
// INIT
// ============================================================================
function init() {
  const prefill = getPrefillData();

  if (prefill?.info) {
    finalReview.info = {
      ...finalReview.info,
      ...prefill.info
    };
  }

  if (prevBtn) prevBtn.addEventListener("click", goPrev);
  if (nextBtn) nextBtn.addEventListener("click", goNext);

  if (form) {
    form.addEventListener("input", handleInput);
  }

  renderStep(1);
  updateProgress();
}

// ============================================================================
// NAVIGATION
// ============================================================================
function goNext() {
  if (!validate(finalReview.currentStep)) return;
  if (finalReview.currentStep < finalReview.totalSteps) {
    finalReview.currentStep++;
    renderStep(finalReview.currentStep);
    updateProgress();
    window.scrollTo(0, 0);
  } else {
    showThankYou();
  }
}

function goPrev() {
  if (finalReview.currentStep > 1) {
    finalReview.currentStep--;
    renderStep(finalReview.currentStep);
    updateProgress();
    window.scrollTo(0, 0);
  }
}

function updateProgress() {
  if (!progressBar) return;
  const pct =
    ((finalReview.currentStep - 1) / (finalReview.totalSteps - 1)) * 100;
  progressBar.style.width = `${pct}%`;
}

// ============================================================================
// VALIDATION
// ============================================================================
function validate(step) {
  if (step === 1 && !finalReview.info.projectName.trim()) {
    alert("Please enter a project name.");
    return false;
  }
  return true;
}

// ============================================================================
// RENDER STEPS
// ============================================================================
function renderStep(step) {
  form.innerHTML = "";
  const el = document.createElement("section");
  el.className = "step active";
  el.id = `step-${step}`;

  if (step === 1) el.innerHTML = renderInfoStep();
  if (step === 2) el.innerHTML = renderReflectionStep();
  if (step === 3) el.innerHTML = renderSummaryStep(buildSummary());

  form.appendChild(el);

  prevBtn.disabled = step === 1;
  nextBtn.textContent = step === finalReview.totalSteps ? "Finish" : "Next";
}

// STEP 1 — Project Info
function renderInfoStep() {
  const i = finalReview.info;
  return `
    <h2>Project Information</h2>

    <div class="form-group">
      <label>Project Name</label>
      <input id="projectName" type="text" value="${i.projectName}" />
    </div>

    <div class="form-group">
      <label>Client</label>
      <input id="client" type="text" value="${i.client}" />
    </div>

    <div class="form-group">
      <label>Project Manager</label>
      <input id="pm" type="text" value="${i.pm}" />
    </div>

    <div class="form-group">
      <label>Product Designer</label>
      <input id="designer" type="text" value="${i.designer}" />
    </div>

    <div class="form-group">
      <label>Lead Developer</label>
      <input id="dev" type="text" value="${i.dev}" />
    </div>

    <div class="form-group">
      <label>Launch Date</label>
      <input id="launchDate" type="text" placeholder="e.g. Jan 22, 2026" value="${i.launchDate}" />
    </div>
  `;
}

// STEP 2 — Reflection questions
function renderReflectionStep() {
  return `
    <h2>Reflection</h2>

    <div class="form-group">
      <label>What outcomes did we achieve?</label>
      <textarea id="outcomes" rows="3"
      placeholder="Business impact, experience improvements, process wins...">${finalReview.outcomes}</textarea>
    </div>

    <div class="form-group">
      <label>What went especially well?</label>
      <textarea id="wins" rows="3"
      placeholder="Team collaboration, decision-making, technical execution...">${finalReview.wins}</textarea>
    </div>

    <div class="form-group">
      <label>What did we learn?</label>
      <textarea id="lessons" rows="3"
      placeholder="Things you'd repeat or avoid next time...">${finalReview.lessons}</textarea>
    </div>

    <div class="form-group">
      <label>Next steps or follow-ups</label>
      <textarea id="nextSteps" rows="3"
      placeholder="Anything still needed after launch...">${finalReview.nextSteps}</textarea>
    </div>
  `;
}

// STEP 3 — Summary
function renderSummaryStep(summary) {
  return `
    <h2>Final Review Summary</h2>
    <p class="help-text">Copy this into your retrospective doc, client handoff, or Asana.</p>

    <textarea id="summaryBox" rows="12" readonly>${summary}</textarea>

    <div class="form-actions" style="margin-top: 1rem;">
      <button class="btn btn-secondary" id="copySummary">📋 Copy Summary</button>
    </div>
  `;
}

// ============================================================================
// SUMMARY BUILDER
// ============================================================================
function buildSummary() {
  const i = finalReview.info;
  const lines = [];

  lines.push("FINAL REVIEW SUMMARY");
  lines.push("----------------------------");
  lines.push(`Project: ${i.projectName || "Untitled project"}`);
  if (i.client) lines.push(`Client: ${i.client}`);
  if (i.pm) lines.push(`PM: ${i.pm}`);
  if (i.designer) lines.push(`Product Designer: ${i.designer}`);
  if (i.dev) lines.push(`Lead Developer: ${i.dev}`);
  if (i.launchDate) lines.push(`Launch Date: ${i.launchDate}`);
  lines.push("");

  if (finalReview.outcomes.trim()) {
    lines.push("Outcomes achieved:");
    lines.push(finalReview.outcomes.trim());
    lines.push("");
  }

  if (finalReview.wins.trim()) {
    lines.push("What went well:");
    lines.push(finalReview.wins.trim());
    lines.push("");
  }

  if (finalReview.lessons.trim()) {
    lines.push("Lessons learned:");
    lines.push(finalReview.lessons.trim());
    lines.push("");
  }

  if (finalReview.nextSteps.trim()) {
    lines.push("Next steps:");
    lines.push(finalReview.nextSteps.trim());
  }

  return lines.join("\n");
}

// ============================================================================
// INPUT HANDLERS
// ============================================================================
function handleInput(e) {
  const id = e.target.id;
  const val = e.target.value;

  if (finalReview.info.hasOwnProperty(id)) {
    finalReview.info[id] = val;
    return;
  }

  if (id in finalReview) {
    finalReview[id] = val;
  }
}

// ============================================================================
// THANK YOU PAGE
// ============================================================================
function showThankYou() {
  if (form) form.style.display = "none";
  if (prevBtn) prevBtn.style.display = "none";
  if (nextBtn) nextBtn.style.display = "none";

  const app = document.getElementById("app");
  const thank = document.createElement("section");
  thank.className = "step thank-you active";

  thank.innerHTML = `
    <h2>Final review complete 🎉</h2>
    <p>
      Thanks for closing the loop. Capturing outcomes and lessons like this
      helps future projects run smoother and helps Thinklogic improve our process.
    </p>
    <p style="margin-top:1rem;">
      You're all set!
    </p>
  `;

  const nav = document.querySelector(".navigation");
  if (nav && nav.parentNode === app) app.insertBefore(thank, nav);
  else app.appendChild(thank);
}

// ============================================================================
// BOOTSTRAP
// ============================================================================
document.addEventListener("DOMContentLoaded", init);