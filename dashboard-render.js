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
  const clientTitleEl = document.getElementById("dashboardClientTitle");
  const titleDividerEl = document.querySelector(".dashboard-title-divider");
  const projectStatusChip = document.getElementById("projectStatusChip");

  const dashOutcomes = document.getElementById("dashOutcomes");
  const dashResults = document.getElementById("dashResults");
  const dashPain = document.getElementById("dashPain");
  const dashChallenges = document.getElementById("dashChallenges");
  const dashLearnings = document.getElementById("dashLearnings");
  const dashNextSteps = document.getElementById("dashNextSteps");
  const dashSummaryText = document.getElementById("dashSummaryText");
  const summaryCard = dashSummaryText ? dashSummaryText.closest(".dash-card") : null;
  const aiHelpers = {
    outcomes: document.querySelector('[data-ai-helper-for="dashOutcomes"]'),
    results: document.querySelector('[data-ai-helper-for="dashResults"]'),
    pain: document.querySelector('[data-ai-helper-for="dashPain"]'),
    challenges: document.querySelector('[data-ai-helper-for="dashChallenges"]'),
    learnings: document.querySelector('[data-ai-helper-for="dashLearnings"]'),
    nextSteps: document.querySelector('[data-ai-helper-for="dashNextSteps"]')
  };
  const originalSections = {
    outcomes: "",
    results: "",
    pain: "",
    challenges: "",
    learnings: "",
    nextSteps: ""
  };
  const aiGeneratedState = {
    outcomes: false,
    results: false,
    pain: false,
    challenges: false,
    learnings: false,
    nextSteps: false
  };

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
  if (clientTitleEl) {
    clientTitleEl.textContent = project.client || "";
    clientTitleEl.style.display = project.client ? "inline-flex" : "none";
  }
  if (titleDividerEl) {
    titleDividerEl.style.display = project.client ? "inline-flex" : "none";
  }
  if (projectStatusChip) {
    let chipText = "Kickoff In Progress";
    let chipClass = "chip-muted";
    if (hasFinal) {
      chipText = "Completed";
      chipClass = "chip-success";
    } else if (hasMidterm) {
      chipText = "Midterm Completed";
      chipClass = "chip-info";
    } else if (kickoff) {
      chipText = "Kickoff Completed";
      chipClass = "chip-primary";
    }
    projectStatusChip.textContent = chipText;
    projectStatusChip.className = `project-status-chip ${chipClass}`;
    projectStatusChip.style.display = "inline-flex";
  }

  function helperKeyForTarget(targetId) {
    switch (targetId) {
      case "dashOutcomes":
        return "outcomes";
      case "dashPain":
        return "pain";
      case "dashResults":
        return "results";
      case "dashChallenges":
        return "challenges";
      case "dashLearnings":
        return "learnings";
      case "dashNextSteps":
        return "nextSteps";
      default:
        return null;
    }
  }

  function modeForTarget(targetId) {
    switch (targetId) {
      case "dashOutcomes":
        return null;
      case "dashResults":
        return "dashboard_results_card";
      case "dashWins":
        return null;
      case "dashChallenges":
        return "dashboard_challenges_card";
      case "dashLearnings":
        return "dashboard_learnings_card";
      case "dashNextSteps":
        return "dashboard_nextsteps_card";
      default:
        return null;
    }
  }

  function setAIHelper(key, generated) {
    const helperEl = aiHelpers[key];
    if (!helperEl) return;
    const isGenerated = generated !== undefined ? generated : aiGeneratedState[key];
    helperEl.textContent = isGenerated ? "AI-generated draft · editable" : "AI draft not generated";
  }

  function recordOriginal(key, value) {
    if (!key) return;
    if (originalSections[key]) return;
    originalSections[key] = value || "";
  }

  const listTargets = new Set([
    "dashOutcomes",
    "dashResults",
    "dashPain",
    "dashChallenges",
    "dashLearnings",
    "dashNextSteps"
  ]);
  const pastTenseTargets = new Set(["dashOutcomes"]);

  function escapeHTML(str = "") {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toPastTense(item = "") {
    const trimmed = item.trim();
    if (!trimmed) return "";
    const replacements = {
      improve: "Improved",
      improved: "Improved",
      increase: "Increased",
      increased: "Increased",
      clarify: "Clarified",
      clarified: "Clarified",
      define: "Defined",
      defined: "Defined",
      introduce: "Introduced",
      introduced: "Introduced",
      add: "Added",
      added: "Added",
      build: "Built",
      built: "Built",
      create: "Created",
      created: "Created",
      implement: "Implemented",
      implemented: "Implemented",
      launch: "Launched",
      launched: "Launched",
      ship: "Shipped",
      shipped: "Shipped",
      deliver: "Delivered",
      delivered: "Delivered",
      streamline: "Streamlined",
      streamlined: "Streamlined",
      align: "Aligned",
      aligned: "Aligned",
      organize: "Organized",
      organized: "Organized",
      simplify: "Simplified",
      simplified: "Simplified",
      refactor: "Refactored",
      refactored: "Refactored",
      update: "Updated",
      updated: "Updated",
      revise: "Revised",
      revised: "Revised"
    };
    const words = trimmed.split(/\s+/);
    const first = words[0].toLowerCase();
    if (replacements[first]) {
      words[0] = replacements[first];
      return words.join(" ");
    }
    return trimmed;
  }

  function toListItems(text = "") {
    const fragments = [];
    const normalized = text.replace(/\r/g, "").replace(/•/g, "\n");
    const lines = normalized.split(/\n+/);
    lines.forEach((line) => {
      const cleanedLine = line.trim().replace(/^[•*-\s]+/, "");
      if (!cleanedLine) return;
      const parts = cleanedLine.split(/(?<=[.!?])\s+/);
      parts.forEach((part) => {
        const item = part.trim().replace(/^[•*-\s]+/, "");
        if (item) fragments.push(item);
      });
    });
    return fragments.length ? fragments : [text.trim()].filter(Boolean);
  }

  function applyContent(targetId, targetEl, text, opts = {}) {
    const key = helperKeyForTarget(targetId);
    const forceText = opts.forceText === true;
    const shouldList =
      listTargets.has(targetId) && !forceText && !(key && aiGeneratedState[key]);

    if (shouldList) {
      const items = toListItems(text);
      targetEl.innerHTML = `<ul class="dash-list">${items
        .map((itm) => {
          const pastItem = pastTenseTargets.has(targetId) ? toPastTense(itm) : itm;
          return `<li>${escapeHTML(pastItem)}</li>`;
        })
        .join("")}</ul>`;
    } else {
      targetEl.textContent = text;
    }
  }

  function cleanAIText(text = "") {
    let cleaned = text.replace(/\*\*/g, ""); // drop bold markers
    cleaned = cleaned.replace(/^(?:revised|rewritten|updated)\s*text[:\-]?\s*/i, ""); // drop leading labels
    cleaned = cleaned.replace(/^dashboard update[:\-]?\s*/i, ""); // drop dashboard update prefixes
    cleaned = cleaned.replace(/^dashboard summary[:\-]?\s*/i, ""); // drop dashboard summary prefixes
    cleaned = cleaned.replace(/\b(kickoff update:|final review:)\s*/gi, ""); // drop phase labels
    cleaned = cleaned.replace(/^[\s*•\-–]+/gm, ""); // drop leading list markers
    cleaned = cleaned.replace(/\n+/g, " "); // flatten lines
    cleaned = cleaned.replace(/\s+/g, " ").trim();
    return cleaned;
  }

  function normalizeGoalStatus(raw) {
    const val = (raw || "").toString().trim().toLowerCase();
    if (!val) return "";
    if (["complete", "completed", "done", "achieved"].includes(val)) return "completed";
    if (["in progress", "in-progress", "inprogress", "working"].includes(val)) return "in progress";
    if (["not started", "not-started", "notstarted", "pending", "planned"].includes(val)) return "not started";
    return "";
  }

  function buildGoalStatusSummary(goals) {
    if (!Array.isArray(goals) || !goals.length) return "";
    const total = goals.length;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    goals.forEach((g) => {
      const status = normalizeGoalStatus(g.finalStatus || g.status || g.midtermStatus);
      if (status === "completed") completed += 1;
      else if (status === "in progress") inProgress += 1;
      else if (status === "not started") notStarted += 1;
    });

    return `Goal status summary: ${completed} completed, ${inProgress} in progress, ${notStarted} not started (${total} total).`;
  }

  function setSectionContent(targetId, text) {
    const target = document.getElementById(targetId);
    if (!target) return;
    applyContent(targetId, target, text || "");
  }

  function wireCopyButtons() {
    const copyButtons = document.querySelectorAll(".icon-copy-btn");
    copyButtons.forEach((btn) => {
      if (btn.dataset.copyWired === "1") return;
      btn.dataset.copyWired = "1";
      const targetId = btn.dataset.copyTarget;
      btn.addEventListener("click", () => {
        const target = document.getElementById(targetId);
        if (!target) return;
        const val = (target.textContent || "").trim();
        if (!val) return;
        const prev = btn.innerHTML;
        const onCopied = () => {
          btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copied';
          setTimeout(() => (btn.innerHTML = prev), 900);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(val).then(onCopied).catch(() => {});
        }
      });
    });
  }

  function wireRevertButtons() {
    const revertButtons = document.querySelectorAll(".icon-revert-btn");
    revertButtons.forEach((btn) => {
      if (btn.dataset.revertWired === "1") return;
      btn.dataset.revertWired = "1";
      const targetId = btn.dataset.revertTarget;
      btn.addEventListener("click", () => {
        const key = helperKeyForTarget(targetId);
        const target = document.getElementById(targetId);
        if (!key || !target) return;
        if (originalSections[key]) {
          applyContent(targetId, target, originalSections[key]);
          aiGeneratedState[key] = false;
          setAIHelper(key, false);
        }
      });
    });
  }

  async function rewriteDashboardSection(targetId) {
    const target = document.getElementById(targetId);
    const btn = document.querySelector(`.icon-ai-btn[data-ai-target="${targetId}"]`);
    if (!target || !btn) return;

    const helperKey = helperKeyForTarget(targetId);
    const mode = modeForTarget(targetId);
    if (!mode) return;
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-robot"></i> …';

    const sourceText = (target.textContent || "").trim();
    if (!sourceText) {
      alert("No content to rewrite yet.");
      btn.disabled = false;
      btn.innerHTML = original;
      return;
    }
    if (helperKey) {
      recordOriginal(helperKey, sourceText);
    }

    try {
      const base = window.location.protocol === "file:" ? "http://localhost:3001" : "";
      const res = await fetch(`${base}/api/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          phase: "dashboard",
          text: sourceText,
          projectContext: ""
        })
      });
      if (!res.ok) throw new Error(`AI rewrite failed: ${res.status}`);
      const json = await res.json();
      if (!json || typeof json.text !== "string") throw new Error("Invalid AI response");
      if (helperKey) {
        aiGeneratedState[helperKey] = true;
        setAIHelper(helperKey, true);
      }
      const cleaned = cleanAIText(json.text);
      applyContent(targetId, target, cleaned, { forceText: true });
    } catch (err) {
      console.error("AI rewrite failed", err);
      alert("AI could not generate this text. Please try again later.");
    } finally {
      btn.disabled = false;
      btn.innerHTML = original;
    }
  }

  function wireAIButtons() {
    const aiButtons = document.querySelectorAll(".icon-ai-btn");
    aiButtons.forEach((btn) => {
      if (btn.dataset.aiWired === "1") return;
      btn.dataset.aiWired = "1";
      btn.addEventListener("click", () => {
        const targetId = btn.dataset.aiTarget;
        const mode = modeForTarget(targetId);
        if (!mode) {
          btn.style.display = "none";
          return;
        }
        rewriteDashboardSection(targetId);
      });
      const mode = modeForTarget(btn.dataset.aiTarget);
      if (!mode) {
        btn.style.display = "none";
      }
    });
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

    const headers = columns
      .map(c => `<th class="${c.headerClass || ""}">${c.header}</th>`)
      .join("");
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

  const resolveImportance = (goal) => {
    if (goal.importance != null) return goal.importance;
    if (goal.currentScore != null) return goal.currentScore;
    if (goal.severity != null) return goal.severity;
    return "";
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
      { header: "Importance", headerClass: "numeric text-center", render: (r) => r.importance != null ? `${r.importance}/5` : "", className: (r) => (r.finalStatus === "discard" || r.midtermStatus === "discard" ? "goal-row--discard text-center numeric" : "text-center numeric") },
      { header: "Midterm Status", render: (r) => formatStatus(r.midtermStatus), className: (r) => r.midtermStatus === "discard" ? "goal-row--discard" : "" },
      { header: "Midterm Notes", render: (r) => r.midtermNotes || "—", className: (r) => r.midtermStatus === "discard" ? "goal-row--discard" : "" },
      { header: "Final Status", render: (r) => formatStatus(r.finalStatus), className: (r) => r.finalStatus === "discard" ? "goal-row--discard" : "" },
      { header: "Final Notes", render: (r) => r.finalNotes || "—", className: (r) => r.finalStatus === "discard" ? "goal-row--discard" : "" }
    ]);
    totalGoals = sorted.length;
    completedGoals = sorted.filter(r => (r.finalStatus || r.midtermStatus || "").toLowerCase() === "completed").length;
    updateGoalCounter(completedGoals, totalGoals);
  } else if (hasMidterm && dashGoalsTable) {
    const kickoffImportanceMap = new Map();
    const addKickoffToMap = (list) => {
      (list || []).forEach((g) => {
        kickoffImportanceMap.set(g.id, resolveImportance(g));
      });
    };
    if (kickoff) {
      addKickoffToMap(kickoff.businessGoals);
      addKickoffToMap(kickoff.productGoals);
      addKickoffToMap(kickoff.userGoals);
      addKickoffToMap(kickoff.userPains);
    }

    const list = Array.isArray(midterm.goalStatuses)
      ? midterm.goalStatuses.map(g => ({
          ...g,
          importance: resolveImportance(g) || kickoffImportanceMap.get(g.id) || ""
        }))
      : Array.isArray(midterm.goals)
        ? midterm.goals.map(g => ({
            ...g,
            importance: resolveImportance(g) || kickoffImportanceMap.get(g.id) || ""
          }))
        : [];
    list.sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type));

    renderGoalsTable(list, [
      { header: "Goal", render: (r) => r.label || "", className: (r) => r.status === "discard" ? "goal-row--discard" : "" },
      { header: "Type", render: (r) => titleCaseType(r.type || ""), className: (r) => r.status === "discard" ? "goal-row--discard" : "" },
      { header: "Importance", headerClass: "numeric text-center", render: (r) => r.importance != null ? `${r.importance}/5` : "", className: (r) => r.status === "discard" ? "goal-row--discard text-center numeric" : "text-center numeric" },
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
    const completedFinalGoals = goals.filter(g => (g.finalStatus || "").toLowerCase() === "completed");
    const completedFinalPain = completedFinalGoals.filter(g => (g.type || "").toLowerCase() === "pain");
    const highestImportance = completedFinalGoals.reduce(
      (max, g) => (g.importance != null && !Number.isNaN(Number(g.importance)) ? Math.max(max, Number(g.importance)) : max),
      -Infinity
    );
    const topCompletedGoals =
      highestImportance === -Infinity
        ? []
        : completedFinalGoals.filter(g => Number(g.importance) === highestImportance);

    if (summaryCard) summaryCard.style.display = "block";
    if (dashOutcomes) {
      setSectionContent(
        "dashOutcomes",
        completedFinalGoals.length
          ? completedFinalGoals.map(g => g.label).join(" • ")
          : (final.outcomes && final.outcomes.trim()) || "No final outcomes provided"
      );
      recordOriginal("outcomes", dashOutcomes.textContent);
    }
    if (dashResults) {
      const statusSummary = buildGoalStatusSummary(finalGoalsList);
      const resultsText = (final.results && final.results.trim()) || "No final results provided";
      const combined = statusSummary ? `${resultsText}\n${statusSummary}` : resultsText;
      setSectionContent("dashResults", combined);
      recordOriginal("results", dashResults.textContent);
    }
    if (dashPain) {
      setSectionContent(
        "dashPain",
        completedFinalPain.length
          ? completedFinalPain.map(g => g.label).join(" • ")
          : "No pain points addressed yet."
      );
      recordOriginal("pain", dashPain.textContent);
    }
    if (dashChallenges) {
      setSectionContent(
        "dashChallenges",
        (final.challenges && final.challenges.trim()) || "No challenges provided"
      );
      recordOriginal("challenges", dashChallenges.textContent);
    }
    if (dashLearnings) {
      setSectionContent(
        "dashLearnings",
        (final.learnings && final.learnings.trim()) || "No learnings provided"
      );
      recordOriginal("learnings", dashLearnings.textContent);
    }
    if (dashNextSteps) {
      setSectionContent(
        "dashNextSteps",
        (final.nextSteps && final.nextSteps.trim()) || "No next steps provided"
      );
      recordOriginal("nextSteps", dashNextSteps.textContent);
    }
    if (dashSummaryText) {
      dashSummaryText.textContent =
        (finalSummary && finalSummary.trim()) ||
        "No final summary provided";
    }
    ["outcomes", "pain", "results", "challenges", "learnings", "nextSteps"].forEach(k =>
      setAIHelper(k, aiGeneratedState[k])
    );
    wireCopyButtons();
    wireAIButtons();
    wireRevertButtons();
    return;
  }

  // ---------- MIDTERM VIEW ----------
  if (hasMidterm) {
    if (summaryCard) summaryCard.style.display = "none";

    const midtermCompleted = Array.isArray(midterm.goalStatuses)
      ? midterm.goalStatuses.filter(r => (r.status || "").toLowerCase() === "completed")
      : [];
    const midtermCompletedPain = midtermCompleted.filter(
      g => (g.type || "").toLowerCase() === "pain"
    );

    if (dashOutcomes) {
      setSectionContent(
        "dashOutcomes",
        midtermCompleted.length
          ? midtermCompleted.map(g => g.label).join(" • ")
          : (
              midterm.healthScore != null
                ? `Project Health: ${midterm.healthScore}/5`
                : "No midterm data provided"
            )
      );
      recordOriginal("outcomes", dashOutcomes.textContent);
      setAIHelper("outcomes", aiGeneratedState.outcomes);
    }

    if (dashResults) {
      const statusSummary = buildGoalStatusSummary(
        Array.isArray(midterm.goalStatuses) ? midterm.goalStatuses : midterm.goals || []
      );
      const progressText =
        midterm.progressScore != null
          ? `Progress Confidence: ${midterm.progressScore}/5`
          : "No midterm data provided";
      const combined = statusSummary ? `${progressText}\n${statusSummary}` : progressText;
      setSectionContent("dashResults", combined);
      recordOriginal("results", dashResults.textContent);
      setAIHelper("results", aiGeneratedState.results);
    }

    if (dashPain) {
      setSectionContent(
        "dashPain",
        midtermCompletedPain.length
          ? midtermCompletedPain.map(g => g.label).join(" • ")
          : "No pain points addressed yet."
      );
      recordOriginal("pain", dashPain.textContent);
      setAIHelper("pain", aiGeneratedState.pain);
    }

    if (dashChallenges) {
      const risksList = Array.isArray(midterm.risks)
        ? midterm.risks.filter(r => (r.selected ?? true) && (r.label || r.notes))
        : [];
      if (risksList.length) {
        setSectionContent(
          "dashChallenges",
          risksList
            .map(r => `${r.label || ""}${r.notes ? ` — ${r.notes}` : ""}`)
            .join(" • ")
        );
      } else if (typeof midterm.risks === "string" && midterm.risks.trim()) {
        setSectionContent("dashChallenges", midterm.risks.trim());
      } else {
        setSectionContent("dashChallenges", "No midterm data provided");
      }
      recordOriginal("challenges", dashChallenges.textContent);
      setAIHelper("challenges", aiGeneratedState.challenges);
    }

    if (dashLearnings) {
      setSectionContent(
        "dashLearnings",
        (midterm.learnings && midterm.learnings.trim()) ||
          "No midterm data provided"
      );
      recordOriginal("learnings", dashLearnings.textContent);
      setAIHelper("learnings", aiGeneratedState.learnings);
    }

    if (dashNextSteps) {
      setSectionContent(
        "dashNextSteps",
        (midterm.nextSteps && midterm.nextSteps.trim()) ||
          "No midterm data provided"
      );
      recordOriginal("nextSteps", dashNextSteps.textContent);
      setAIHelper("nextSteps", aiGeneratedState.nextSteps);
    }

    wireCopyButtons();
    wireAIButtons();

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
        '<tr><th>Goal</th><th>Type</th><th class="numeric">Importance</th><th>Kickoff Notes</th></tr>',
        '</thead><tbody>',
        ...rows.map(r => `
          <tr>
            <td style="white-space: normal;">${r.label}</td>
            <td>${r.type}</td>
            <td class="numeric">${r.importance}</td>
            <td style="white-space: normal;">${r.notes || "—"}</td>
          </tr>
        `),
        '</tbody></table>'
      ].join("");
      dashGoalsTable.innerHTML = tableHtml;
      // Normalize any numeric importance
      const centerCells = dashGoalsTable.querySelectorAll("td:nth-child(3)");
      centerCells.forEach(cell => {
        const num = parseFloat(cell.textContent);
        if (!Number.isNaN(num)) {
          cell.textContent = `${num}/5`;
          cell.style.textAlign = "center";
        }
      });
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
    setSectionContent("dashOutcomes", "Not captured yet.");
  }

  if (dashPain) {
    setSectionContent(
      "dashPain",
      selectedUserPains.length
        ? selectedUserPains.map(p => p.label).join(" • ")
        : "No pain points captured yet."
    );
    recordOriginal("pain", dashPain.textContent);
  }

  // Results & Impact → product / experience goals baseline
  if (dashResults) {
    setSectionContent("dashResults", "Not captured yet.");
  }

  // Biggest Wins → user goals we want to enable
  if (dashWins) {
    setSectionContent("dashWins", "Not captured yet.");
  }

  // Challenges → user pains
  if (dashChallenges) {
    setSectionContent("dashChallenges", "Not captured yet.");
  }

  // Key Learnings → explanation
  if (dashLearnings) {
    setSectionContent("dashLearnings", "Not captured yet.");
  }

  // Next Steps → explanation
  if (dashNextSteps) {
    setSectionContent("dashNextSteps", "Not captured yet.");
  }

  // Full Final Summary → placeholder
  if (dashSummaryText) {
    dashSummaryText.textContent =
      "Kickoff-Only View: Final Narrative Summary Will Appear Here Once the Final Review Survey Is Completed.";
  }

  setAIHelper("outcomes", aiGeneratedState.outcomes);
  setAIHelper("pain", aiGeneratedState.pain);
  setAIHelper("results", aiGeneratedState.results);
  setAIHelper("challenges", aiGeneratedState.challenges);
  setAIHelper("learnings", aiGeneratedState.learnings);
  setAIHelper("nextSteps", aiGeneratedState.nextSteps);
  wireCopyButtons();
  wireAIButtons();
}
