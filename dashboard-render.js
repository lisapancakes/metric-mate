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
        "No Project Data Found. Open This Dashboard From a Survey Page So It Can Pass in Context.";
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
  const midterm = data.midterm || {};
  const final = data.final || {};
  const finalSummary = data.finalSummary || "";
  const project = data.project || {};
  const goals = Array.isArray(data.goals) ? data.goals : [];

  console.log("[dashboard-render] kickoff object:", kickoff);
  console.log("[dashboard-render] project object:", project);

  // --- Status helpers ---
  const hasMidterm = !!(
    midterm &&
    (
      midterm.healthScore != null ||
      midterm.progressScore != null ||
      (Array.isArray(midterm.goalStatuses) && midterm.goalStatuses.length) ||
      (Array.isArray(midterm.goals) && midterm.goals.length) ||
      (Array.isArray(midterm.risks) && midterm.risks.length) ||
      (midterm.wins && midterm.wins.trim()) ||
      (midterm.learnings && midterm.learnings.trim()) ||
      (midterm.nextSteps && midterm.nextSteps.trim())
    )
  );

  const hasFinal = !!(
    final &&
    (
      (final.outcomes && final.outcomes.trim()) ||
      (final.results && final.results.trim()) ||
      (final.wins && final.wins.trim()) ||
      (final.challenges && final.challenges.trim()) ||
      (final.learnings && final.learnings.trim()) ||
      (final.nextSteps && final.nextSteps.trim())
    )
  );

  // --- Header: title, meta, dates ---
  if (titleEl) {
    titleEl.textContent = project.name || "Untitled Project";
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
      { label: `Last Updated: ${lastUpdated || "N/A"}`, color: "muted", active: true },
      {
        label: `Kickoff Completed${project.kickoffDate ? `, ${project.kickoffDate}` : ""}`,
        color: "green",
        active: !!kickoff
      },
      {
        label: hasMidterm
          ? `Midterm Completed${midterm.info && midterm.info.date ? `, ${midterm.info.date}` : ""}`
          : "Midterm Not Started",
        color: hasMidterm ? "green" : "yellow",
        active: true
      },
      {
        label: hasFinal
          ? `Final Review Completed${project.finalReviewDate ? `, ${project.finalReviewDate}` : ""}`
          : "Final Review Not Started",
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
  const goalCounterEl = document.getElementById("goalCounter");
  const updateGoalCounter = (completed = 0, total = 0) => {
    if (goalCounterEl) {
      goalCounterEl.textContent = `Completed: ${completed}/${total}`;
    }
  };
  let totalGoals = 0;
  let completedGoals = 0;

  const typeOrder = ["business", "product", "user", "pain"];

  function renderGoalsTable(rows, columns) {
    if (!dashGoalsTable) return;
    if (!rows.length) {
      dashGoalsTable.innerHTML =
        '<p class="help-text">No Goals Were Captured. Complete the Kickoff, Midterm, and Final Surveys to See a Full Lifecycle View.</p>';
      if (goalsCard) goalsCard.style.display = "block";
      return;
    }

    const headers = columns.map(c => `<th>${c.header}</th>`).join("");
    const body = rows
      .map(row => {
        const rowClass = columns.some(c => (c.className && c.className(row) === "goal-row--discard"))
          ? "goal-row--discard"
          : "";
        const cells = columns
          .map(c => {
            const cls = c.className ? c.className(row) : "";
            return `<td class="${cls}">${c.render(row)}</td>`;
          })
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    dashGoalsTable.innerHTML = `
      <table class="dash-table">
        <thead><tr>${headers}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    `;
    if (goalsCard) goalsCard.style.display = "block";
  }

  const titleCaseType = (t) => {
    if (!t) return "";
    return t.replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatStatus = (s) => {
    if (!s) return "—";
    return s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  const finalGoalsList = hasFinal
    ? [...goals]
    : [];

  if (hasFinal && dashGoalsTable) {
    const sorted = finalGoalsList.sort(
      (a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
    );

    renderGoalsTable(sorted, [
      { header: "Goal", render: (r) => r.label || "", className: (r) => r.finalStatus === "discard" || r.midtermStatus === "discard" ? "goal-row--discard" : "" },
      { header: "Type", render: (r) => titleCaseType(r.type || ""), className: (r) => r.finalStatus === "discard" || r.midtermStatus === "discard" ? "goal-row--discard" : "" },
      { header: "Importance", render: (r) => r.importance != null ? `${r.importance}/5` : "", className: (r) => r.finalStatus === "discard" || r.midtermStatus === "discard" ? "goal-row--discard" : "" },
      { header: "Midterm Status", render: (r) => formatStatus(r.midtermStatus), className: (r) => r.midtermStatus === "discard" ? "goal-row--discard" : "" },
      { header: "Midterm Notes", render: (r) => r.midtermNotes || "—", className: (r) => r.midtermStatus === "discard" ? "goal-row--discard" : "" },
      { header: "Final Status", render: (r) => formatStatus(r.finalStatus), className: (r) => r.finalStatus === "discard" ? "goal-row--discard" : "" },
      { header: "Final Notes", render: (r) => r.finalNotes || "—", className: (r) => r.finalStatus === "discard" ? "goal-row--discard" : "" }
    ]);
    totalGoals = sorted.length;
    completedGoals = sorted.filter(r => (r.finalStatus || r.midtermStatus || "").toLowerCase() === "completed").length;
    updateGoalCounter(completedGoals, totalGoals);
  } else if (hasMidterm && dashGoalsTable) {
    const list = Array.isArray(midterm.goalStatuses)
      ? [...midterm.goalStatuses]
      : Array.isArray(midterm.goals)
        ? [...midterm.goals]
        : [];
    list.sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type));

    renderGoalsTable(list, [
      { header: "Goal", render: (r) => r.label || "", className: (r) => r.status === "discard" ? "goal-row--discard" : "" },
      { header: "Type", render: (r) => titleCaseType(r.type || ""), className: (r) => r.status === "discard" ? "goal-row--discard" : "" },
      { header: "Importance", render: (r) => r.importance != null ? `${r.importance}/5` : "", className: (r) => r.status === "discard" ? "goal-row--discard" : "" },
      { header: "Status", render: (r) => formatStatus(r.status), className: (r) => r.status === "discard" ? "goal-row--discard" : "" },
      { header: "Notes", render: (r) => r.notes || "—", className: (r) => r.status === "discard" ? "goal-row--discard" : "" }
    ]);
    totalGoals = list.length;
    completedGoals = list.filter(r => (r.status || "").toLowerCase() === "completed").length;
    updateGoalCounter(completedGoals, totalGoals);
  }

  // --- Card content ---

  // If we have final data, show that (full project view)
  if (hasFinal) {
    if (summaryCard) summaryCard.style.display = "block";
    if (dashOutcomes) {
      dashOutcomes.textContent = (final.outcomes && final.outcomes.trim()) || "No Final Outcomes Captured Yet.";
    }
    if (dashResults) {
      dashResults.textContent = (final.results && final.results.trim()) || "No Final Results Captured Yet.";
    }
    if (dashWins) {
      dashWins.textContent = (final.wins && final.wins.trim()) || "No Biggest Wins Captured Yet.";
    }
    if (dashChallenges) {
      dashChallenges.textContent = (final.challenges && final.challenges.trim()) || "No Final Challenges Captured Yet.";
    }
    if (dashLearnings) {
      dashLearnings.textContent = (final.learnings && final.learnings.trim()) || "No Final Learnings Captured Yet.";
    }
    if (dashNextSteps) {
      dashNextSteps.textContent = (final.nextSteps && final.nextSteps.trim()) || "No Final Next Steps Captured Yet.";
    }
    if (dashSummaryText) {
      dashSummaryText.textContent =
        (finalSummary && finalSummary.trim()) ||
        "No Final Summary Captured Yet. Complete the Final Review Survey to Generate One.";
    }
    return;
  }

  // ---------- MIDTERM VIEW ----------
  if (hasMidterm) {
    if (summaryCard) summaryCard.style.display = "none";

    if (dashOutcomes) {
      dashOutcomes.textContent =
        midterm.healthScore != null
          ? `Project Health: ${midterm.healthScore}/5`
          : "No Data Provided During Midterm.";
    }

    if (dashResults) {
      dashResults.textContent =
        midterm.progressScore != null
          ? `Progress Confidence: ${midterm.progressScore}/5`
          : "No Data Provided During Midterm.";
    }

    if (dashWins) {
      dashWins.textContent =
        (midterm.wins && midterm.wins.trim()) ||
        "No Data Provided During Midterm.";
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
        dashChallenges.textContent = "No Data Provided During Midterm.";
      }
    }

    if (dashLearnings) {
      dashLearnings.textContent =
        (midterm.learnings && midterm.learnings.trim()) ||
        "No Data Provided During Midterm.";
    }

    if (dashNextSteps) {
      dashNextSteps.textContent =
        (midterm.nextSteps && midterm.nextSteps.trim()) ||
        "No Data Provided During Midterm.";
    }

    // Kickoff baseline placeholders suppressed in midterm view
    return;
  }

  // ---------- KICKOFF-ONLY BASELINE VIEW ----------
  // Hide narrative cards when only kickoff data exists
  const kickoffCards = [
    dashOutcomes && dashOutcomes.closest(".dash-card"),
    dashResults && dashResults.closest(".dash-card"),
    dashWins && dashWins.closest(".dash-card"),
    dashChallenges && dashChallenges.closest(".dash-card"),
    dashLearnings && dashLearnings.closest(".dash-card"),
    dashNextSteps && dashNextSteps.closest(".dash-card"),
    summaryCard
  ].filter(Boolean);
  kickoffCards.forEach(card => {
    card.style.display = "none";
  });

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
        type: "User Goal",
        importance: item.severity ?? item.currentScore ?? "—",
        notes: item.notes || ""
      })),
      ...selectedUserPains.map(item => ({
        label: item.label,
        type: "User Pain",
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
      dashGoalsTable.textContent = "No Selections Were Made During Kickoff.";
    }
    totalGoals = rows.length;
    completedGoals = 0;
    updateGoalCounter(completedGoals, totalGoals);
    if (goalsCard) goalsCard.style.display = "block";
  }

  // What we shipped → baseline business goals
  if (dashOutcomes) {
    dashOutcomes.textContent = "Not captured yet.";
  }

  // Results & Impact → product / experience goals baseline
  if (dashResults) {
    dashResults.textContent = "Not captured yet.";
  }

  // Biggest Wins → user goals we want to enable
  if (dashWins) {
    dashWins.textContent = "Not captured yet.";
  }

  // Challenges → user pains
  if (dashChallenges) {
    dashChallenges.textContent = "Not captured yet.";
  }

  // Key Learnings → explanation
  if (dashLearnings) {
    dashLearnings.textContent = "Not captured yet.";
  }

  // Next Steps → explanation
  if (dashNextSteps) {
    dashNextSteps.textContent = "Not captured yet.";
  }

  // Full Final Summary → placeholder
  if (dashSummaryText) {
    dashSummaryText.textContent =
      "Kickoff-Only View: Final Narrative Summary Will Appear Here Once the Final Review Survey Is Completed.";
  }
}
