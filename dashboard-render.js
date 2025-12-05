// =====================================
// Metric Mate – Dashboard Rendering
// Responsibilities:
//  - Render dashboard UI from normalized data
//  - Handle kickoff-only and full project views
// =====================================

function renderDashboard(rawData) {
  const app = document.getElementById("app"); // mostly unused now, but we clear it
  const errorPanel = document.getElementById("errorPanel");
  const emptyState = document.getElementById("dashboardEmpty");
  const dashboardContent = document.getElementById("dashboardContent");
  const dashGoalsTable = document.getElementById("dashGoalsTable");
  const goalsCard = dashGoalsTable ? dashGoalsTable.closest(".dash-card") : null;

  const titleEl = document.getElementById("dashboardProjectTitle");
  const statusListEl = document.getElementById("statusList");
  const metaListEl = document.getElementById("metaList");

  const dashOutcomes = document.getElementById("dashOutcomes");
  const dashResults = document.getElementById("dashResults");
  const dashWins = document.getElementById("dashWins");
  const dashChallenges = document.getElementById("dashChallenges");
  const dashLearnings = document.getElementById("dashLearnings");
  const dashNextSteps = document.getElementById("dashNextSteps");
  const dashSummaryText = document.getElementById("dashSummaryText");
  const summaryCard = dashSummaryText ? dashSummaryText.closest(".dash-card") : null;

  if (app) app.innerHTML = "";

  // Normalised data (for project meta, final, etc.)
  const data = normalizeDashboardData(rawData);

  console.log("DASHBOARD DATA:", rawData);

  // Require at least kickoff or project data; otherwise show empty state
  if (!data || (!data.project && !data.kickoff)) {
    if (errorPanel) {
      errorPanel.style.display = "block";
      errorPanel.textContent =
        "No project data found. Open this dashboard from a survey page so it can pass in context.";
    }
    if (dashboardContent) dashboardContent.style.display = "none";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (errorPanel) {
    errorPanel.style.display = "none";
    errorPanel.textContent = "";
  }

  if (emptyState) emptyState.style.display = "none";
  if (dashboardContent) dashboardContent.style.display = "grid";

  // Prefer normalised kickoff, but also keep a direct reference to the raw one
  const kickoff = data.kickoff || (rawData && rawData.kickoff) || null;
  const midterm = data.midterm;
  const final = data.final || {};
  const finalSummary = data.finalSummary || "";
  const project = data.project || {};

  console.log("[dashboard-render] kickoff object:", kickoff);
  console.log("[dashboard-render] project object:", project);

  // --- Status helpers ---
  const hasMidterm = !!(
    midterm &&
    (
      midterm.healthScore != null ||
      midterm.progressScore != null ||
      (Array.isArray(midterm.goalStatuses) && midterm.goalStatuses.length) ||
      (Array.isArray(midterm.risks) && midterm.risks.length) ||
      (midterm.wins && midterm.wins.trim()) ||
      (midterm.learnings && midterm.learnings.trim()) ||
      (midterm.nextSteps && midterm.nextSteps.trim())
    )
  );

  const hasFinal = !!(
    final &&
    (
      final.outcomes ||
      final.results ||
      final.wins ||
      final.challenges ||
      final.learnings ||
      final.nextSteps
    )
  );

  // --- Header: title, meta, dates ---
  if (titleEl) {
    titleEl.textContent = project.name || "Untitled project";
  }

  // Status list with traffic lights
  if (statusListEl) {
    const lastUpdated =
      (kickoff && kickoff.lastUpdated) ||
      (kickoff && kickoff.info && kickoff.info.lastUpdated) ||
      (kickoff && kickoff.kickoffDate) ||
      (project && project.kickoffDate) ||
      null;

    const statuses = [
      { label: `Last updated: ${lastUpdated || "N/A"}`, color: "muted", active: true },
      { label: "Kickoff completed", color: "green", active: !!kickoff },
      {
        label: hasMidterm ? "Midterm completed" : "Midterm not started",
        color: hasMidterm ? "green" : "yellow",
        active: true
      },
      {
        label: hasFinal ? "Final Review completed" : "Final Review not started",
        color: hasFinal ? "green" : "yellow",
        active: true
      }
    ];

    statusListEl.innerHTML = statuses
      .filter(s => s.active)
      .map(
        s => `
          <div class="status-item">
            <span class="status-dot status-dot--${s.color}"></span>
            <span>${s.label}</span>
          </div>
        `
      )
      .join("");
  }

  // Meta list stacked vertically
  if (metaListEl) {
    const items = [];
    if (project.client) items.push(`Client: ${project.client}`);
    if (project.pm) items.push(`PM: ${project.pm}`);
    if (project.designer) items.push(`Designer: ${project.designer}`);
    if (project.dev) items.push(`Dev: ${project.dev}`);
    if (project.kickoffDate) items.push(`Kickoff: ${project.kickoffDate}`);
    if (project.finalReviewDate && hasFinal) {
      items.push(`Final Review: ${project.finalReviewDate}`);
    }

    metaListEl.innerHTML = items
      .map(item => `<div class="meta-item">${item}</div>`)
      .join("");
  }

  // --- Goals table (prefer midterm.goalStatuses) ---
  if (goalsCard) goalsCard.style.display = "none";
  if (dashGoalsTable) dashGoalsTable.innerHTML = "";

  const typeOrder = ["business", "product", "user", "pain"];
  if (hasMidterm && dashGoalsTable) {
    const list = Array.isArray(midterm.goalStatuses) ? [...midterm.goalStatuses] : [];
    list.sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type));

    if (list.length) {
      const tableHtml = [
        '<table class="dash-table">',
        '<thead><tr><th>Goal</th><th>Type</th><th>Importance</th><th>Status</th><th>Notes</th></tr></thead>',
        '<tbody>',
        ...list.map(item => `
          <tr>
            <td>${item.label || ""}</td>
            <td>${item.type || ""}</td>
            <td>${item.importance != null ? item.importance : ""}</td>
            <td>${item.status || ""}</td>
            <td>${item.notes || ""}</td>
          </tr>
        `),
        "</tbody></table>"
      ].join("");
      dashGoalsTable.innerHTML = tableHtml;
      if (goalsCard) goalsCard.style.display = "block";
    }
  }

  // --- Card content ---

  // If we have final data, show that (full project view)
  if (hasFinal) {
    if (summaryCard) summaryCard.style.display = "block";
    if (dashOutcomes) {
      dashOutcomes.textContent = final.outcomes || "No data available yet.";
    }
    if (dashResults) {
      dashResults.textContent = final.results || "No data available yet.";
    }
    if (dashWins) {
      dashWins.textContent = final.wins || "No data available yet.";
    }
    if (dashChallenges) {
      dashChallenges.textContent = final.challenges || "No data available yet.";
    }
    if (dashLearnings) {
      dashLearnings.textContent = final.learnings || "No data available yet.";
    }
    if (dashNextSteps) {
      dashNextSteps.textContent = final.nextSteps || "No data available yet.";
    }
    if (dashSummaryText) {
      dashSummaryText.textContent =
        finalSummary ||
        "No final summary captured yet. Complete the Final Review survey to generate one.";
    }
    return;
  }

  // ---------- MIDTERM VIEW ----------
  if (hasMidterm) {
    if (summaryCard) summaryCard.style.display = "none";

    if (dashOutcomes) {
      dashOutcomes.textContent =
        midterm.healthScore != null
          ? `Project health: ${midterm.healthScore}/5`
          : "No data provided during midterm.";
    }

    if (dashResults) {
      dashResults.textContent =
        midterm.progressScore != null
          ? `Progress confidence: ${midterm.progressScore}/5`
          : "No data provided during midterm.";
    }

    if (dashWins) {
      dashWins.textContent =
        (midterm.wins && midterm.wins.trim()) ||
        "No data provided during midterm.";
    }

    if (dashChallenges) {
      const risksList = Array.isArray(midterm.risks)
        ? midterm.risks.filter(r => (r.selected ?? true) && (r.label || r.notes))
        : [];
      if (risksList.length) {
        dashChallenges.textContent = risksList
          .map(r => `${r.label || ""}${r.notes ? ` — ${r.notes}` : ""}`)
          .join(" • ");
      } else if (typeof midterm.risks === "string" && midterm.risks.trim()) {
        dashChallenges.textContent = midterm.risks.trim();
      } else {
        dashChallenges.textContent = "No data provided during midterm.";
      }
    }

    if (dashLearnings) {
      dashLearnings.textContent =
        (midterm.learnings && midterm.learnings.trim()) ||
        "No data provided during midterm.";
    }

    if (dashNextSteps) {
      dashNextSteps.textContent =
        (midterm.nextSteps && midterm.nextSteps.trim()) ||
        "No data provided during midterm.";
    }

    // Kickoff baseline placeholders suppressed in midterm view
    return;
  }

  // ---------- KICKOFF-ONLY BASELINE VIEW ----------

  // Helper to safely pull an array from kickoff (supports a couple of shapes)
  function getKickoffArray(propName) {
    if (!kickoff) return [];
    if (Array.isArray(kickoff[propName])) return kickoff[propName];

    if (kickoff.goals && Array.isArray(kickoff.goals[propName])) {
      return kickoff.goals[propName];
    }

    return [];
  }

  const kickoffBusinessGoals = getKickoffArray("businessGoals");
  const kickoffProductGoals = getKickoffArray("productGoals");
  const kickoffUserGoals = getKickoffArray("userGoals");
  const kickoffUserPains = getKickoffArray("userPains");

  const selectedBusinessGoals = kickoffBusinessGoals.filter(g => g.selected);
  const selectedProductGoals = kickoffProductGoals.filter(g => g.selected);
  const selectedUserGoals = kickoffUserGoals.filter(g => g.selected);
  const selectedUserPains = kickoffUserPains.filter(p => p.selected);
  console.log("SELECTED PRODUCT GOALS:", selectedProductGoals);
  console.log("SELECTED USER GOALS:", selectedUserGoals);
  console.log("SELECTED USER PAINS:", selectedUserPains);

  // Render selected goals into the kickoff card table (full-width)
  if (dashGoalsTable) {
    const rows = [
      ...selectedBusinessGoals.map(item => ({
        label: item.label,
        type: "Business",
        importance: item.currentScore ?? item.severity ?? "—",
        notes: item.notes || ""
      })),
      ...selectedProductGoals.map(item => ({
        label: item.label,
        type: "Product",
        importance: item.currentScore ?? item.severity ?? "—",
        notes: item.notes || ""
      })),
      ...selectedUserGoals.map(item => ({
        label: item.label,
        type: "User goal",
        importance: item.severity ?? item.currentScore ?? "—",
        notes: item.notes || ""
      })),
      ...selectedUserPains.map(item => ({
        label: item.label,
        type: "User pain",
        importance: item.severity ?? item.currentScore ?? "—",
        notes: item.notes || ""
      }))
    ];

    if (rows.length) {
      const tableHtml = [
        '<table class="dash-table"><colgroup>',
        '<col style="width:45%">',
        '<col style="width:18%">',
        '<col style="width:12%">',
        '<col style="width:25%">',
        '</colgroup><thead>',
        '<tr><th>Goal</th><th>Type</th><th>Importance</th><th>Kickoff Notes</th></tr>',
        '</thead><tbody>',
        ...rows.map(r => `
          <tr>
            <td style="white-space: normal;">${r.label}</td>
            <td>${r.type}</td>
            <td style="text-align:center;">${r.importance}</td>
            <td style="white-space: normal;">${r.notes || "—"}</td>
          </tr>
        `),
        '</tbody></table>'
      ].join("");
      dashGoalsTable.innerHTML = tableHtml;
    } else {
      dashGoalsTable.textContent = "No selections were made during kickoff.";
    }
  }

  // What we shipped → baseline business goals
  if (dashOutcomes) {
    if (selectedBusinessGoals.length) {
      const labels = selectedBusinessGoals.map(g => g.label).join(", ");
      dashOutcomes.textContent = `Baseline business focus at kickoff: ${labels}.`;
    } else {
      dashOutcomes.textContent =
        "No business goals were selected during kickoff.";
    }
  }

  // Results & Impact → product / experience goals baseline
  if (dashResults) {
    if (selectedProductGoals.length) {
      const labels = selectedProductGoals.map(g => g.label).join(", ");
      dashResults.textContent =
        `Baseline product / experience focus at kickoff: ${labels}. ` +
        "Results & impact will be captured at Midterm and Final review.";
    } else {
      dashResults.textContent =
        "No product / experience goals were selected during kickoff.";
    }
  }

  // Biggest Wins → user goals we want to enable
  if (dashWins) {
    if (selectedUserGoals.length) {
      const labels = selectedUserGoals.map(g => g.label).join(", ");
      dashWins.textContent =
        `Key user wins we’re aiming for: ${labels}. ` +
        "Future surveys will confirm if we achieved them.";
    } else {
      dashWins.textContent = "No user goals were selected during kickoff.";
    }
  }

  // Challenges → user pains
  if (dashChallenges) {
    if (selectedUserPains.length) {
      const labels = selectedUserPains.map(p => p.label).join(", ");
      dashChallenges.textContent =
        `User pain points we’re targeting: ${labels}.`;
    } else {
      dashChallenges.textContent =
        "No user pain points were captured during kickoff.";
    }
  }

  // Key Learnings → explanation
  if (dashLearnings) {
    dashLearnings.textContent =
      "Midterm and Final surveys will capture learnings over time. For now, this is a kickoff-only baseline.";
  }

  // Next Steps → explanation
  if (dashNextSteps) {
    dashNextSteps.textContent =
      "Use this baseline to plan next steps. Once you complete the Midterm and Final reviews, this dashboard will show progress and outcomes over the full project lifecycle.";
  }

  // Full Final Summary → placeholder
  if (dashSummaryText) {
    dashSummaryText.textContent =
      "Kickoff-only view: final narrative summary will appear here once the Final Review survey is completed.";
  }
}
