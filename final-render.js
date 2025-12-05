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
}

// INPUT HANDLER
function handleInput(e) {
  const t = e.target;
  const id = t.id;
  const val = t.value || "";

  if (Object.prototype.hasOwnProperty.call(finalState, id)) {
    finalState[id] = val;
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

  return out.join("\n");
}

function updateSummary() {
  const summaryEl = $("finalSummary");
  if (!summaryEl) return;

  const summaryText = buildFinalSummary();
  summaryEl.value = summaryText;

  updateDashboardPayload(summaryText);
}

// DASHBOARD PAYLOAD + LINK
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

  try {
    localStorage.setItem("metricMateDashboard", JSON.stringify(payload));
  } catch (e) {
    console.warn("Failed to save dashboard payload", e);
  }

  const linkEl = $("openDashboardBtn");
  if (!linkEl) return;

  const encoded = encodeURIComponent(JSON.stringify(payload));
  linkEl.href = `dashboard.html?data=${encoded}`;
}

// INIT
function initFinal() {
  const form = $("finalForm");
  const copyBtn = $("copyFinalSummaryBtn");

  hydrateForm();

  if (form) {
    form.addEventListener("input", handleInput);
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
