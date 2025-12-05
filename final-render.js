// ===============================
// Metric Mate – Final Project Review (Render & Logic)
// ===============================

// HYDRATE FROM KICKOFF + MIDTERM
function hydrateForm() {
  const kickoff = loadKickoffData();
  const midterm = loadMidtermData();

  const info = kickoff && kickoff.info ? kickoff.info : {};
  const dir  = kickoff && kickoff.directory ? kickoff.directory : {};

  finalState.projectName =
    info.projectName || info.name || finalState.projectName;

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

  renderGoalsTable();
}

// INPUT HANDLER
function handleInput(e) {
  const t = e.target;
  const id = t.id;
  const val = t.value || "";

  if (Object.prototype.hasOwnProperty.call(finalState, id)) {
    finalState[id] = val;
  }

  if (t.dataset.type === "final-status") {
    const id = t.dataset.id;
    const goal = finalGoals.find(g => g.id === id);
    if (goal) goal.finalStatus = t.value;
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

  updateSummary();
}

// SUMMARY GENERATION
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

  if (finalGoals.length) {
    out.push("");
    out.push("Goal statuses:");
    finalGoals.forEach(g => {
      out.push(
        `• [${g.type}] ${g.label} — importance ${g.importance}; ` +
        `midterm: ${g.midtermStatus || "n/a"}${g.midtermNotes ? ` (${g.midtermNotes})` : ""}; ` +
        `final: ${g.finalStatus || "n/a"}${g.finalNotes ? ` (${g.finalNotes})` : ""}`
      );
    });
  }

  return out.join("\n");
}

function updateSummary() {
  const summaryEl = $("finalSummary");
  if (!summaryEl) return;

  const summaryText = buildFinalSummary();
  summaryEl.value = summaryText;

  saveDashboardPayload(summaryText);
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
        <tr>
          <td>${g.label || ""}</td>
          <td>${g.type || ""}</td>
          <td>${g.importance != null ? g.importance : ""}</td>
          <td>${g.midtermStatus || ""}</td>
          <td>${g.midtermNotes || ""}</td>
          <td>
            <select data-type="final-status" data-id="${g.id}">
              ${["Green", "Yellow", "Red", "Blocked"]
                .map(
                  s => `<option value="${s}" ${g.finalStatus === s ? "selected" : ""}>${s}</option>`
                )
                .join("")}
            </select>
          </td>
          <td>
            <textarea
              rows="2"
              data-type="final-notes"
              data-id="${g.id}"
              placeholder="Final notes"
            >${g.finalNotes || ""}</textarea>
          </td>
        </tr>
      `
    )
    .join("");
}

// DASHBOARD PAYLOAD + LINK
// INIT
function initFinal() {
  const form = $("finalForm");
  const copyBtn = $("copyFinalSummaryBtn");

  hydrateForm();

  if (form) {
    form.addEventListener("input", handleInput);
    form.addEventListener("change", handleInput);
  }

  updateSummary();

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const summary = $("finalSummary").value || "";
      copyToClipboard(summary);
      showStatus("✅ Final summary copied to clipboard");
    });
  }
}
