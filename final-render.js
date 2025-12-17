// ===============================
// Metric Mate – Final Project Review (Render & Logic)
// ===============================

const titleCaseTypeFinal = (t) => (t ? t.replace(/\b\w/g, (c) => c.toUpperCase()) : "");
const formatFinalStatus = (value) =>
  value ? value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";
const finalFlow = { currentStep: 1, totalSteps: 3 };
const finalPrevBtn = $("prevBtn");
const finalNextBtn = $("nextBtn");
const finalProgressBar = $("progressBar");
const FINAL_AI_BASE =
  window.location.protocol === "file:" ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3001"
    : "";
const finalAIModel = "gpt-4o-mini";

function cleanFinalOutput(text = "") {
  const lines = (text || "").split("\n");
  const cleaned = [];
  lines.forEach((line) => {
    let l = (line || "").trim();
    if (!l) {
      cleaned.push("");
      return;
    }
    l = l.replace(/^#+\s*/, ""); // strip markdown headings
    l = l.replace(/\*\*(.*?)\*\*/g, "$1"); // remove bold markers
    const bulletMatch = l.match(/^([-*•]|\d+\.)\s+(.*)$/);
    if (bulletMatch) {
      l = `  • ${bulletMatch[2].trim()}`;
    }
    cleaned.push(l);
  });

  // collapse multiple blanks
  const collapsed = [];
  cleaned.forEach((l) => {
    if (l === "" && collapsed[collapsed.length - 1] === "") return;
    collapsed.push(l);
  });
  return collapsed.join("\n").trim();
}

function tightenFinalText(text = "") {
  const lines = (text || "").split("\n");
  const cleaned = [];
  let prevWasHeading = false;
  for (let i = 0; i < lines.length; i++) {
    const curr = (lines[i] || "").replace(/\s+$/, "");
    const isHeading =
      curr &&
      !/^\s*•/.test(curr) &&
      !/^\s*[-*]/.test(curr) &&
      !/^\s{2,}•/.test(curr);
    // Skip blank lines immediately following headings
    if (prevWasHeading && curr === "") {
      prevWasHeading = false;
      continue;
    }
    cleaned.push(curr);
    prevWasHeading = isHeading;
  }

  // Collapse consecutive blank lines, keeping single separators between sections
  const collapsed = [];
  cleaned.forEach((l) => {
    if (l === "" && collapsed[collapsed.length - 1] === "") return;
    collapsed.push(l);
  });
  return collapsed.join("\n").trim();
}

function formatFinalClientEmail(aiText) {
  const client =
    finalState.client && finalState.client.trim() ? finalState.client.trim() : "there";
  const pmName = finalState.pm && finalState.pm.trim() ? finalState.pm.trim() : "";
  const pmLower = pmName.toLowerCase();
  const sectionLabels = new Set([
    "What We Worked On:",
    "Where We Landed:",
    "Next Steps / Recommendations:",
  ]);

  const cleanedLines = (aiText || "")
    .split("\n")
    .map((l) => l.trim())
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
    .map((t) => t.replace(/\*\*/g, "")) // strip markdown bold like **Heading**
    .map((t) => t.replace(/^\-\s+/, "• ")); // normalize dash bullets to •

  // Normalize spacing for an email-ready body:
  const formattedBodyLines = [];
  let prevWasBlank = false;

  cleanedLines.forEach((line, idx) => {
    const isSectionLabel = sectionLabels.has(line);
    const isBullet = /^[-•]/.test(line);
    const isBulletedSubheading = /^•\s+.+:\s*$/.test(line);
    const normalizedLine = isBulletedSubheading ? line.replace(/^•\s+/, "") : line;
    const isSubheading =
      !isSectionLabel && /.+:\s*$/.test(normalizedLine) && !/^[-•]/.test(normalizedLine);

    // Ensure blank line before known section labels for readability
    if (isSectionLabel && !prevWasBlank && formattedBodyLines.length > 0) {
      formattedBodyLines.push("");
      prevWasBlank = true;
    }

    // Ensure blank line before subheadings like "Business Goals:" within a section
    if (isSubheading && !prevWasBlank && formattedBodyLines.length > 0) {
      formattedBodyLines.push("");
      prevWasBlank = true;
    }

    formattedBodyLines.push(normalizedLine);
    prevWasBlank = normalizedLine === "";

    const next = cleanedLines[idx + 1];
    const nextIsBullet = next ? /^[-•]/.test(next) : false;
    const nextIsBulletedSubheading = next ? /^•\s+.+:\s*$/.test(next) : false;
    const nextNormalizedLine =
      next && nextIsBulletedSubheading ? next.replace(/^•\s+/, "") : next;
    const nextIsSectionLabel = next ? sectionLabels.has(next) : false;
    const nextIsSubheading = nextNormalizedLine
      ? !nextIsSectionLabel &&
        /.+:\s*$/.test(nextNormalizedLine) &&
        !/^[-•]/.test(nextNormalizedLine)
      : false;

    // If current block ends (heading + bullets) and next is heading or paragraph, insert blank line
    if (isBullet && !nextIsBullet && next) {
      formattedBodyLines.push("");
      prevWasBlank = true;
    }
    if (!isBullet && !isSectionLabel && nextIsSectionLabel) {
      formattedBodyLines.push("");
      prevWasBlank = true;
    }
    if (!isBullet && !isSectionLabel && !isSubheading && nextIsSubheading) {
      formattedBodyLines.push("");
      prevWasBlank = true;
    }
  });

  // Collapse accidental multiple blanks
  const collapsed = [];
  formattedBodyLines.forEach((line) => {
    if (line === "" && collapsed[collapsed.length - 1] === "") return;
    collapsed.push(line);
  });

  const body = collapsed.join("\n").trim();

  const signature =
    pmName && pmName.trim()
      ? `Best,\n${pmName} & the Thinklogic Team`
      : `Best,\nThe Thinklogic Team`;

  const parts = [];
  parts.push(`Hi ${client} Team,`);
  if (body) {
    parts.push("");
    parts.push(body);
  }
  parts.push("");
  parts.push(signature);

  return parts.join("\n");
}

function buildProjectContext() {
  const parts = [];
  if (finalState.projectName) parts.push(`Project: ${finalState.projectName}`);
  if (finalState.client) parts.push(`Client: ${finalState.client}`);
  if (finalState.pm) parts.push(`PM: ${finalState.pm}`);
  if (finalState.designer) parts.push(`Designer: ${finalState.designer}`);
  if (finalState.dev) parts.push(`Dev: ${finalState.dev}`);
  return parts.join(" | ");
}

// HYDRATE FROM KICKOFF + MIDTERM
function hydrateForm() {
  const kickoff = loadKickoffData();
  const midterm = loadMidtermData();

  const info = kickoff && kickoff.info ? kickoff.info : {};
  const dir  = kickoff && kickoff.directory ? kickoff.directory : {};

  finalState.projectName =
    info.projectName || info.name || finalState.projectName;
  finalState.projectSummary =
    info.projectSummary || info.summary || finalState.projectSummary;

  if (typeof info.clientId === "number" && Array.isArray(dir.clients)) {
    finalState.client = dir.clients[info.clientId] || finalState.client;
  } else {
    finalState.client =
      info.client || info.clientName || finalState.client;
  }

  if (typeof info.pmId === "number" && Array.isArray(dir.pms)) {
    finalState.pm = dir.pms[info.pmId] || finalState.pm;
  } else {
    finalState.pm = info.pm || info.pmName || finalState.pm;
  }

  if (typeof info.designerId === "number" && Array.isArray(dir.designers)) {
    finalState.designer =
      dir.designers[info.designerId] || finalState.designer;
  } else {
    finalState.designer =
      info.designer || info.designerName || finalState.designer;
  }

  if (typeof info.devId === "number" && Array.isArray(dir.devs)) {
    finalState.dev = dir.devs[info.devId] || finalState.dev;
  } else {
    finalState.dev = info.dev || info.devName || finalState.dev;
  }

  if (midterm && midterm.info && midterm.info.date && !finalState.date) {
    finalState.date = midterm.info.date;
  }

  // Narrative lists hydration
  if (!Array.isArray(finalState.outcomesList) || !finalState.outcomesList.length) {
    finalState.outcomesList = finalState.outcomes
      ? finalState.outcomes.split(/\n+/).map(s => s.trim()).filter(Boolean)
      : [];
  }
  if (!Array.isArray(finalState.resultsList) || !finalState.resultsList.length) {
    finalState.resultsList = finalState.results
      ? finalState.results.split(/\n+/).map(s => s.trim()).filter(Boolean)
      : [];
  }
  if (!Array.isArray(finalState.winsList) || !finalState.winsList.length) {
    finalState.winsList = finalState.wins
      ? finalState.wins.split(/\n+/).map(s => s.trim()).filter(Boolean)
      : [];
  }
  if (!Array.isArray(finalState.challengesList) || !finalState.challengesList.length) {
    finalState.challengesList = finalState.challenges
      ? finalState.challenges.split(/\n+/).map(s => s.trim()).filter(Boolean)
      : [];
  }
  if (!Array.isArray(finalState.learningsList) || !finalState.learningsList.length) {
    finalState.learningsList = finalState.learnings
      ? finalState.learnings.split(/\n+/).map(s => s.trim()).filter(Boolean)
      : [];
  }
  if (!Array.isArray(finalState.nextStepsList) || !finalState.nextStepsList.length) {
    finalState.nextStepsList = finalState.nextSteps
      ? finalState.nextSteps.split(/\n+/).map(s => s.trim()).filter(Boolean)
      : [];
  }

  // Build goals list from kickoff + midterm
  finalGoals = normalizeGoalsFromKickoff(kickoff, midterm).map(g => {
    const existing = finalGoals.find(fg => fg.id === g.id);
    return existing ? { ...g, finalStatus: existing.finalStatus || "", finalNotes: existing.finalNotes || "" } : g;
  });

  const projectInput = $("projectName");
  if (projectInput) projectInput.value = finalState.projectName;

  const clientInput = $("client");
  if (clientInput) clientInput.value = finalState.client;

  const pmInput = $("pm");
  if (pmInput) pmInput.value = finalState.pm;

  const designerInput = $("designer");
  if (designerInput) designerInput.value = finalState.designer;

  const devInput = $("dev");
  if (devInput) devInput.value = finalState.dev;

  const dateInput = $("date");
  if (dateInput) dateInput.value = finalState.date;

  const metaFields = $("finalMetaFields");
  if (metaFields) {
    metaFields.style.display = finalMetaExpanded ? "grid" : "none";
  }

  updateFinalMetaSummary();
  renderGoalsTable();
  renderFinalNarrativeFields();
}

// INPUT HANDLER
function handleInput(e) {
  const t = e.target;
  const id = t.id;
  const val = t.value || "";

  if (Object.prototype.hasOwnProperty.call(finalState, id)) {
    finalState[id] = val;
    if (["projectName", "client", "pm", "designer", "dev"].includes(id)) {
      updateFinalMetaSummary();
    }
    if (id === "finalClientSummary") {
      updateFinalCopyButtonsVisibility();
    }
  }

  if (t.dataset.type === "final-status") {
    const id = t.dataset.id;
    const goal = finalGoals.find(g => g.id === id);
    if (goal) {
      goal.finalStatus = t.value;
      const row = t.closest("tr");
      if (row) {
        const completionField = row.querySelector('textarea[data-type="final-completion-note"]');
        const completionHelp = row.querySelector("p.help-text");
        const shouldShow = t.value === "completed";
        if (completionField) completionField.style.display = shouldShow ? "block" : "none";
        if (completionHelp) completionHelp.style.display = shouldShow ? "block" : "none";
      }
    }
    updateSummary();
    return;
  }

  if (t.dataset.type === "final-notes") {
    const id = t.dataset.id;
    const goal = finalGoals.find(g => g.id === id);
    if (goal) goal.finalNotes = val;
    updateSummary();
    return;
  }

  if (t.dataset.type === "final-completion-note") {
    const id = t.dataset.id;
    const goal = finalGoals.find(g => g.id === id);
    if (goal) goal.completionNote = val;
    updateSummary();
    return;
  }

  if (t.dataset.type === "outcomes-item") {
    const idx = parseInt(t.dataset.index, 10);
    if (!Number.isNaN(idx)) {
      finalState.outcomesList[idx] = val;
      syncFinalNarrativeStrings();
    }
  }

  if (t.dataset.type === "results-item") {
    const idx = parseInt(t.dataset.index, 10);
    if (!Number.isNaN(idx)) {
      finalState.resultsList[idx] = val;
      syncFinalNarrativeStrings();
    }
  }

  if (t.dataset.type === "wins-item") {
    const idx = parseInt(t.dataset.index, 10);
    if (!Number.isNaN(idx)) {
      finalState.winsList[idx] = val;
      syncFinalNarrativeStrings();
    }
  }

  if (t.dataset.type === "challenges-item") {
    const idx = parseInt(t.dataset.index, 10);
    if (!Number.isNaN(idx)) {
      finalState.challengesList[idx] = val;
      syncFinalNarrativeStrings();
    }
  }

  if (t.dataset.type === "learnings-item") {
    const idx = parseInt(t.dataset.index, 10);
    if (!Number.isNaN(idx)) {
      finalState.learningsList[idx] = val;
      syncFinalNarrativeStrings();
    }
  }

  if (t.dataset.type === "nextSteps-item") {
    const idx = parseInt(t.dataset.index, 10);
    if (!Number.isNaN(idx)) {
      finalState.nextStepsList[idx] = val;
      syncFinalNarrativeStrings();
    }
  }

  if (id === "finalSummary") {
    finalSummaryState.finalSummary = val;
  }
  if (id === "finalClientSummary") {
    finalSummaryState.finalClientSummary = val;
  }

  updateSummary();
  updateFinalCopyButtonsVisibility();
}

// SUMMARY GENERATION
function buildFinalSummary() {
  const s = finalState;
  let out = [];

  out.push("FINAL PROJECT REVIEW — INTERNAL");
  out.push("--------------------------------");
  out.push(`Project: ${s.projectName || "Untitled Project"}`);
  if (s.client) out.push(`Client: ${s.client}`);
  if (s.pm) out.push(`PM: ${s.pm}`);
  if (s.designer) out.push(`Product Designer: ${s.designer}`);
  if (s.dev) out.push(`Lead Developer: ${s.dev}`);
  if (s.date) out.push(`Final Review Date: ${s.date}`);
  out.push("");

  if (s.outcomes.trim()) {
    out.push("What We Shipped:");
    out.push(s.outcomes.trim(), "");
  }
  if (s.results.trim()) {
    out.push("Results / Impact:");
    out.push(s.results.trim(), "");
  }
  if (s.wins.trim()) {
    out.push("Biggest Wins:");
    out.push(s.wins.trim(), "");
  }
  if (s.challenges.trim()) {
    out.push("Challenges / Misses:");
    out.push(s.challenges.trim(), "");
  }
  if (s.learnings.trim()) {
    out.push("Key Learnings:");
    out.push(s.learnings.trim(), "");
  }
  if (s.nextSteps.trim()) {
    out.push("Next Steps / Follow-Ups:");
    out.push(s.nextSteps.trim());
  }

  if (finalGoals.length) {
    out.push("");
    out.push("Goal Statuses:");
    finalGoals.forEach(g => {
      out.push(
        `• [${titleCaseTypeFinal(g.type)}] ${g.label} — Importance ${g.importance}; ` +
        `Midterm: ${formatFinalStatus(g.midtermStatus || "N/A")}${g.midtermNotes ? ` (${g.midtermNotes})` : ""}; ` +
        `Final: ${formatFinalStatus(g.finalStatus || "N/A")}${g.finalNotes ? ` (${g.finalNotes})` : ""}`
      );
    });
  }

  return out.join("\n");
}

function updateSummary() {
  const summaryEl = $("finalSummary");
  if (!summaryEl) return;

  const summaryText = buildFinalSummary();
  if (!finalSummaryState.finalSummary) finalSummaryState.finalSummary = "";
  summaryEl.dataset.original = summaryText;
  if (summaryEl.dataset.aiFilled === "true") {
    // Preserve AI-generated text
  } else {
    summaryEl.value = finalSummaryState.finalSummary || "";
  }

  const clientEl = $("finalClientSummary");
  if (clientEl) {
    const clientDefault = clientEl.dataset.original || "";
    if (!finalSummaryState.finalClientSummary) {
      finalSummaryState.finalClientSummary = "";
    }
    if (clientEl.dataset.aiFilled === "true") {
      // keep AI text
    } else {
      const currentVal = finalSummaryState.finalClientSummary || "";
      const needsWrap = currentVal && !/^Hi\s+.+\sTeam,/.test(currentVal);
      const wrapped = needsWrap ? formatFinalClientEmail(currentVal) : currentVal;
      if (needsWrap) {
        finalSummaryState.finalClientSummary = wrapped;
      }
      clientEl.value = wrapped;
    }
  }

  saveDashboardPayload(summaryText);
  updateFinalCopyButtonsVisibility();
}

// NAVIGATION HELPERS
function updateFinalProgressBar() {
  if (!finalProgressBar) return;
  const progress =
    ((finalFlow.currentStep - 1) / (finalFlow.totalSteps - 1)) * 100;
  finalProgressBar.style.width = `${progress}%`;
}

function updateFinalNav() {
  if (finalPrevBtn) {
    finalPrevBtn.disabled = finalFlow.currentStep === 1;
    finalPrevBtn.style.display = finalFlow.currentStep === 1 ? "none" : "inline-flex";
  }
  const dashboardBtn = $("openDashboardBtn");
  if (finalNextBtn) {
    if (finalFlow.currentStep === finalFlow.totalSteps) {
      finalNextBtn.style.display = "none";
      finalNextBtn.disabled = true;
    } else {
      finalNextBtn.style.display = "inline-flex";
      finalNextBtn.disabled = false;
      finalNextBtn.textContent =
        finalFlow.currentStep === finalFlow.totalSteps - 1 ? "Finish" : "Next";
    }
  }
  if (dashboardBtn) {
    dashboardBtn.style.display =
      finalFlow.currentStep === finalFlow.totalSteps ? "inline-flex" : "none";
  }
}

function showFinalStep(step) {
  finalFlow.currentStep = step;
  const sections = document.querySelectorAll("[data-step]");
  sections.forEach((section) => {
    const secStep = parseInt(section.getAttribute("data-step"), 10);
    section.style.display = secStep === step ? "" : "none";
  });

  updateFinalNav();
  updateFinalProgressBar();

  if (step === finalFlow.totalSteps) {
    updateSummary();
  }
}

function goToNextFinalStep() {
  if (finalFlow.currentStep < finalFlow.totalSteps) {
    showFinalStep(finalFlow.currentStep + 1);
    window.scrollTo(0, 0);
  }
}

async function triggerFinalAIRewrite({ btnId, textareaId, mode, placeholderFallback = "" }) {
  const btn = $(btnId);
  const ta = $(textareaId);
  if (!btn || !ta) return;

  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = "Creating...";

  const sourceText = (ta.value && ta.value.trim()) || placeholderFallback;
  if (!sourceText) {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
    alert("No content available to rewrite yet.");
    return;
  }

  try {
    const rewritten = await fetch(`${FINAL_AI_BASE}/api/rewrite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        phase: "final",
        text: sourceText,
        projectContext: buildProjectContext()
      })
    }).then(async (res) => {
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Rewrite failed: ${res.status} ${errText}`);
      }
      const data = await res.json();
      if (!data || typeof data.text !== "string") {
        throw new Error("Invalid AI response");
      }
      return data.text;
    });

    const cleaned =
      mode === "final_client_email"
        ? formatFinalClientEmail(rewritten)
        : rewritten;
    const finalText = tightenFinalText(cleanFinalOutput(cleaned));
    ta.value = finalText;
    ta.dataset.aiFilled = "true";
    if (ta.id === "finalSummary") {
      finalSummaryState.finalSummary = finalText;
    } else if (ta.id === "finalClientSummary") {
      finalSummaryState.finalClientSummary = finalText;
    }
    updateFinalCopyButtonsVisibility();
  } catch (err) {
    console.error("[AI rewrite final] error", err);
    alert("AI could not generate this text. Please try again later.");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
}

function goToPreviousFinalStep() {
  if (finalFlow.currentStep > 1) {
    showFinalStep(finalFlow.currentStep - 1);
    window.scrollTo(0, 0);
  }
}

function ensureFinalNarrativeDefaults() {
  if (!Array.isArray(finalState.outcomesList) || finalState.outcomesList.length === 0) {
    finalState.outcomesList = [""];
  }
  if (!Array.isArray(finalState.resultsList) || finalState.resultsList.length === 0) {
    finalState.resultsList = [""];
  }
  if (!Array.isArray(finalState.winsList) || finalState.winsList.length === 0) {
    finalState.winsList = [""];
  }
  if (!Array.isArray(finalState.challengesList) || finalState.challengesList.length === 0) {
    finalState.challengesList = [""];
  }
  if (!Array.isArray(finalState.learningsList) || finalState.learningsList.length === 0) {
    finalState.learningsList = [""];
  }
  if (!Array.isArray(finalState.nextStepsList) || finalState.nextStepsList.length === 0) {
    finalState.nextStepsList = [""];
  }
  syncFinalNarrativeStrings();
}

function syncFinalNarrativeStrings() {
  finalState.outcomes = (finalState.outcomesList || []).filter(Boolean).join("\n");
  finalState.results = (finalState.resultsList || []).filter(Boolean).join("\n");
  finalState.wins = (finalState.winsList || []).filter(Boolean).join("\n");
  finalState.challenges = (finalState.challengesList || []).filter(Boolean).join("\n");
  finalState.learnings = (finalState.learningsList || []).filter(Boolean).join("\n");
  finalState.nextSteps = (finalState.nextStepsList || []).filter(Boolean).join("\n");
}

function renderFinalNarrativeFields() {
  ensureFinalNarrativeDefaults();
  const container = document.querySelector('[data-step="2"] .form-grid');
  if (!container) return;

  container.innerHTML = `
    ${renderFinalListSection("What Did We Ship?", "outcomes", finalState.outcomesList, "Add a shipped feature, release, or milestone")}
    ${renderFinalListSection("Results / Impact", "results", finalState.resultsList, "Add a result, metric, or impact signal")}
    ${renderFinalListSection("Biggest Wins", "wins", finalState.winsList, "Add a key win or positive outcome")}
    ${renderFinalListSection("Challenges", "challenges", finalState.challengesList, "Add a current challenge or constraint")}
    ${renderFinalListSection("Key Learnings", "learnings", finalState.learningsList, "Add a key learning or insight")}
    ${renderFinalListSection("Next Steps / Follow-Ups", "nextSteps", finalState.nextStepsList, "Add a next step")}
  `;
}

function renderFinalListSection(title, key, items = [], placeholder = "") {
  const addLabel =
    key === "wins"
      ? "Add Win"
      : key === "challenges"
        ? "Add Challenge"
        : key === "outcomes"
          ? "Add Item"
          : key === "results"
            ? "Add Item"
        : key === "learnings"
          ? "Add Learning"
        : key === "nextSteps"
          ? "Add Next Step"
          : "Add Item";

  const rows = (items || []).map((item, idx) => `
      <div class="list-row" data-key="${key}" data-index="${idx}">
        <div class="list-label-wrapper">
          <input
            type="text"
            class="list-label-input"
            data-type="${key}-item"
            data-index="${idx}"
            placeholder="${placeholder}"
            value="${item || ""}"
          />
          <button type="button" class="icon-remove-btn" data-type="remove-${key}" data-index="${idx}" aria-label="Remove ${key}">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    `).join("");

  return `
    <div class="form-group">
      <label>${title}</label>
      <div class="list-wrapper">
        ${rows}
      </div>
      <div class="form-actions" style="margin-top:0.5rem;">
        <button type="button" class="btn btn-secondary btn-sm" id="add${capitalize(key)}Row">
          <i class="fa-solid fa-plus"></i>
          ${addLabel}
        </button>
      </div>
    </div>
  `;
}

function capitalize(str = "") {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// GOALS TABLE RENDER
function renderGoalsTable() {
  const tbody = document.getElementById("goalsTableBody");
  if (!tbody) return;

  const typeOrder = ["business", "product", "user", "pain"];
  const sorted = [...finalGoals].sort(
    (a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
  );

  tbody.innerHTML = sorted
    .map(
      (g) => `
        <tr class="${g.finalStatus === "discard" || g.midtermStatus === "discard" ? "goal-row--discard" : ""}">
          <td>${g.label || ""}</td>
          <td>${titleCaseTypeFinal(g.type || "")}</td>
          <td class="numeric">${g.importance != null ? g.importance : ""}</td>
          <td>${formatFinalStatus(g.midtermStatus || "")}</td>
          <td>
            <div class="select-wrapper">
              <select data-type="final-status" data-id="${g.id}">
                ${["not-started", "in-progress", "completed", "discard"]
                  .map(
                    s => {
                      const label = s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                      const isSelected =
                        g.finalStatus
                          ? g.finalStatus === s
                          : (g.midtermStatus === s);
                      return `<option value="${s}" ${isSelected ? "selected" : ""}>${label}</option>`;
                    }
                  )
                  .join("")}
              </select>
              <i class="fa-regular fa-solid fa-chevron-down select-chevron" aria-hidden="true"></i>
            </div>
          </td>
          <td>
            <textarea
              rows="2"
              data-type="final-notes"
              data-id="${g.id}"
              placeholder="Final Notes"
            >${g.finalNotes || ""}</textarea>
          </td>
          <td>
            <textarea
              rows="2"
              data-type="final-completion-note"
              data-id="${g.id}"
              placeholder="How did you complete this goal? What helped?"
              style="margin-top:0.35rem; display:${g.finalStatus === "completed" ? "block" : "none"};"
            >${g.completionNote || ""}</textarea>
          </td>
        </tr>
      `
    )
    .join("");

  // Add inline add-goal controls (initially hidden)
  tbody.insertAdjacentHTML("afterend", `
    <tr class="add-goal-row">
      <td colspan="7">
        <div class="add-goal-inline">
          <button type="button" class="btn btn-secondary btn-sm" id="finalShowAddGoalBtn">
            <i class="fa-solid fa-plus"></i>
            Add Goal
          </button>
          <div id="finalAddGoalContainer" style="display:none; margin-top:0.75rem;">
            <div class="form-grid">
              <div class="form-group">
                <label for="finalNewGoalLabel">Goal Label</label>
                <input type="text" id="finalNewGoalLabel" placeholder="Add a Goal for Final Tracking">
              </div>
              <div class="form-group">
                <label for="finalNewGoalType">Type</label>
                <select id="finalNewGoalType">
                  <option value="business">Business</option>
                  <option value="product">Product</option>
                  <option value="user">User</option>
                  <option value="pain">Pain</option>
                </select>
              </div>
              <div class="form-group">
                <label for="finalNewGoalImportance">Importance</label>
                <select id="finalNewGoalImportance">
                  ${[1,2,3,4,5].map(n => `<option value="${n}" ${n===3?"selected":""}>${n}</option>`).join("")}
                </select>
              </div>
              <div class="form-group">
                <label for="finalNewGoalStatus">Final Status</label>
                <select id="finalNewGoalStatus">
                ${["not-started","in-progress","completed","discard"].map(s => {
                  const label = s.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase());
                  return `<option value="${s}">${label}</option>`;
                }).join("")}
              </select>
            </div>
              <div class="form-group">
                <label for="finalNewGoalNotes">Final Notes</label>
                <textarea id="finalNewGoalNotes" rows="2"></textarea>
              </div>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="finalAddGoalBtn">
              <i class="fa-solid fa-plus"></i>
              Add Goal
            </button>
          </div>
        </div>
      </td>
    </tr>
  `);
}

// DASHBOARD PAYLOAD + LINK
// INIT
function initFinal() {
  const form = $("finalForm");
  const copyBtn = $("copyFinalSummaryBtn");
  const copyClientBtn = $("copyFinalClientSummaryBtn");

  hydrateForm();

  if (finalPrevBtn) finalPrevBtn.addEventListener("click", goToPreviousFinalStep);
  if (finalNextBtn) finalNextBtn.addEventListener("click", goToNextFinalStep);

  if (form) {
    form.addEventListener("input", handleInput);
    form.addEventListener("change", handleInput);
    form.addEventListener("click", handleClick);
    form.addEventListener("keydown", handleKeydown);
  }

  updateSummary();
  showFinalStep(finalFlow.currentStep);
  updateFinalCopyButtonsVisibility();
  initFinalCopyChips();

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const summary = $("finalSummary").value || "";
      copyToClipboard(summary);
      showStatus("Final Summary Copied to Clipboard");
    });
  }

  if (copyClientBtn) {
    copyClientBtn.addEventListener("click", () => {
      const text = $("finalClientSummary").value || "";
      copyToClipboard(text);
      showStatus("Final Client Summary Copied to Clipboard");
    });
  }
  initFinalCopyChips();
  initFinalAIButtons();
}

function handleKeydown(e) {
  if (e.key !== "Enter") return;
  const t = e.target;
  if (!t || t.tagName !== "INPUT") return;

  if (t.dataset.type === "outcomes-item") {
    e.preventDefault();
    addFinalListRow("outcomes", true);
    return;
  }
  if (t.dataset.type === "results-item") {
    e.preventDefault();
    addFinalListRow("results", true);
    return;
  }
  const dt = t.dataset.type;
  if (dt === "wins-item") {
    e.preventDefault();
    addFinalListRow("wins", true);
    return;
  }
  if (dt === "challenges-item") {
    e.preventDefault();
    addFinalListRow("challenges", true);
    return;
  }
  if (dt === "learnings-item") {
    e.preventDefault();
    addFinalListRow("learnings", true);
    return;
  }
  if (dt === "nextSteps-item") {
    e.preventDefault();
    addFinalListRow("nextSteps", true);
    return;
  }
}

function initFinalAIButtons() {
  const configs = [
    {
      id: "final-ai-summary-btn",
      textareaId: "finalSummary",
      mode: "final_internal_update",
      placeholderFallback: buildFinalSummary()
    },
    {
      id: "final-ai-client-btn",
      textareaId: "finalClientSummary",
      mode: "final_client_email",
      placeholderFallback: buildFinalSummary()
    }
  ];

  configs.forEach((cfg) => {
    const btn = $(cfg.id);
    if (!btn || btn.dataset.aiWired === "1") return;
    btn.dataset.aiWired = "1";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerFinalAIRewrite({
        btnId: cfg.id,
        textareaId: cfg.textareaId,
        mode: cfg.mode,
        placeholderFallback: cfg.placeholderFallback
      });
    });
  });
}

function updateFinalCopyButtonsVisibility() {
  const chips = document.querySelectorAll(".copy-chip");
  chips.forEach((chip) => {
    const targetId = chip.dataset.copyTarget;
    const target = $(targetId);
    if (!target) return;
    const hasContent = (target.value || "").trim().length > 0;
    chip.style.display = hasContent ? "inline-flex" : "none";
  });
}

function initFinalCopyChips() {
  const chips = document.querySelectorAll(".copy-chip");
  chips.forEach((chip) => {
    if (chip.dataset.copyWired === "1") return;
    chip.dataset.copyWired = "1";
    chip.style.display = "none";
    chip.addEventListener("click", () => {
      const targetId = chip.dataset.copyTarget;
      const target = $(targetId);
      if (!target) return;
      const val = (target.value || "").trim();
      if (!val) {
        return;
      }
      copyToClipboard(val);
      showStatus("Text Copied to Clipboard");
    });
  });
}

function handleClick(e) {
  const t = e.target;
  if (t.id === "toggleFinalMeta") {
    finalMetaExpanded = !finalMetaExpanded;
    const metaFields = $("finalMetaFields");
    if (metaFields) {
      metaFields.style.display = finalMetaExpanded ? "grid" : "none";
    }
    return;
  }

  if (t.id === "finalAddGoalBtn") {
    addFinalInlineGoal();
    return;
  }

  if (t.id === "finalShowAddGoalBtn") {
    const container = document.getElementById("finalAddGoalContainer");
    if (container) {
      const isHidden = container.style.display === "none";
      container.style.display = isHidden ? "block" : "none";
      if (isHidden) {
        const input = document.getElementById("finalNewGoalLabel");
        if (input) input.focus();
      }
    }
    return;
  }

  if (t.id === "final-ai-summary-btn") {
    triggerFinalAIRewrite({
      btnId: "final-ai-summary-btn",
      textareaId: "finalSummary",
      mode: "final_internal_update",
      placeholderFallback: buildFinalSummary()
    });
  }

  if (t.id === "final-ai-client-btn") {
    triggerFinalAIRewrite({
      btnId: "final-ai-client-btn",
      textareaId: "finalClientSummary",
      mode: "final_client_email",
      placeholderFallback: buildFinalSummary()
    });
    return;
  }

  if (t.id === "addWinsRow" || t.closest("#addWinsRow")) {
    addFinalListRow("wins", true);
    return;
  }
  if (t.id === "addChallengesRow" || t.closest("#addChallengesRow")) {
    addFinalListRow("challenges", true);
    return;
  }
  if (t.id === "addOutcomesRow" || t.closest("#addOutcomesRow")) {
    addFinalListRow("outcomes", true);
    return;
  }
  if (t.id === "addResultsRow" || t.closest("#addResultsRow")) {
    addFinalListRow("results", true);
    return;
  }
  if (t.id === "addLearningsRow" || t.closest("#addLearningsRow")) {
    addFinalListRow("learnings", true);
    return;
  }
  if (t.id === "addNextStepsRow" || t.closest("#addNextStepsRow")) {
    addFinalListRow("nextSteps", true);
    return;
  }

  const removeOutcomes = t.closest('[data-type="remove-outcomes"]');
  if (removeOutcomes) {
    const idx = parseInt(removeOutcomes.dataset.index, 10);
    removeFinalListItem("outcomes", idx);
    return;
  }

  const removeResults = t.closest('[data-type="remove-results"]');
  if (removeResults) {
    const idx = parseInt(removeResults.dataset.index, 10);
    removeFinalListItem("results", idx);
    return;
  }

  const removeWins = t.closest('[data-type="remove-wins"]');
  if (removeWins) {
    const idx = parseInt(removeWins.dataset.index, 10);
    removeFinalListItem("wins", idx);
    return;
  }
  const removeChallenges = t.closest('[data-type="remove-challenges"]');
  if (removeChallenges) {
    const idx = parseInt(removeChallenges.dataset.index, 10);
    removeFinalListItem("challenges", idx);
    return;
  }
  const removeLearnings = t.closest('[data-type="remove-learnings"]');
  if (removeLearnings) {
    const idx = parseInt(removeLearnings.dataset.index, 10);
    removeFinalListItem("learnings", idx);
    return;
  }
  const removeNextSteps = t.closest('[data-type="remove-nextSteps"]');
  if (removeNextSteps) {
    const idx = parseInt(removeNextSteps.dataset.index, 10);
    removeFinalListItem("nextSteps", idx);
    return;
  }
}

function updateFinalMetaSummary() {
  const project = document.getElementById("finalMetaProject");
  const client = document.getElementById("finalMetaClient");
  const pm = document.getElementById("finalMetaPm");
  const designer = document.getElementById("finalMetaDesigner");
  const dev = document.getElementById("finalMetaDev");

  if (project) project.textContent = finalState.projectName || "—";
  if (client) client.textContent = finalState.client || "—";
  if (pm) pm.textContent = finalState.pm || "—";
  if (designer) designer.textContent = finalState.designer || "—";
  if (dev) dev.textContent = finalState.dev || "—";
}

function addFinalInlineGoal() {
  const labelEl = document.getElementById("finalNewGoalLabel");
  const typeEl = document.getElementById("finalNewGoalType");
  const importanceEl = document.getElementById("finalNewGoalImportance");
  const statusEl = document.getElementById("finalNewGoalStatus");
  const notesEl = document.getElementById("finalNewGoalNotes");

  if (!labelEl || !labelEl.value.trim()) return;

  const newGoal = {
    id: generateId(),
    label: labelEl.value.trim(),
    type: typeEl ? typeEl.value : "business",
    importance: importanceEl ? parseInt(importanceEl.value, 10) : 3,
    midtermStatus: "",
    midtermNotes: "",
    finalStatus: statusEl ? statusEl.value : "not-started",
    finalNotes: notesEl ? notesEl.value : ""
  };

  finalGoals.push(newGoal);

  labelEl.value = "";
  if (notesEl) notesEl.value = "";
  if (typeEl) typeEl.value = "business";
  if (importanceEl) importanceEl.value = "3";
  if (statusEl) statusEl.value = "not-started";

  renderGoalsTable();
  updateSummary();
}

function addFinalListRow(key, focusNew = false) {
  const listKey = `${key}List`;
  if (!Array.isArray(finalState[listKey])) finalState[listKey] = [];
  finalState[listKey].push("");
  syncFinalNarrativeStrings();
  renderFinalNarrativeFields();
  updateSummary();
  if (focusNew) focusLastInput(`[data-type="${key}-item"]`);
}

function removeFinalListItem(key, index) {
  if (index < 0 || Number.isNaN(index)) return;
  const listKey = `${key}List`;
  if (!Array.isArray(finalState[listKey])) return;
  finalState[listKey].splice(index, 1);
  syncFinalNarrativeStrings();
  renderFinalNarrativeFields();
  updateSummary();
}

function focusLastInput(selector) {
  setTimeout(() => {
    const inputs = document.querySelectorAll(selector);
    if (inputs.length) {
      inputs[inputs.length - 1].focus();
    }
  }, 0);
}
