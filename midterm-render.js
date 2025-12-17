// =====================================
// Metric Mate – Midterm Rendering & Logic (v2)
// Responsibilities:
//  - Hydrate state from kickoff + saved midterm
//  - Render modular sections (v2 UX)
//  - Collect goalStatuses with type for dashboard consumption
// =====================================

const STATUS_OPTIONS = [
  { value: "not-started", label: "Not Started" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "discard", label: "Discard" }
];

const titleCaseType = (t) => (t ? t.replace(/\b\w/g, (c) => c.toUpperCase()) : "");
const formatStatusLabel = (value) => {
  const opt = STATUS_OPTIONS.find((o) => o.value === value);
  if (opt) return opt.label;
  return value ? value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";
};

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
  const params = new URLSearchParams(window.location.search);
  const hasKickoffParam = params.has("data");
  const resumeRequested = params.get("resume") === "1";
  const shouldResumeSavedMidterm = resumeRequested && !hasKickoffParam;

  // Decide whether to resume a previous midterm draft
  if (shouldResumeSavedMidterm) {
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
      midterm.winsList = Array.isArray(savedMidterm.winsList)
        ? savedMidterm.winsList
        : (midterm.wins ? midterm.wins.split(/\n+/).map(s => s.trim()).filter(Boolean) : []);
      midterm.learningsList = Array.isArray(savedMidterm.learningsList)
        ? savedMidterm.learningsList
        : (midterm.learnings ? midterm.learnings.split(/\n+/).map(s => s.trim()).filter(Boolean) : []);
      midterm.nextStepsList = Array.isArray(savedMidterm.nextStepsList)
        ? savedMidterm.nextStepsList
        : (midterm.nextSteps ? midterm.nextSteps.split(/\n+/).map(s => s.trim()).filter(Boolean) : []);
    }
  } else {
    // Fresh session → clear any previously saved midterm snapshot
    try {
      localStorage.removeItem("metricMateMidterm");
    } catch (e) {
      console.warn("Could not clear saved midterm snapshot", e);
    }
  }

  // Hydrate from kickoff data (URL or localStorage)
  const kickoffData = getKickoffDataFromUrl();

  if (kickoffData && kickoffData.info) {
    const info = kickoffData.info;
    const dir = kickoffData.directory || {};

    // Project name
    midterm.info.projectName =
      info.projectName || info.name || midterm.info.projectName;

    // Project summary (one sentence)
    midterm.info.projectSummary =
      info.projectSummary || info.summary || midterm.info.projectSummary;

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
  if (nextBtn) {
    nextBtn.onclick = (e) => {
      e.preventDefault();
      goToNextStep();
    };
  }

  // Form events
  if (form) {
    form.addEventListener("change", handleChange);
    form.addEventListener("input", handleInput);
    form.addEventListener("click", handleClick);
    form.addEventListener("keydown", handleKeydown);
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
      alert("Please Enter a Project Name");
      return false;
    }
    if (midterm.healthScore == null) {
      alert("Please Rate Overall Project Health");
      return false;
    }
    if (midterm.progressScore == null) {
      alert("Please Rate Overall Project Progress");
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
    stepEl.innerHTML = renderStatusStep();
  } else if (step === 3) {
    stepEl.innerHTML = renderNarrativesStep();
  } else if (step === 4) {
    const internalDefault = buildInternalSummary();
    const clientDefault = buildClientSummary();
    if (!midtermSummaryState.internalSummary) midtermSummaryState.internalSummary = internalDefault;
    if (!midtermSummaryState.clientSummary) midtermSummaryState.clientSummary = clientDefault;
    internalSummary = midtermSummaryState.internalSummary || internalDefault;
    clientSummary = midtermSummaryState.clientSummary || clientDefault;
    stepEl.innerHTML = renderSummaryStep(internalSummary, clientSummary);
  }

  form.appendChild(stepEl);

  if (step === midterm.totalSteps) {
    setupSummaryActions(internalSummary, clientSummary);
  }

  if (step === 1) {
    updateMidtermMetaSummary();
  }

  if (prevBtn) prevBtn.disabled = step === 1;

  const dashboardBtn = document.getElementById("openDashboardBtn");
  if (nextBtn) {
    if (step === midterm.totalSteps) {
      nextBtn.style.display = "none";
      nextBtn.disabled = true;
    } else {
      nextBtn.style.display = "inline-block";
      nextBtn.disabled = false;
      nextBtn.textContent =
        step === midterm.totalSteps - 1 ? "Finish" : "Next";
      nextBtn.onclick = (e) => {
        e.preventDefault();
        goToNextStep();
      };
    }
  }
  if (dashboardBtn) {
    dashboardBtn.style.display =
      step === midterm.totalSteps ? "inline-flex" : "none";
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
    "Auto-Injected From Kickoff; Expand to Adjust."
  );

  const healthSection = addSection(
    "Project Health Check",
    `
      <div class="form-group">
        <label>Overall Project Health Today</label>
        <div class="rating">
          <div class="rating-label">At Risk</div>
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
          <div class="rating-label">On Track</div>
        </div>
      </div>
      <div class="form-group">
        <label>Overall Progress vs. Plan</label>
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
    "Two Required Scores to Track Health and Velocity."
  );

  return metaSection + healthSection;
}

// STEP 2 – Status table
function renderStatusStep() {
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
                <th>How?</th>
              </tr>
            </thead>
            <tbody>
              ${midterm.goalStatuses
                .map(
                  (item) => `
                    <tr class="${item.status === "discard" ? "goal-row--discard" : ""}">
                      <td>${item.label}</td>
                      <td>${titleCaseType(item.type)}</td>
                      <td>
                        <div class="select-wrapper">
                          <select data-type="goal-status" data-id="${item.id}">
                            ${STATUS_OPTIONS.map(
                              (opt) => `<option value="${opt.value}" ${
                                item.status === opt.value ? "selected" : ""
                              }>${opt.label}</option>`
                            ).join("")}
                          </select>
                          <i class="fa-regular fa-solid fa-chevron-down select-chevron" aria-hidden="true"></i>
                        </div>
                      </td>
                      <td>
                        <textarea
                          rows="2"
                          data-type="goal-notes"
                          data-id="${item.id}"
                          placeholder="Notes on Progress, Blockers, Scope Changes..."
                        >${item.notes || ""}</textarea>
                      </td>
                      <td>
                        <textarea
                          rows="2"
                          data-type="goal-completion-note"
                          data-id="${item.id}"
                          placeholder="How did you complete this goal? What helped?"
                          style="display:${item.status === "completed" ? "block" : "none"};"
                        >${item.completionNote || ""}</textarea>
                      </td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <div class="add-goal-inline">
          <button type="button" class="btn btn-secondary btn-sm" id="midtermShowAddGoalBtn">
            <i class="fa-solid fa-plus"></i>
            Add Goal
          </button>
          <div id="midtermAddGoalContainer" style="display:none; margin-top:0.75rem;">
            <div class="form-grid">
              <div class="form-group">
                <label for="midtermNewGoalLabel">Goal Label</label>
                <input type="text" id="midtermNewGoalLabel" placeholder="Add a Goal for Midterm Tracking">
              </div>
              <div class="form-group">
                <label for="midtermNewGoalType">Type</label>
                <select id="midtermNewGoalType">
                  <option value="business">Business</option>
                  <option value="product">Product</option>
                  <option value="user">User</option>
                  <option value="pain">Pain</option>
                </select>
              </div>
              <div class="form-group">
                <label for="midtermNewGoalImportance">Importance</label>
                <select id="midtermNewGoalImportance">
                  ${[1,2,3,4,5].map(n => `<option value="${n}" ${n===3?"selected":""}>${n}</option>`).join("")}
                </select>
              </div>
              <div class="form-group">
                <label for="midtermNewGoalStatus">Status</label>
                <select id="midtermNewGoalStatus">
                  ${STATUS_OPTIONS.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join("")}
                </select>
              </div>
        <div class="form-group">
          <label for="midtermNewGoalNotes">Notes</label>
          <textarea id="midtermNewGoalNotes" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label for="midtermNewGoalCompletionNote">What helped?</label>
          <textarea id="midtermNewGoalCompletionNote" rows="2" placeholder="Optional – 1 short sentence about what changed."></textarea>
          <p class="help-text">
            Optional – 1 short sentence about what changed, e.g. “Simplified first-run steps and added a tour.”
          </p>
        </div>
      </div>
      <button type="button" class="btn btn-secondary btn-sm" id="midtermAddGoalBtn">
        <i class="fa-solid fa-plus"></i>
        Add Goal
      </button>
          </div>
        </div>
      `
      : `<p class="help-text">No Kickoff Goals Were Selected, So There Are No Midterm Statuses to Capture.</p>`;

  return (
    addSection(
      "Status Update Table",
      statusTable,
      "Auto-Generated From Kickoff Selections. Track Progress by Goal."
    )
  );
}

// STEP 3 – Narrative fields
function renderNarrativesStep() {
  ensureNarrativeListsFromStrings();
  ensureDefaultNarrativeRows();

  const risksSection = renderRisksSection();
  const winsSection = renderListSection(
    "Biggest Wins",
    "wins",
    midterm.winsList,
    "Add a key win or positive outcome"
  );
  const learningsSection = renderListSection(
    "Key Learnings",
    "learnings",
    midterm.learningsList,
    "Add a key learning or insight"
  );
  const nextStepsSection = renderListSection(
    "Next Steps",
    "nextSteps",
    midterm.nextStepsList,
    "Add a next step"
  );

  return `
    <h2>Risks, Wins, and Next Steps</h2>
    ${risksSection}
    ${winsSection}
    ${learningsSection}
    ${nextStepsSection}
  `;
}

// STEP 4 – Summaries
function renderSummaryStep(internalSummary, clientSummary) {
  return `
    <h2>Review and Share</h2>
    <p class="help-text">
      Use These Summaries in Your Mid-Project Sync, Internal Notes, or Client Email.
    </p>

    <section class="summary-section">
      <div class="summary-heading-row">
        <div class="summary-heading-text">
          <h3>1. Internal Mid-Project Summary</h3>
          <p class="help-text">Drop This Into Asana, Slack, or Your Team Doc.</p>
        </div>
        <button type="button" class="btn btn-secondary btn-sm ai-action-btn" id="midterm-ai-internal-btn">
          <i class="fa-solid fa-robot"></i>
          Create Project Update
        </button>
      </div>
      <div class="copy-block">
        <textarea
          id="internalSummary"
          rows="10"
          readonly
          data-original="${internalSummary}"
          placeholder="A mid-project internal status update will appear here once generated."
        ></textarea>
        <button type="button" class="copy-chip" data-copy-target="internalSummary">Copy Text</button>
      </div>
    </section>

    <section class="summary-section">
      <div class="summary-heading-row">
        <div class="summary-heading-text">
          <h3>2. Client-Friendly Check-In</h3>
          <p class="help-text">Use This in a Short Email or Slide to Align on Where Things Stand.</p>
        </div>
        <button type="button" class="btn btn-secondary btn-sm ai-action-btn" id="midterm-ai-client-btn">
          <i class="fa-solid fa-robot"></i>
          Create Client Email
        </button>
      </div>
      <div class="copy-block">
        <textarea
          id="clientSummary"
          rows="10"
          readonly
          data-original="${clientSummary}"
          placeholder="A client-ready mid-project update email will appear here once generated."
        ></textarea>
        <button type="button" class="copy-chip" data-copy-target="clientSummary">Copy Text</button>
      </div>
    </section>

    <section class="summary-section">
      <h3>3. Final Review Reminder</h3>
      <p class="help-text">
        Create a Calendar Event for Your End-of-Project / Retrospective Conversation.
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

  `;
}

// HELPERS FOR SECTIONS
function renderRisksSection() {
  const rows = (midterm.risks || [])
    .map(
      (risk) => `
        <div class="risk-row" data-id="${risk.id}">
          <div class="risk-label-wrapper">
            <input
              type="text"
              class="risk-label-input"
              data-type="risk-label"
              data-id="${risk.id}"
              placeholder="Add a current risk or issue"
              value="${risk.label || ""}"
            />
            <button type="button" class="icon-remove-btn risk-remove-btn" data-type="remove-risk" data-id="${risk.id}" aria-label="Remove risk">
              <i class="fa-solid fa-xmark"></i>
            </button>
      </div>
    </div>
      `
    )
    .join("");

  const body = `
    <div class="risk-list">
      ${rows}
    </div>
    <div class="form-actions" style="margin-top:0.75rem;">
      <button type="button" class="btn btn-secondary btn-sm" id="addRiskRow">
        <i class="fa-solid fa-plus"></i>
        Add Risk
      </button>
    </div>
  `;

  return addSection("Risks & Issues", body, "Track blockers or watchlist items.");
}

function renderTextAreaSection(title, id, value, subtitle) {
  return "";
}

function renderListSection(title, key, items = [], placeholder = "") {
  const addLabel =
    key === "wins"
      ? "Add Win"
      : key === "learnings"
        ? "Add Learning"
        : key === "nextSteps"
          ? "Add Next Step"
          : "Add Item";
  const rows = (items || []).map((item, idx) => {
    const safeVal = item || "";
    return `
      <div class="list-row" data-key="${key}" data-index="${idx}">
        <div class="list-label-wrapper">
          <input
            type="text"
            class="list-label-input"
            data-type="${key}-item"
            data-index="${idx}"
            placeholder="${placeholder}"
            value="${safeVal}"
          />
          <button type="button" class="icon-remove-btn" data-type="remove-${key}" data-index="${idx}" aria-label="Remove ${key}">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    `;
  }).join("");

  const body = `
    <div class="list-wrapper">
      ${rows}
    </div>
    <div class="form-actions" style="margin-top:0.75rem;">
      <button type="button" class="btn btn-secondary btn-sm" id="add${capitalize(key)}Row">
        <i class="fa-solid fa-plus"></i>
        ${addLabel}
      </button>
    </div>
  `;

  return addSection(title, body);
}

function capitalize(str = "") {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function ensureNarrativeListsFromStrings() {
  if (!Array.isArray(midterm.winsList)) midterm.winsList = [];
  if (!midterm.winsList.length && midterm.wins) {
    midterm.winsList = midterm.wins.split(/\n+/).map(s => s.trim()).filter(Boolean);
  }

  if (!Array.isArray(midterm.learningsList)) midterm.learningsList = [];
  if (!midterm.learningsList.length && midterm.learnings) {
    midterm.learningsList = midterm.learnings.split(/\n+/).map(s => s.trim()).filter(Boolean);
  }

  if (!Array.isArray(midterm.nextStepsList)) midterm.nextStepsList = [];
  if (!midterm.nextStepsList.length && midterm.nextSteps) {
    midterm.nextStepsList = midterm.nextSteps.split(/\n+/).map(s => s.trim()).filter(Boolean);
  }
}

function syncNarrativeStrings() {
  midterm.wins = (midterm.winsList || []).filter(Boolean).join("\n");
  midterm.learnings = (midterm.learningsList || []).filter(Boolean).join("\n");
  midterm.nextSteps = (midterm.nextStepsList || []).filter(Boolean).join("\n");
}

function ensureDefaultNarrativeRows() {
  if (!Array.isArray(midterm.risks) || midterm.risks.length === 0) {
    midterm.risks = [{
      id: generateId(),
      label: "",
      selected: true,
      notes: ""
    }];
  }

  if (!Array.isArray(midterm.winsList) || midterm.winsList.length === 0) {
    midterm.winsList = [""];
  }

  if (!Array.isArray(midterm.learningsList) || midterm.learningsList.length === 0) {
    midterm.learningsList = [""];
  }

  if (!Array.isArray(midterm.nextStepsList) || midterm.nextStepsList.length === 0) {
    midterm.nextStepsList = [""];
  }

  syncNarrativeStrings();
}

// ============================================================================
// SUMMARY BUILDERS
// ============================================================================
function buildInternalSummary() {
  const i = midterm.info;
  ensureNarrativeListsFromStrings();

  const health = midterm.healthScore != null ? `${midterm.healthScore}/5` : "—";
  const progress =
    midterm.progressScore != null ? `${midterm.progressScore}/5` : "—";

  const lines = [];
  lines.push(`Project Update: ${i.projectName || "Untitled Project"}`);
  lines.push("");
  lines.push(`Overall Health: ${health}`);
  lines.push(`Progress vs. Plan: ${progress}`);
  lines.push("");

  const types = [
    { key: "business", title: "Business Goals" },
    { key: "product", title: "Product Goals" },
    { key: "user", title: "User Goals" },
    { key: "pain", title: "User Pain Points" }
  ];

  lines.push("Goal Statuses");
  lines.push("");

  types.forEach((t) => {
    const goals = (midterm.goalStatuses || []).filter(
      (g) => g.type === t.key && g.status !== "discard"
    );
    lines.push(`  ${t.title}`);
    if (goals.length === 0) {
      lines.push("    • No entries captured.");
    } else {
      goals.forEach((g) => {
        const status = formatStatusLabel(g.status) || "Not Started";
        const note = g.notes ? ` ${g.notes}` : "";
        lines.push(`    • ${g.label} — ${status}.${note ? note : ""}`);
      });
    }
    lines.push("");
  });

  const risks = (midterm.risks || []).filter((r) => r.label);
  lines.push("Risks / Issues");
  if (risks.length) {
    risks.forEach((r) => {
      lines.push(`    • ${r.label}`);
    });
  } else {
    lines.push("    • No risks identified.");
  }
  lines.push("");

  lines.push("Biggest Wins");
  const wins =
    Array.isArray(midterm.winsList) && midterm.winsList.length
      ? midterm.winsList.filter(Boolean)
      : (midterm.wins ? midterm.wins.split(/\n+/).map(s => s.trim()).filter(Boolean) : []);
  if (wins.length) {
    wins.forEach((w) => {
      lines.push(`    • ${w}`);
    });
  } else {
    lines.push("    • No wins captured yet.");
  }
  lines.push("");

  lines.push("Key Learnings");
  const learnings =
    Array.isArray(midterm.learningsList) && midterm.learningsList.length
      ? midterm.learningsList.filter(Boolean)
      : (midterm.learnings ? midterm.learnings.split(/\n+/).map(s => s.trim()).filter(Boolean) : []);
  if (learnings.length) {
    learnings.forEach((l) => {
      lines.push(`    • ${l}`);
    });
  } else {
    lines.push("    • No learnings captured yet.");
  }
  lines.push("");

  lines.push("Next Steps");
  const steps =
    Array.isArray(midterm.nextStepsList) && midterm.nextStepsList.length
      ? midterm.nextStepsList.filter(Boolean)
      : (midterm.nextSteps ? midterm.nextSteps.split(/\n+/).map(s => s.trim()).filter(Boolean) : []);
  if (steps.length) {
    steps.forEach((s) => {
      lines.push(`    • ${s}`);
    });
  } else {
    lines.push("    • No next steps provided.");
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
    `Here’s a Quick Mid-Project Snapshot for ${i.projectName || "the Project"}:`
  );
  lines.push("");
  if (midterm.healthScore != null) {
    lines.push(`• Overall Health: ${midterm.healthScore}/5`);
  }
  return lines.join("\n");
}

async function rewriteMidtermWithAI({ mode, text }) {
  const aiInput = buildMidtermAIInputText(text || "");
  const isLocalDev =
    window.location.protocol === "file:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const base = isLocalDev ? "http://localhost:3001" : "";

  const res = await fetch(`${base}/api/rewrite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode,
      phase: "midterm",
      text: aiInput,
      projectContext: ""
    })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Rewrite failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  if (!data || typeof data.text !== "string") {
    throw new Error("Invalid AI response");
  }
  return data.text;
}

function tightenMidtermText(text = "") {
  const lines = (text || "").split("\n");
  const cleaned = [];
  let prevWasHeading = false;
  for (let i = 0; i < lines.length; i++) {
    const curr = (lines[i] || "").replace(/\s+$/, "");
    const trimmed = curr;
    const isHeading =
      trimmed &&
      !/^\s*•/.test(trimmed) &&
      !/^\s*[-*]/.test(trimmed) &&
      !/^\s{2,}•/.test(trimmed);
    // Skip a blank line immediately following a heading
    if (prevWasHeading && trimmed === "") {
      prevWasHeading = false;
      continue;
    }
    cleaned.push(trimmed);
    prevWasHeading = isHeading;
  }
  const collapsed = [];
  cleaned.forEach((l) => {
    // Keep a blank line only between sections; remove trailing blanks
    if (l === "" && (collapsed.length === 0 || collapsed[collapsed.length - 1] === "")) {
      return;
    }
    collapsed.push(l);
  });
  return collapsed.join("\n").trim();
}

function normalizePlainTextDraft(aiText, sectionLabels = []) {
  const sectionLabelSet = new Set(sectionLabels);
  const cleanedLines = (aiText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((t) => t.replace(/^#+\s*/, "")) // strip markdown headings like ### Heading
    .map((t) => t.replace(/\*\*/g, "")) // strip markdown bold like **Heading**
    .map((t) => t.replace(/^[-*]\s+/, "• ")) // normalize -/* bullets to •
    .map((t) => t.replace(/^\d+\.\s+/, "• ")); // normalize numbered bullets to •

  const formatted = [];
  let prevWasBlank = false;

  cleanedLines.forEach((line, idx) => {
    const isSectionLabel = sectionLabelSet.has(line);
    const isBullet = /^[-•]/.test(line);
    const isBulletedSubheading = /^•\s+.+:\s*$/.test(line);
    const normalizedLine = isBulletedSubheading ? line.replace(/^•\s+/, "") : line;
    const isSubheading =
      !isSectionLabel && /.+:\s*$/.test(normalizedLine) && !/^[-•]/.test(normalizedLine);

    if (isSectionLabel && !prevWasBlank && formatted.length > 0) {
      formatted.push("");
      prevWasBlank = true;
    }

    if (isSubheading && !prevWasBlank && formatted.length > 0) {
      formatted.push("");
      prevWasBlank = true;
    }

    formatted.push(normalizedLine);
    prevWasBlank = normalizedLine === "";

    const next = cleanedLines[idx + 1];
    const nextIsBullet = next ? /^[-•]/.test(next) : false;
    const nextIsBulletedSubheading = next ? /^•\s+.+:\s*$/.test(next) : false;
    const nextNormalizedLine =
      next && nextIsBulletedSubheading ? next.replace(/^•\s+/, "") : next;
    const nextIsSectionLabel = nextNormalizedLine ? sectionLabelSet.has(nextNormalizedLine) : false;
    const nextIsSubheading = nextNormalizedLine
      ? !nextIsSectionLabel &&
        /.+:\s*$/.test(nextNormalizedLine) &&
        !/^[-•]/.test(nextNormalizedLine)
      : false;

    if (isBullet && !nextIsBullet && next) {
      formatted.push("");
      prevWasBlank = true;
    }

    if (!isBullet && !isSectionLabel && nextIsSectionLabel) {
      formatted.push("");
      prevWasBlank = true;
    }

    if (!isBullet && !isSectionLabel && !isSubheading && nextIsSubheading) {
      formatted.push("");
      prevWasBlank = true;
    }
  });

  const collapsed = [];
  formatted.forEach((line) => {
    if (line === "" && collapsed[collapsed.length - 1] === "") return;
    collapsed.push(line);
  });
  return collapsed.join("\n").trim();
}

function formatMidtermClientEmail(aiText) {
  const kickoff = getKickoffDataFromUrl() || {};
  const info = kickoff.info || {};
  const dir = kickoff.directory || {};

  const client =
    info.client ||
    (typeof info.clientId === "number" && Array.isArray(dir.clients)
      ? dir.clients[info.clientId]
      : "") ||
    "there";

  const pm =
    info.pm ||
    (typeof info.pmId === "number" && Array.isArray(dir.pms)
      ? dir.pms[info.pmId]
      : "") ||
    "The Team";

  const sectionLabels = [
    "Project Health Summary",
    "Progress Since Kickoff",
    "What’s Going Well",
    "Risks & Areas to Watch",
    "Decisions or Open Questions",
    "Next Steps",
  ];

  const pmLower = pm.toLowerCase();
  const cleanedLines = (aiText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((t) => {
      if (!t) return false;
      const lower = t.toLowerCase();
      if (lower.startsWith("subject:")) return false;
      if (/^(hi|hello|dear)\b/i.test(t)) return false;
      if (t.includes("[Client") || t.includes("[client")) return false;
      if (t.includes("[Your") || t.includes("[your")) return false;
      if (/^(best|best regards|kind regards|regards|sincerely|thanks|thank you|cheers)/i.test(t)) return false;
      if (pmLower && (lower === pmLower || lower.startsWith(pmLower))) return false;
      if (lower.includes("thinklogic team")) return false;
      if (lower.includes("project manager")) return false;
      return true;
    })
    .map((t) => t.replace(/^#+\s*/, "")) // strip markdown headings like ### Heading
    .map((t) => t.replace(/\*\*/g, "")); // strip markdown bold like **Heading**

  const body = normalizePlainTextDraft(cleanedLines.join("\n"), sectionLabels);

  const parts = [];
  parts.push(`Hi ${client} Team,`);
  if (body) {
    parts.push("");
    parts.push(body);
  }
  parts.push("");
  parts.push(`Best,\n${pm} & the Thinklogic Team`);

  return parts.join("\n");
}

// ============================================================================
// SUMMARY ACTIONS + CALENDAR
// ============================================================================
function setupSummaryActions(internalSummary, clientSummary) {
  const calendarLink = document.getElementById("finalReviewCalendarLink");

  if (calendarLink) {
    calendarLink.addEventListener("click", (e) => {
      e.preventDefault();
      const url = buildFinalReviewCalendarUrl();
      window.open(url, "_blank");
    });
  }

  saveMidtermForDashboard();
  initMidtermAIButtons();
  updateMidtermCopyButtonsVisibility();
  initMidtermCopyChips();
}

function buildMidtermAIInputText(userText = "") {
  const lines = [];

  if (midterm.info.projectName) {
    lines.push(`Project: ${midterm.info.projectName}`);
  }

  if (typeof midterm.healthScore === "number") {
    lines.push(`Overall Health (1-5): ${midterm.healthScore}`);
  }
  if (typeof midterm.progressScore === "number") {
    lines.push(`Progress vs Plan (1-5): ${midterm.progressScore}`);
  }

  const typeOrder = ["business", "product", "user", "pain"];
  const groupedGoals = { business: [], product: [], user: [], pain: [] };
  (midterm.goalStatuses || []).forEach((g) => {
    if (g && g.label && groupedGoals[g.type]) {
      const statusLabel = g.status ? ` [status: ${g.status}]` : "";
      const note = g.notes ? ` — ${g.notes}` : "";
      groupedGoals[g.type].push(`${g.label}${statusLabel}${note}`);
    }
  });

  typeOrder.forEach((type) => {
    const title =
      type === "business"
        ? "Business Goals"
        : type === "product"
          ? "Product / UX Goals"
          : type === "user"
            ? "User Goals"
            : "User Pain Points";
    if (groupedGoals[type] && groupedGoals[type].length) {
      lines.push(`${title}:`);
      groupedGoals[type].forEach((label) => lines.push(`- ${label}`));
    }
  });

  const notedGoals = (midterm.goalStatuses || []).filter(
    (g) => g && g.notes && g.notes.trim()
  );
  if (notedGoals.length) {
    lines.push("Goal notes (midterm updates):");
    notedGoals.forEach((g) => {
      lines.push(`- ${g.label} (status: ${g.status || "n/a"}): ${g.notes.trim()}`);
    });
  }

  if (Array.isArray(midterm.winsList) && midterm.winsList.length) {
    lines.push("Wins / Signals:");
    midterm.winsList.filter(Boolean).forEach((w) => lines.push(`- ${w.trim()}`));
  }

  if (Array.isArray(midterm.learningsList) && midterm.learningsList.length) {
    lines.push("Key Learnings:");
    midterm.learningsList.filter(Boolean).forEach((l) => lines.push(`- ${l.trim()}`));
  }

  const risksWithContent = (midterm.risks || []).filter(
    (r) => r && (r.selected || r.label || r.notes)
  );
  if (risksWithContent.length) {
    lines.push("Risks / Issues:");
    risksWithContent.forEach((r) => {
      const parts = [];
      if (r.label) parts.push(r.label);
      if (r.notes) parts.push(r.notes);
      if (parts.length) lines.push(`- ${parts.join(" — ")}`);
    });
  }

  if (Array.isArray(midterm.nextStepsList) && midterm.nextStepsList.length) {
    lines.push("Next Steps (raw notes):");
    midterm.nextStepsList.filter(Boolean).forEach((n) => lines.push(`- ${n.trim()}`));
  }

  if (userText && userText.trim()) {
    lines.push("User-provided notes:");
    lines.push(userText.trim());
  }

  return lines.join("\n");
}

function updateMidtermCopyButtonsVisibility() {
  const chips = document.querySelectorAll(".copy-chip");
  chips.forEach((chip) => {
    const targetId = chip.dataset.copyTarget;
    const target = document.getElementById(targetId);
    if (!target) return;
    const hasContent = (target.value || "").trim().length > 0;
    chip.style.display = hasContent ? "inline-flex" : "none";
  });
}

function initMidtermCopyChips() {
  const chips = document.querySelectorAll(".copy-chip");
  chips.forEach((chip) => {
    if (chip.dataset.copyWired === "1") return;
    chip.dataset.copyWired = "1";
    chip.style.display = "none";
    chip.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = chip.dataset.copyTarget;
      const target = document.getElementById(targetId);
      if (!target) return;
      const val = (target.value || "").trim();
      if (!val) {
        return;
      }
      try {
        copyToClipboard(val);
        showStatus("Text Copied to Clipboard");
      } catch (err) {
        console.error("Copy chip failed", err);
        alert("Could not copy text. Please try again.");
      }
    });
  });
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

  const finalUrl =
    window.location.protocol === "file:"
      ? new URL("final.html", window.location.href).href
      : "file:///Users/lisa/Code/metric-mate/final.html";

  const params = new URLSearchParams({
    text: `Final Review: ${projectName} (${clientName})`,
    details: `${buildInternalSummary()}

Final Review Form:
${finalUrl}`,
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
      const row = t.closest("tr");
      if (row) {
        const completionField = row.querySelector('textarea[data-type="goal-completion-note"]');
        const completionHelp = row.querySelector('p.help-text');
        const shouldShow = t.value === "completed";
        if (completionField) completionField.style.display = shouldShow ? "block" : "none";
        if (completionHelp) completionHelp.style.display = shouldShow ? "block" : "none";
      }
      saveMidtermForDashboard();
    }
    return;
  }

  if (t.dataset.type === "remove-risk") {
    const id = t.dataset.id;
    midterm.risks = (midterm.risks || []).filter(r => r.id !== id);
    renderStep(midterm.currentStep);
    saveMidtermForDashboard();
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
    case "internalSummary":
      midtermSummaryState.internalSummary = val;
      break;
    case "clientSummary":
      midtermSummaryState.clientSummary = val;
      break;
  }

  if (t.dataset.type === "goal-notes") {
    const id = t.dataset.id;
    const gs = midterm.goalStatuses.find(g => g.id === id);
    if (gs) gs.notes = val;
  }

  if (t.dataset.type === "goal-completion-note") {
    const id = t.dataset.id;
    const gs = midterm.goalStatuses.find(g => g.id === id);
    if (gs) gs.completionNote = val;
  }

  if (t.dataset.type === "risk-label") {
    const id = t.dataset.id;
    const risk = midterm.risks.find(r => r.id === id);
    if (risk) risk.label = val;
  }

  if (t.dataset.type === "wins-item") {
    const idx = parseInt(t.dataset.index, 10);
    if (!Number.isNaN(idx)) {
      midterm.winsList[idx] = val;
      syncNarrativeStrings();
    }
  }

  if (t.dataset.type === "learnings-item") {
    const idx = parseInt(t.dataset.index, 10);
    if (!Number.isNaN(idx)) {
      midterm.learningsList[idx] = val;
      syncNarrativeStrings();
    }
  }

  if (t.dataset.type === "nextSteps-item") {
    const idx = parseInt(t.dataset.index, 10);
    if (!Number.isNaN(idx)) {
      midterm.nextStepsList[idx] = val;
      syncNarrativeStrings();
    }
  }

  saveMidtermForDashboard();
}

function handleClick(e) {
  const t = e.target;
  if (t.id === "addRiskRow" || t.closest("#addRiskRow")) {
    addRiskRow(false, true);
    return;
  }

  const removeBtn = t.closest('[data-type="remove-risk"]');
  if (removeBtn) {
    const id = removeBtn.dataset.id;
    midterm.risks = (midterm.risks || []).filter(r => r.id !== id);
    renderStep(midterm.currentStep);
    saveMidtermForDashboard();
    return;
  }

  if (t.id === "addWinsRow" || t.closest("#addWinsRow")) {
    addListRow("wins", true);
    return;
  }

  if (t.id === "addLearningsRow" || t.closest("#addLearningsRow")) {
    addListRow("learnings", true);
    return;
  }

  if (t.id === "addNextStepsRow" || t.closest("#addNextStepsRow")) {
    addListRow("nextSteps", true);
    return;
  }

  const removeWins = t.closest('[data-type="remove-wins"]');
  if (removeWins) {
    const idx = parseInt(removeWins.dataset.index, 10);
    removeListItem("wins", idx);
    return;
  }

  const removeLearnings = t.closest('[data-type="remove-learnings"]');
  if (removeLearnings) {
    const idx = parseInt(removeLearnings.dataset.index, 10);
    removeListItem("learnings", idx);
    return;
  }

  const removeNextSteps = t.closest('[data-type="remove-nextSteps"]');
  if (removeNextSteps) {
    const idx = parseInt(removeNextSteps.dataset.index, 10);
    removeListItem("nextSteps", idx);
    return;
  }

  if (t.id === "toggleMidtermMeta") {
    midterm.metaExpanded = !midterm.metaExpanded;
    renderStep(midterm.currentStep);
  }

  if (t.id === "midtermAddGoalBtn") {
    addMidtermInlineGoal();
    return;
  }

  if (t.id === "midtermShowAddGoalBtn") {
    const container = document.getElementById("midtermAddGoalContainer");
    if (container) {
      const isHidden = container.style.display === "none";
      container.style.display = isHidden ? "block" : "none";
      if (isHidden) {
        const input = document.getElementById("midtermNewGoalLabel");
        if (input) input.focus();
      }
    }
    return;
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

function addRiskRow(focusNew = false, fromClick = false) {
  midterm.risks.push({
    id: generateId(),
    label: "",
    selected: true,
    notes: ""
  });
  renderStep(midterm.currentStep);
  saveMidtermForDashboard();
  if (focusNew) {
    focusLastInput(".risk-label-input");
  }
}

function addMidtermInlineGoal() {
  const labelEl = document.getElementById("midtermNewGoalLabel");
  const typeEl = document.getElementById("midtermNewGoalType");
  const importanceEl = document.getElementById("midtermNewGoalImportance");
  const statusEl = document.getElementById("midtermNewGoalStatus");
  const notesEl = document.getElementById("midtermNewGoalNotes");
  const completionEl = document.getElementById("midtermNewGoalCompletionNote");

  if (!labelEl || !labelEl.value.trim()) return;

  const newGoal = {
    id: generateId(),
    label: labelEl.value.trim(),
    type: typeEl ? typeEl.value : "business",
    importance: importanceEl ? parseInt(importanceEl.value, 10) : 3,
    status: statusEl ? statusEl.value : "not-started",
    notes: notesEl ? notesEl.value : "",
    completionNote: completionEl ? completionEl.value : ""
  };

  midterm.goalStatuses = midterm.goalStatuses || [];
  midterm.goalStatuses.push(newGoal);

  if (labelEl) labelEl.value = "";
  if (notesEl) notesEl.value = "";
  if (completionEl) completionEl.value = "";
  if (typeEl) typeEl.value = "business";
  if (importanceEl) importanceEl.value = "3";
  if (statusEl) statusEl.value = "not-started";

  renderStep(midterm.currentStep);
  saveMidtermForDashboard();
}

function addListRow(key, focusNew = false) {
  const listKey = `${key}List`;
  if (!Array.isArray(midterm[listKey])) midterm[listKey] = [];
  midterm[listKey].push("");
  syncNarrativeStrings();
  renderStep(midterm.currentStep);
  saveMidtermForDashboard();
  if (focusNew) {
    focusLastInput(`[data-type="${key}-item"]`);
  }
}

function removeListItem(key, index) {
  if (index < 0 || Number.isNaN(index)) return;
  const listKey = `${key}List`;
  if (!Array.isArray(midterm[listKey])) return;
  midterm[listKey].splice(index, 1);
  syncNarrativeStrings();
  renderStep(midterm.currentStep);
  saveMidtermForDashboard();
}

function handleKeydown(e) {
  if (e.key !== "Enter") return;
  const t = e.target;
  if (!t || t.tagName !== "INPUT") return;

  const dt = t.dataset.type;
  if (dt === "risk-label") {
    e.preventDefault();
    addRiskRow(true);
    return;
  }

  if (dt === "wins-item") {
    e.preventDefault();
    addListRow("wins", true);
    return;
  }

  if (dt === "learnings-item") {
    e.preventDefault();
    addListRow("learnings", true);
    return;
  }

  if (dt === "nextSteps-item") {
    e.preventDefault();
    addListRow("nextSteps", true);
    return;
  }
}

function focusLastInput(selector) {
  setTimeout(() => {
    const inputs = document.querySelectorAll(selector);
    if (inputs.length) {
      inputs[inputs.length - 1].focus();
    }
  }, 0);
}
// Ensure dashboard opening uses localStorage handoff (avoids long URLs)
function openDashboardFromMidterm() {
  saveMidtermForDashboard();

  let kickoff = null;
  try {
    kickoff = JSON.parse(localStorage.getItem("metricMateKickoff") || "null");
  } catch (e) {
    console.warn("Could not parse metricMateKickoff for dashboard payload", e);
  }

  let midtermSnapshot = null;
  try {
    midtermSnapshot = JSON.parse(localStorage.getItem("metricMateMidterm") || "null");
  } catch (e) {
    console.warn("Could not parse metricMateMidterm for dashboard payload", e);
  }

  const info = kickoff && kickoff.info ? kickoff.info : {};
  const dir = kickoff && kickoff.directory ? kickoff.directory : {};

  const project = {
    name: midterm.info.projectName || info.projectName || info.name || "",
    summary: midterm.info.projectSummary || info.projectSummary || info.summary || "",
    client: typeof info.clientId === "number" && Array.isArray(dir.clients)
      ? dir.clients[info.clientId] || ""
      : (midterm.info.client || info.client || info.clientName || ""),
    pm: typeof info.pmId === "number" && Array.isArray(dir.pms)
      ? dir.pms[info.pmId] || ""
      : (midterm.info.pm || info.pm || info.pmName || ""),
    designer: typeof info.designerId === "number" && Array.isArray(dir.designers)
      ? dir.designers[info.designerId] || ""
      : (midterm.info.designer || info.designer || info.designerName || ""),
    dev: typeof info.devId === "number" && Array.isArray(dir.devs)
      ? dir.devs[info.devId] || ""
      : (midterm.info.dev || info.dev || info.devName || ""),
    kickoffDate: info.kickoffDate || info.date || info.startDate || (kickoff && kickoff.kickoffDate) || "",
    finalReviewDate: ""
  };

  const payload = {
    kickoff,
    midterm: midtermSnapshot || midterm,
    final: null,
    goals: (midtermSnapshot && (midtermSnapshot.goalStatuses || midtermSnapshot.goals)) || [],
    finalSummary: "",
    project
  };

  try {
    localStorage.setItem("metricMateDashboard", JSON.stringify(payload));
  } catch (e) {
    console.warn("Failed to save dashboard payload from midterm", e);
  }

  window.open("dashboard.html", "_blank", "noopener");
}

function initMidtermAIButtons() {
  const mappings = [
    { btnId: "midterm-ai-internal-btn", textareaId: "internalSummary", mode: "midterm_internal_update", stateKey: "internalSummary" },
    { btnId: "midterm-ai-client-btn", textareaId: "clientSummary", mode: "midterm_client_email", stateKey: "clientSummary" }
  ];

  const internalSectionLabels = [
    "Project Health Summary",
    "Progress Since Kickoff",
    "What’s Going Well",
    "Risks & Areas to Watch",
    "Decisions or Open Questions",
    "Next Steps",
  ];

  mappings.forEach(({ btnId, textareaId, mode, stateKey }) => {
    const btn = document.getElementById(btnId);
    const ta = document.getElementById(textareaId);
    if (!btn || !ta) return;
    if (btn.dataset.aiWired === "1") return;
    btn.dataset.aiWired = "1";

    btn.addEventListener("click", async () => {
      const originalHTML = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = "Creating...";

      const fallback = ta.dataset.original || "";
      const sourceText = (ta.value && ta.value.trim()) || fallback;

      if (!sourceText.trim()) {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        alert("No content available to rewrite yet.");
        return;
      }

      try {
        const rewritten = await rewriteMidtermWithAI({ mode, text: sourceText });
        const finalText =
          mode === "midterm_client_email"
            ? tightenMidtermText(formatMidtermClientEmail(rewritten))
            : tightenMidtermText(normalizePlainTextDraft(rewritten, internalSectionLabels));
        ta.value = finalText;
        if (stateKey) midtermSummaryState[stateKey] = finalText;
        updateMidtermCopyButtonsVisibility();
      } catch (e) {
        console.error("[AI rewrite midterm] error", e);
        alert("AI couldn’t generate a summary right now. Your existing summary is still there.");
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
      }
    });
  });
}
