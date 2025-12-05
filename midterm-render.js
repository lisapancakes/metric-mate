// =====================================
// Metric Mate – Midterm Rendering & Logic (v2)
// Responsibilities:
//  - Hydrate state from kickoff + saved midterm
//  - Render modular sections (v2 UX)
//  - Collect goalStatuses with type for dashboard consumption
// =====================================

const STATUS_OPTIONS = [
  { value: "not-started", label: "Not started" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" }
];

function addSection(title, body, subtitle = "") {
  return `
    <section class="summary-section">
      <div class="section-head">
        <h3>${title}</h3>
        ${subtitle ? `<p class="help-text">${subtitle}</p>` : ""}
      </div>
      ${body}
    </section>
  `;
}

function initMidterm() {
  // Hydrate from saved midterm first
  const savedMidterm = loadSavedMidterm();
  if (savedMidterm) {
    Object.assign(midterm.info, savedMidterm.info || {});
    midterm.healthScore = savedMidterm.healthScore ?? midterm.healthScore;
    midterm.progressScore = savedMidterm.progressScore ?? midterm.progressScore;
    midterm.progressGood = savedMidterm.progressGood || "";
    midterm.progressOff = savedMidterm.progressOff || "";
    midterm.goalStatuses = savedMidterm.goalStatuses || [];
    midterm.risks = (savedMidterm.risks || []).map(r => ({
      id: r.id || generateId(),
      label: r.label || "",
      selected: r.selected ?? false,
      notes: r.notes || ""
    }));
    midterm.wins = savedMidterm.wins || "";
    midterm.learnings = savedMidterm.learnings || "";
    midterm.nextSteps = savedMidterm.nextSteps || "";
  }

  // Hydrate from kickoff data (URL or localStorage)
  const kickoffData = getKickoffDataFromUrl();

  if (kickoffData && kickoffData.info) {
    const info = kickoffData.info;
    const dir = kickoffData.directory || {};

    // Project name
    midterm.info.projectName =
      info.projectName || info.name || midterm.info.projectName;

    // Client
    if (typeof info.clientId === "number" && Array.isArray(dir.clients)) {
      midterm.info.client = dir.clients[info.clientId] || "";
    } else {
      midterm.info.client =
        info.client || info.clientName || midterm.info.client;
    }

    // PM
    if (typeof info.pmId === "number" && Array.isArray(dir.pms)) {
      midterm.info.pm = dir.pms[info.pmId] || "";
    } else {
      midterm.info.pm = info.pm || info.pmName || midterm.info.pm;
    }

    // Designer
    if (typeof info.designerId === "number" && Array.isArray(dir.designers)) {
      midterm.info.designer = dir.designers[info.designerId] || "";
    } else {
      midterm.info.designer =
        info.designer || info.designerName || midterm.info.designer;
    }

    // Dev
    if (typeof info.devId === "number" && Array.isArray(dir.devs)) {
      midterm.info.dev = dir.devs[info.devId] || "";
    } else {
      midterm.info.dev = info.dev || info.devName || midterm.info.dev;
    }

    // Other contributors (optional)
    if (info.otherContributors) {
      midterm.info.otherContributors = info.otherContributors;
    }

    // Merge kickoff goals into a unified goalStatuses table
    midterm.goalStatuses = normalizeGoalStatusesFromKickoff(
      kickoffData,
      midterm.goalStatuses
    );
  }

  // Wire up navigation
  if (prevBtn) prevBtn.addEventListener("click", goToPreviousStep);
  if (nextBtn) nextBtn.addEventListener("click", goToNextStep);

  // Form events
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      goToNextStep();
    });

    form.addEventListener("change", handleChange);
    form.addEventListener("input", handleInput);
    form.addEventListener("click", handleClick);
  }

  // Start on Step 1
  midterm.currentStep = 1;
  renderStep(midterm.currentStep);
  updateProgressBar();
  saveMidtermForDashboard();
}

// NAVIGATION
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

// VALIDATION
function validateCurrentStep() {
  if (midterm.currentStep === 1) {
    if (!midterm.info.projectName.trim()) {
      alert("Please enter a project name");
      return false;
    }
    if (midterm.healthScore == null) {
      alert("Please rate overall project health");
      return false;
    }
    if (midterm.progressScore == null) {
      alert("Please rate overall project progress");
      return false;
    }
  }
  return true;
}

// RENDER STEPS
function renderStep(step) {
  if (!form) return;

  form.innerHTML = "";

  const stepEl = document.createElement("section");
  stepEl.className = "step active";
  stepEl.id = `step-${step}`;

  let internalSummary = "";
  let clientSummary = "";

  if (step === 1) {
    stepEl.innerHTML = renderStep1();
  } else if (step === 2) {
    stepEl.innerHTML = renderStep2();
  } else if (step === 3) {
    internalSummary = buildInternalSummary();
    clientSummary = buildClientSummary();
    stepEl.innerHTML = renderStep3(internalSummary, clientSummary);
  }

  form.appendChild(stepEl);

  if (step === 3) {
    setupSummaryActions(internalSummary, clientSummary);
  }

  if (step === 1) {
    updateMidtermMetaSummary();
  }

  if (prevBtn) prevBtn.disabled = step === 1;

  if (nextBtn) {
    if (step === midterm.totalSteps) {
      nextBtn.style.display = "none";
    } else {
      nextBtn.style.display = "inline-block";
      nextBtn.textContent = "Next";
    }
  }
}

// STEP 1 – Project meta + health
function renderStep1() {
  const metaContentStyle = midterm.metaExpanded ? "" : 'style="display:none"';
  const metaToggleLabel = "Edit Project Info";

  const metaSection = addSection(
    "Project Meta",
    `
      <div class="meta-summary">
        <div class="meta-item-row"><span class="meta-label">Project</span><span id="midtermMetaProject"></span></div>
        <div class="meta-item-row"><span class="meta-label">Client</span><span id="midtermMetaClient"></span></div>
        <div class="meta-item-row"><span class="meta-label">PM</span><span id="midtermMetaPm"></span></div>
        <div class="meta-item-row"><span class="meta-label">Designer</span><span id="midtermMetaDesigner"></span></div>
        <div class="meta-item-row"><span class="meta-label">Dev</span><span id="midtermMetaDev"></span></div>
      </div>
      <button type="button" class="link-button link-button-strong meta-edit-spacer" id="toggleMidtermMeta">${metaToggleLabel}</button>
      <div class="form-grid" ${metaContentStyle}>
        <div class="form-group">
          <label for="projectName">Project Name</label>
          <input type="text" id="projectName" value="${midterm.info.projectName || ""}" />
        </div>
        <div class="form-group">
          <label for="client">Client</label>
          <input type="text" id="client" value="${midterm.info.client || ""}" />
        </div>
        <div class="form-group">
          <label for="pm">Project Manager</label>
          <input type="text" id="pm" value="${midterm.info.pm || ""}" />
        </div>
        <div class="form-group">
          <label for="designer">Product Designer</label>
          <input type="text" id="designer" value="${midterm.info.designer || ""}" />
        </div>
        <div class="form-group">
          <label for="dev">Lead Developer</label>
          <input type="text" id="dev" value="${midterm.info.dev || ""}" />
        </div>
        <div class="form-group">
          <label for="otherContributors">Other Contributors</label>
          <input type="text" id="otherContributors" value="${midterm.info.otherContributors || ""}" />
        </div>
        <div class="form-group">
          <label for="date">Review Date</label>
          <input type="text" id="date" placeholder="e.g. Dec 10, 2025" value="${midterm.info.date || ""}" />
        </div>
      </div>
    `,
    "Auto-injected from Kickoff; expand to adjust."
  );

  const healthSection = addSection(
    "Project Health Check",
    `
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
        <label>Overall progress vs. plan</label>
        <div class="rating">
          <div class="rating-label">Behind</div>
          <div class="rating-scale">
            ${[1, 2, 3, 4, 5]
              .map(
                (num) => `
                  <label class="rating-option">
                    <input 
                      type="radio" 
                      name="progressScore" 
                      value="${num}" 
                      ${midterm.progressScore === num ? "checked" : ""}>
                    <span>${num}</span>
                  </label>
                `
              )
              .join("")}
          </div>
          <div class="rating-label">Ahead</div>
        </div>
      </div>
    `,
    "Two required scores to track health and velocity."
  );

  return metaSection + healthSection;
}

// STEP 2 – Status table + narrative fields
function renderStep2() {
  const statusTable =
    midterm.goalStatuses.length > 0
      ? `
        <div class="table-wrapper">
          <table class="dash-table">
            <thead>
              <tr>
                <th>Goal Label</th>
                <th>Type</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${midterm.goalStatuses
                .map(
                  (item) => `
                    <tr>
                      <td>${item.label}</td>
                      <td>${item.type}</td>
                      <td>
                        <select data-type="goal-status" data-id="${item.id}">
                          ${STATUS_OPTIONS.map(
                            (opt) => `<option value="${opt.value}" ${
                              item.status === opt.value ? "selected" : ""
                            }>${opt.label}</option>`
                          ).join("")}
                        </select>
                      </td>
                      <td>
                        <textarea
                          rows="2"
                          data-type="goal-notes"
                          data-id="${item.id}"
                          placeholder="Notes on progress, blockers, scope changes..."
                        >${item.notes || ""}</textarea>
                      </td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `
      : `<p class="help-text">No kickoff goals were selected, so there are no midterm statuses to capture.</p>`;

  const risksSection = renderRisksSection();
  const winsSection = renderTextAreaSection(
    "Biggest Wins",
    "wins",
    midterm.wins,
    "Celebrate notable outcomes since kickoff."
  );
  const learningsSection = renderTextAreaSection(
    "Key Learnings",
    "learnings",
    midterm.learnings,
    "Observations, hypotheses proven or disproven."
  );
  const nextStepsSection = renderTextAreaSection(
    "Updated Next Steps",
    "nextSteps",
    midterm.nextSteps,
    "What should happen next to keep the project healthy?"
  );

  return (
    addSection(
      "Status Update Table",
      statusTable,
      "Auto-generated from kickoff selections. Track progress by goal."
    ) +
    risksSection +
    winsSection +
    learningsSection +
    nextStepsSection
  );
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
          <i class="fa-solid fa-copy"></i>
          Copy Internal Summary
        </button>
      </div>
    </section>

    <section class="summary-section">
      <h3>2. Client-Friendly Check-In</h3>
      <p class="help-text">Use this in a short email or slide to align on where things stand.</p>
      <textarea id="clientSummary" rows="10" readonly>${clientSummary}</textarea>
      <div class="form-actions" style="margin-top: 0.75rem;">
        <button type="button" id="copyClientSummary" class="btn btn-secondary">
          <i class="fa-solid fa-copy"></i>
          Copy Client Summary
        </button>
      </div>
    </section>

    <section class="summary-section">
      <h3>3. Final Review Reminder</h3>
      <p class="help-text">
        Create a calendar event for your end-of-project / retrospective conversation.
      </p>
      <a
        id="finalReviewCalendarLink"
        href="https://calendar.google.com/calendar/render?action=TEMPLATE"
        target="_blank"
        rel="noopener"
        class="btn btn-primary"
      >
        <i class="fa-solid fa-calendar"></i>
        Add Final Review to Google Calendar
      </a>
    </section>

    <section class="summary-section">
      <h3>4. Project Dashboard</h3>
      <p class="help-text">
        See the project’s kickoff and mid-project data side by side.
      </p>
      <div class="form-actions">
        <button
          type="button"
          class="btn btn-primary"
          onclick="openDashboardFromMidterm()"
        >
          <i class="fa-solid fa-chart-line"></i>
          View Project Dashboard
        </button>
      </div>
    </section>
  `;
}

// HELPERS FOR SECTIONS
function renderRisksSection() {
  const rows = (midterm.risks || []).map(
    (risk) => `
      <div class="risk-row" data-id="${risk.id}">
        <label class="checkbox-container">
          <input type="checkbox" data-type="risk-selected" data-id="${risk.id}" ${
            risk.selected ? "checked" : ""
          }>
          <span>Select</span>
        </label>
        <input
          type="text"
          class="risk-label-input"
          data-type="risk-label"
          data-id="${risk.id}"
          placeholder="Risk label"
          value="${risk.label || ""}"
        />
        <textarea
          rows="2"
          data-type="risk-notes"
          data-id="${risk.id}"
          placeholder="Notes / owner / mitigation"
        >${risk.notes || ""}</textarea>
      </div>
    `
  );

  const body = `
    <div class="risk-list">
      ${rows.join("")}
    </div>
    <div class="form-actions" style="margin-top:0.75rem;">
      <button type="button" class="btn btn-secondary btn-sm" id="addRiskRow">
        <i class="fa-solid fa-plus"></i>
        Add risk
      </button>
    </div>
  `;

  return addSection(
    "Risks & Issues",
    body,
    "Track blockers or watchlist items; toggle Select for active risks."
  );
}

function renderTextAreaSection(title, id, value, subtitle) {
  return addSection(
    title,
    `
      <div class="form-group">
        <textarea id="${id}" rows="3" placeholder="">${value || ""}</textarea>
      </div>
    `,
    subtitle
  );
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
  if (midterm.healthScore != null) {
    lines.push(`Overall project health: ${midterm.healthScore}/5`);
  }
  if (midterm.progressScore != null) {
    lines.push(`Progress vs. plan: ${midterm.progressScore}/5`);
  }
  lines.push("");

  if (midterm.goalStatuses.length) {
    lines.push("Goal statuses:");
    midterm.goalStatuses.forEach((g) => {
      lines.push(
        `• [${g.type}] ${g.label} — ${g.status}${g.notes ? ` (${g.notes})` : ""}`
      );
    });
    lines.push("");
  }

  const activeRisks = (midterm.risks || []).filter(r => r.selected && r.label);
  if (activeRisks.length) {
    lines.push("Risks / issues:");
    activeRisks.forEach(r => {
      lines.push(`• ${r.label}${r.notes ? ` — ${r.notes}` : ""}`);
    });
    lines.push("");
  }

  if (midterm.wins.trim()) {
    lines.push("Biggest wins:");
    lines.push(midterm.wins.trim(), "");
  }
  if (midterm.learnings.trim()) {
    lines.push("Key learnings:");
    lines.push(midterm.learnings.trim(), "");
  }
  if (midterm.nextSteps.trim()) {
    lines.push("Next steps:");
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
  if (midterm.healthScore != null) {
    lines.push(`• Overall health: ${midterm.healthScore}/5`);
  }
  if (midterm.progressScore != null) {
    lines.push(`• Progress vs. plan: ${midterm.progressScore}/5`);
  }
  if (midterm.goalStatuses.length) {
    lines.push("");
    lines.push("Status by goal:");
    midterm.goalStatuses.forEach((g) => {
      lines.push(
        `• [${g.type}] ${g.label}: ${g.status}${g.notes ? ` — ${g.notes}` : ""}`
      );
    });
  }
  if (midterm.wins.trim()) {
    lines.push("");
    lines.push("Biggest wins:");
    lines.push(midterm.wins.trim());
  }
  if (midterm.learnings.trim()) {
    lines.push("");
    lines.push("Key learnings:");
    lines.push(midterm.learnings.trim());
  }
  if (midterm.nextSteps.trim()) {
    lines.push("");
    lines.push("Next steps:");
    lines.push(midterm.nextSteps.trim());
  }
  lines.push("");
  lines.push(
    "If anything here feels off or needs adjustment, we’re happy to recalibrate together."
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
  const calendarLink = document.getElementById("finalReviewCalendarLink");

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

  if (calendarLink) {
    calendarLink.addEventListener("click", (e) => {
      e.preventDefault();
      const url = buildFinalReviewCalendarUrl();
      window.open(url, "_blank");
    });
  }

  saveMidtermForDashboard();
}

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
    details: `${buildInternalSummary()}

Final review form:
https://lisapancakes.github.io/metric-mate/final.html`,
    dates: `${formatDate(start)}/${formatDate(end)}`
  });

  return `${base}&${params.toString()}`;
}

// ============================================================================
// FORM HANDLERS
// ============================================================================
function handleChange(e) {
  const t = e.target;

  if (t.name === "healthScore" && t.type === "radio") {
    midterm.healthScore = parseInt(t.value, 10);
    saveMidtermForDashboard();
    return;
  }

  if (t.name === "progressScore" && t.type === "radio") {
    midterm.progressScore = parseInt(t.value, 10);
    saveMidtermForDashboard();
    return;
  }

  if (t.dataset.type === "goal-status") {
    const id = t.dataset.id;
    const gs = midterm.goalStatuses.find(g => g.id === id);
    if (gs) {
      gs.status = t.value;
      saveMidtermForDashboard();
    }
    return;
  }

  if (t.dataset.type === "risk-selected") {
    const id = t.dataset.id;
    const risk = midterm.risks.find(r => r.id === id);
    if (risk) {
      risk.selected = t.checked;
      saveMidtermForDashboard();
    }
    return;
  }
}

function handleInput(e) {
  const t = e.target;
  const val = t.value;

  switch (t.id) {
    case "projectName":
      midterm.info.projectName = val;
      updateMidtermMetaSummary();
      break;
    case "client":
      midterm.info.client = val;
      updateMidtermMetaSummary();
      break;
    case "pm":
      midterm.info.pm = val;
      updateMidtermMetaSummary();
      break;
    case "designer":
      midterm.info.designer = val;
      updateMidtermMetaSummary();
      break;
    case "dev":
      midterm.info.dev = val;
      updateMidtermMetaSummary();
      break;
    case "otherContributors":
      midterm.info.otherContributors = val;
      break;
    case "date":
      midterm.info.date = val;
      break;
    case "wins":
      midterm.wins = val;
      break;
    case "learnings":
      midterm.learnings = val;
      break;
    case "nextSteps":
      midterm.nextSteps = val;
      break;
  }

  if (t.dataset.type === "goal-notes") {
    const id = t.dataset.id;
    const gs = midterm.goalStatuses.find(g => g.id === id);
    if (gs) gs.notes = val;
  }

  if (t.dataset.type === "risk-label") {
    const id = t.dataset.id;
    const risk = midterm.risks.find(r => r.id === id);
    if (risk) risk.label = val;
  }

  if (t.dataset.type === "risk-notes") {
    const id = t.dataset.id;
    const risk = midterm.risks.find(r => r.id === id);
    if (risk) risk.notes = val;
  }

  saveMidtermForDashboard();
}

function handleClick(e) {
  const t = e.target;
  if (t.id === "addRiskRow" || t.closest("#addRiskRow")) {
    addRiskRow();
    return;
  }

  if (t.id === "toggleMidtermMeta") {
    midterm.metaExpanded = !midterm.metaExpanded;
    renderStep(midterm.currentStep);
  }
}

function updateMidtermMetaSummary() {
  const project = document.getElementById("midtermMetaProject");
  const client = document.getElementById("midtermMetaClient");
  const pm = document.getElementById("midtermMetaPm");
  const designer = document.getElementById("midtermMetaDesigner");
  const dev = document.getElementById("midtermMetaDev");

  if (project) project.textContent = midterm.info.projectName || "—";
  if (client) client.textContent = midterm.info.client || "—";
  if (pm) pm.textContent = midterm.info.pm || "—";
  if (designer) designer.textContent = midterm.info.designer || "—";
  if (dev) dev.textContent = midterm.info.dev || "—";
}

function addRiskRow() {
  midterm.risks.push({
    id: generateId(),
    label: "",
    selected: true,
    notes: ""
  });
  renderStep(midterm.currentStep);
  saveMidtermForDashboard();
}
