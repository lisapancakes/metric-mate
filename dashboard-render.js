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
  const projectSummaryEl = document.getElementById("dashboardProjectSummary");
  const caseStudyBtn = document.getElementById("openCaseStudyBtn");
  const caseStudyCard = document.getElementById("caseStudyCard");

  const dashOutcomes = document.getElementById("dashOutcomes");
  const dashResults = document.getElementById("dashResults");
  const dashPain = document.getElementById("dashPain");
  const dashChallenges = document.getElementById("dashChallenges");
  const dashLearnings = document.getElementById("dashLearnings");
  const dashNextSteps = document.getElementById("dashNextSteps");
  const painPointsTitle = document.getElementById("painPointsTitle");
  const challengesTitle = document.getElementById("challengesTitle");
  const dashSummaryText = document.getElementById("dashSummaryText");
  const dashImpactCard = document.getElementById("dashImpact")?.closest(".dash-card");
  const dashMidtermSummary = document.getElementById("dashMidtermSummary");
  const midtermSummaryCard = document.getElementById("midtermSummaryCard");
  const midtermSummaryAIButton = document.querySelector(
    '.icon-ai-btn[data-ai-target="dashMidtermSummary"]'
  );
  const finalSummaryAIButton = document.querySelector(
    '.icon-ai-btn[data-ai-target="dashSummaryText"]'
  );
  const summaryCard = dashSummaryText ? dashSummaryText.closest(".dash-card") : null;
  const aiHelpers = {
    outcomes: document.querySelector('[data-ai-helper-for="dashOutcomes"]'),
    results: document.querySelector('[data-ai-helper-for="dashResults"]'),
    pain: document.querySelector('[data-ai-helper-for="dashPain"]'),
    challenges: document.querySelector('[data-ai-helper-for="dashChallenges"]'),
    learnings: document.querySelector('[data-ai-helper-for="dashLearnings"]'),
    nextSteps: document.querySelector('[data-ai-helper-for="dashNextSteps"]'),
    midtermSummary: document.querySelector('[data-ai-helper-for="dashMidtermSummary"]'),
    finalSummary: document.querySelector('[data-ai-helper-for="dashSummaryText"]')
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
    nextSteps: false,
    midtermSummary: false,
    finalSummary: false
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
  const projectPayloadBase = {
    clientName: project.client || "",
    title: project.name || "",
    summary: project.summary || "",
    serviceCategories: project.serviceCategories || [],
    techCategories: project.techCategories || [],
    toolsUsed: project.toolsUsed || [],
    goalCategories: project.goalCategories || []
  };
  let derivedProgressSignal = null;
  let derivedGoalMovement = null;

  console.log("[dashboard-render] kickoff object:", kickoff);
  console.log("[dashboard-render] project object:", project);

  // --- Status helpers ---
  const midtermHasContent = !!(
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
  const hasMidterm = midtermHasContent;

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
  if (projectSummaryEl) {
    const summaryText = project.summary || "";
    projectSummaryEl.textContent = summaryText;
    projectSummaryEl.style.display = summaryText ? "block" : "none";
  }

  // Kickoff selections (shared across all modes)
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
      case "dashMidtermSummary":
        return "midtermSummary";
      case "dashSummaryText":
        return "finalSummary";
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
        return null;
      case "dashMidtermSummary":
        return hasMidterm ? "dashboard_midterm_summary" : null;
      case "dashSummaryText":
        return hasFinal ? "dashboard_final_summary" : null;
      default:
        return null;
    }
  }

  function setAIHelper(key, generated) {
    const helperEl = aiHelpers[key];
    if (!helperEl) return;
    const isGenerated = generated !== undefined ? generated : aiGeneratedState[key];
    helperEl.textContent = isGenerated ? "AI-generated · revert or regenerate" : "AI draft not generated";
  }

  function recordOriginal(key, value) {
    if (!key) return;
    if (originalSections[key]) return;
    originalSections[key] = value || "";
  }

  function setCardVisibilityForContent(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    const card = el.closest(".dash-card");
    if (!card) return;
    const text = (el.textContent || el.innerText || "").trim();
    card.style.display = text ? "block" : "none";
  }

  function setGoalsCompletedTitle(count = 0) {
    if (!goalsCompletedTitle) return;
    goalsCompletedTitle.textContent = `Goals Completed (${count})`;
  }

  function setPainPointsTitle(count = 0) {
    if (!painPointsTitle) return;
    painPointsTitle.textContent = `Pain Points Addressed (${count})`;
  }

  function setChallengesTitle(count = 0) {
    if (!challengesTitle) return;
        challengesTitle.textContent = `Challenges (${count})`;
  }

  const listTargets = new Set([
    "dashOutcomes",
    "dashPain",
    "dashChallenges",
    "dashLearnings",
    "dashNextSteps",
    "dashMidtermSummary"
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
    if (targetId === "dashResults") {
      const headings = [
        "Progress vs Plan",
        "Goal Status",
        "Top Completed Goals"
      ];
      const lines = (text || "").split("\n");
      const htmlLines = lines.map((rawLine) => {
        const line = (rawLine || "").trim();
        if (!line) return "";
        const lower = line.toLowerCase();
        for (const h of headings) {
          const prefix = `${h}:`.toLowerCase();
          if (lower.startsWith(prefix)) {
            const remainder = line.slice(prefix.length).trim();
            const rest = remainder ? ` ${escapeHTML(remainder)}` : "";
            return `<strong>${h}:</strong>${rest}`;
          }
        }
        return escapeHTML(line);
      }).filter(Boolean);
      targetEl.innerHTML = htmlLines.join("<br>");
      return;
    }
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

  function normalizeStatus(status) {
    return (status || "").toLowerCase().trim();
  }

  function getCanonicalStatus(goal) {
    const normalize = (str) => (str || "").toLowerCase().trim();
    const mid = normalize(goal.midtermStatus);
    const fin = normalize(goal.finalStatus);
    const combined = `${mid} ${fin}`;

    if (combined.includes("discard")) return "discard";
    if (combined.includes("completed")) return "completed";
    if (combined.includes("progress")) return "in-progress";

    return "not-started";
  }

  function buildGoalStatusSummary(goals) {
    if (!Array.isArray(goals) || !goals.length) return "";

    const activeGoals = goals.filter(
      (g) => normalizeStatus(g.finalStatus || g.status || g.midtermStatus) !== "discard"
    );

    const completed = activeGoals.filter(
      (g) => normalizeStatus(g.finalStatus || g.status || g.midtermStatus) === "completed"
    );
    const inProgress = activeGoals.filter(
      (g) =>
        ["in progress", "inprogress"].includes(
          normalizeStatus(g.finalStatus || g.status || g.midtermStatus)
        )
    );
    const notStarted = activeGoals.filter(
      (g) =>
        ["not started", "notstarted"].includes(
          normalizeStatus(g.finalStatus || g.status || g.midtermStatus)
        )
    );

    const total = activeGoals.length;

    return `Goal status summary: ${completed.length} completed, ${inProgress.length} in progress, ${notStarted.length} not started (${total} total).`;
  }

  function buildResultsAIInput() {
    const rating =
      midterm && midterm.progressScore != null
        ? Number(midterm.progressScore)
        : null;
    const goalSource = hasFinal
      ? goals
      : Array.isArray(midterm.goalStatuses)
        ? midterm.goalStatuses
        : midterm.goals || [];

    if (rating == null || !Array.isArray(goalSource) || goalSource.length === 0) {
      return null;
    }

    let completed = 0;
    let inProgress = 0;
    let total = 0;
    goalSource.forEach((g) => {
      const status = normalizeGoalStatus(g.finalStatus || g.status || g.midtermStatus);
      if (status) total += 1;
      if (status === "completed") completed += 1;
      else if (status === "in progress") inProgress += 1;
    });
    if (total === 0) return null;
    const notStarted = Math.max(total - (completed + inProgress), 0);

    const progressDirection =
      rating <= 2 ? "behind plan" : rating === 3 ? "generally on track" : "ahead of plan";

    let goalMovement = "most goals are still underway";
    if (completed === 0) {
      goalMovement = "most goals are still underway";
    } else if (completed < total) {
      goalMovement = "several goals have been completed while others progress";
    } else {
      goalMovement = "all goals have been completed";
    }

    derivedProgressSignal = progressDirection;
    derivedGoalMovement = goalMovement;
    return `${progressDirection}\n${goalMovement}`;
  }

  function setSectionContent(targetId, text) {
    const target = document.getElementById(targetId);
    if (!target) return;
    applyContent(targetId, target, text || "");
  }

  const addressedStatuses = new Set(["addressed", "partially addressed", "completed"]);
  function isAddressedStatus(status = "") {
    const val = status.toString().trim().toLowerCase();
    if (!val) return false;
    if (addressedStatuses.has(val)) return true;
    // simple normalization for status with spaces/dashes
    if (val.replace(/[\s-]+/g, " ") === "partially addressed") return true;
    return false;
  }

  function getAddressedPain(list = [], statusKey = "status") {
    return list
      .filter((item) => (item.type || item.category || "").toLowerCase() === "pain")
      .filter((item) => isAddressedStatus(item[statusKey]))
      .map((item) => item.label || item.description || "")
      .filter(Boolean);
  }

  function getDecisions() {
    const candidates = [];
    if (Array.isArray(data.decisions)) candidates.push(...data.decisions);
    if (Array.isArray(final.decisions)) candidates.push(...final.decisions);
    if (Array.isArray(midterm.decisions)) candidates.push(...midterm.decisions);
    return candidates
      .map((d) => {
        const title = d.title || d.label || "";
        const desc = d.description || d.notes || "";
        if (!title && !desc) return null;
        const summary = desc ? `${title ? title + " — " : ""}${desc}` : title;
        return summary.trim();
      })
      .filter(Boolean);
  }

  function buildResultsImpactText(goalsList = [], progressScore) {
    const progressMap = {
      1: "Well behind plan",
      2: "Slightly behind plan",
      3: "On track",
      4: "Slightly ahead of plan",
      5: "Well ahead of plan"
    };

    const filtered = (goalsList || []).filter(
      (g) => getCanonicalStatus(g) !== "discard"
    );
    const completed = filtered.filter((g) => getCanonicalStatus(g) === "completed");
    const inProgress = filtered.filter((g) => getCanonicalStatus(g) === "in-progress");
    const notStarted = filtered.filter((g) => getCanonicalStatus(g) === "not-started");
    const total = filtered.length;

    const label = progressMap[progressScore] || "Not assessed";
    const progressLine =
      progressScore != null
        ? `Progress vs Plan:\n${progressScore}/5 (${label})`
        : `Progress vs Plan:\nNot assessed.`;

    const statusLine =
      total === 0
        ? "Goal Status:\nNo goals tracked yet."
        : `Goal Status:\n${completed.length} completed, ${inProgress.length} in progress, ${notStarted.length} not started (${total} total).`;

    const topCompleted = [...completed]
      .sort((a, b) => (Number(b.importance) || 0) - (Number(a.importance) || 0))
      .slice(0, 3)
      .map((g) => g.goal || g.label)
      .filter(Boolean);

    const topGoalsBlock =
      topCompleted.length
        ? `Top Completed Goals:\n${topCompleted.map((g) => `• ${g}`).join("\n")}`
        : `Top Completed Goals:\n• None completed yet`;

    return [progressLine, statusLine, topGoalsBlock].join("\n\n");
  }

  function buildMidtermSummaryInput(midtermData = {}, goalsList = [], projectMeta = {}) {
    const lines = [];
    if (projectMeta.name) lines.push(`Project: ${projectMeta.name}`);
    if (projectMeta.client) lines.push(`Client: ${projectMeta.client}`);
    if (midtermData.healthScore != null) lines.push(`Health Score: ${midtermData.healthScore}/5`);
    if (midtermData.progressScore != null) lines.push(`Progress Confidence: ${midtermData.progressScore}/5`);

    const statusSummary = buildGoalStatusSummary(
      Array.isArray(midtermData.goalStatuses) ? midtermData.goalStatuses : goalsList || []
    );
    if (statusSummary) lines.push(statusSummary);

    const risks = Array.isArray(midtermData.risks)
      ? midtermData.risks.filter(r => r.selected ?? true).map(r => r.label || r.notes).filter(Boolean)
      : [];
    if (risks.length) {
      lines.push("Risks / Issues:");
      risks.forEach(r => lines.push(`- ${r}`));
    }

    if (midtermData.wins) lines.push(`Wins: ${midtermData.wins}`);
    if (midtermData.learnings) lines.push(`Learnings: ${midtermData.learnings}`);
    if (midtermData.nextSteps) lines.push(`Next Steps: ${midtermData.nextSteps}`);

    return lines.join("\n").trim();
  }

  function buildImpactBuckets(goalList = []) {
    const buckets = {
      uxGoals: [],
      productGoals: [],
      businessGoals: []
    };

    goalList.forEach((goal) => {
      if (!goal) return;
      const status = (goal.finalStatus || "").toLowerCase();
      if (status !== "completed") return;
      const label = goal.label || goal.name || "";
      if (!label) return;
      const type = (goal.type || "").toLowerCase();
      if (type === "user" || type === "pain") {
        buckets.uxGoals.push(label);
      } else if (type === "product") {
        buckets.productGoals.push(label);
      } else if (type === "business") {
        buckets.businessGoals.push(label);
      }
    });

    return buckets;
  }

  // Build prefilled Google Form URL for case study intake
  function getCaseStudyPrefilledUrl(projectPayload, finalDashboard) {
    const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfPvvxah0MGvF6FVn4lId73mkAYEM2R0Ijf5U38fd6m0xyFcQ/viewform";
    const params = new URLSearchParams();

    const safeJoin = (arr = []) => arr.filter(Boolean);
    const mergedGoals = Array.isArray(finalDashboard.goals) ? finalDashboard.goals : [];
    const goalsCompletedDetailed = Array.isArray(finalDashboard.completedGoalsDetailed)
      ? finalDashboard.completedGoalsDetailed.filter(Boolean)
      : [];
    const goalsCompleted = goalsCompletedDetailed.length
      ? goalsCompletedDetailed.map((g) => g && g.label).filter(Boolean)
      : safeJoin(finalDashboard.goalsCompleted || []);
    const painPoints = safeJoin(finalDashboard.originalPainPoints || []);
    const decisions = safeJoin(finalDashboard.keyDecisions || []);
    const learningsText = (finalDashboard.keyLearningsText || "").trim();

    if (projectPayload.clientName) params.set("entry.1009657372", projectPayload.clientName);
    if (projectPayload.title) params.set("entry.1888520839", projectPayload.title);

    // Project goals → map to predefined options if any; otherwise short Other string
    const otherGoals = mergedGoals
      .map((g) => g && (g.label || g.goal || ""))
      .filter(Boolean)
      .slice(0, 3);
    if (otherGoals.length) {
      params.append("entry.607934051", "__other_option__");
      params.set(
        "entry.607934051.other_option_response",
        otherGoals.join("; ")
      );
    }

    const challengesBlockParts = [];
    if (painPoints.length) {
      challengesBlockParts.push("Pain points:");
      challengesBlockParts.push(...painPoints.map((p) => `• ${p}`));
    }
    if (challengesBlockParts.length) {
      params.set("entry.2146709131", challengesBlockParts.join("\n"));
    }

    // What We Did → completed goals/pains, using only "How We Did It" actions
    const completedActions = [];
    const seenActions = new Set();
    const sortedCompleted = mergedGoals
      .filter((g) => getCanonicalStatus(g) === "completed")
      .sort((a, b) => (Number(b.importance) || 0) - (Number(a.importance) || 0));

    const splitActions = (txt) =>
      txt
        .split(/[\n\.]+/)
        .map((s) => s.replace(/^•\s*/, "").trim())
        .filter(Boolean);

    sortedCompleted.forEach((g) => {
      const raw = (g.howWeDidIt || "").trim();
      if (!raw) return;
      splitActions(raw).forEach((act) => {
        if (seenActions.has(act)) return;
        seenActions.add(act);
        completedActions.push(act);
      });
    });

    let whatWeDidValue = "";
    if (completedActions.length) {
      whatWeDidValue = completedActions.map((a) => `• ${a}`).join("\n");
    } else {
      // Fallback to prior content if no actions found
      const fallbackGoals = goalsCompletedDetailed.length
        ? goalsCompletedDetailed.map((g) => g && g.label).filter(Boolean)
        : goalsCompleted;
      if (fallbackGoals.length) {
        whatWeDidValue = fallbackGoals.map((g) => `• ${g}`).join("\n");
      } else if (finalDashboard.resultsImpactText) {
        whatWeDidValue = finalDashboard.resultsImpactText;
      } else {
        whatWeDidValue = "Project work captured in dashboard.";
      }
    }
    params.set("entry.1962619986", whatWeDidValue);
    console.log("CaseStudy WhatWeDid:", whatWeDidValue);

    // Results & Impact (structured block)
    const progressScore = finalDashboard.progressScore != null
      ? finalDashboard.progressScore
      : (projectPayload.progressScore != null ? projectPayload.progressScore : 3);
    const goalsList = Array.isArray(finalDashboard.goals) ? finalDashboard.goals : [];
    const trackedGoals = goalsList.filter((g) => {
      const t = (g.type || "").toLowerCase();
      return ["business", "product", "user", "pain"].includes(t);
    });
    const activeGoals = trackedGoals.filter((g) => getCanonicalStatus(g) !== "discard");
    const completedGoals = activeGoals.filter((g) => getCanonicalStatus(g) === "completed");
    const inProgressGoals = activeGoals.filter((g) => getCanonicalStatus(g) === "in-progress");
    const notStartedGoals = activeGoals.filter((g) => getCanonicalStatus(g) === "not-started");
    const totalTracked = activeGoals.length;

    const typePriority = ["business", "user", "product", "pain"];
    const topCompleted = [...completedGoals]
      .sort((a, b) => {
        const impDiff = (Number(b.importance) || 0) - (Number(a.importance) || 0);
        if (impDiff !== 0) return impDiff;
        const aType = typePriority.indexOf((a.type || "").toLowerCase());
        const bType = typePriority.indexOf((b.type || "").toLowerCase());
        return aType - bType;
      })
      .slice(0, 3);

    const resultsLines = [];
    resultsLines.push(`Progress vs Plan: ${progressScore}/5 (On track)`);
    resultsLines.push("");
    resultsLines.push("Goal Status:");
    resultsLines.push(`• ${completedGoals.length} completed`);
    resultsLines.push(`• ${inProgressGoals.length} in progress`);
    resultsLines.push(`• ${notStartedGoals.length} not started`);
    resultsLines.push(`(Total: ${totalTracked})`);
    if (topCompleted.length) {
      resultsLines.push("");
      resultsLines.push("Top Completed Goals:");
      resultsLines.push(
        ...topCompleted.map((g) => `• ${g.label || g.goal || ""}`)
      );
    }
    params.set("entry.391970403", resultsLines.join("\n"));

    // Highlights / Key Wins (completed goals + key learnings)
    const highlightBullets = [];
    if (topCompleted.length) {
      highlightBullets.push(...topCompleted.map((g) => `• ${g.label || g.goal || ""}`));
    }
    const learningsSentences = [];
    if (learningsText) {
      const sentences = learningsText.split(/\. |\n/).map(s => s.trim()).filter(Boolean);
      learningsSentences.push(...sentences.slice(0, 2));
    }
    if (learningsSentences.length) {
      highlightBullets.push(...learningsSentences.map(s => `• ${s}`));
    }
    if (highlightBullets.length) {
      params.set("entry.1162619322", highlightBullets.slice(0, 5).join("\n"));
    }

    if (Array.isArray(projectPayload.serviceCategories)) {
      projectPayload.serviceCategories.filter(Boolean).forEach((cat) => {
        params.append("entry.948935355", cat);
      });
    }
    if (Array.isArray(projectPayload.techCategories)) {
      projectPayload.techCategories.filter(Boolean).forEach((tech) => {
        params.append("entry.411878623", tech);
      });
    }
    if (Array.isArray(projectPayload.toolsUsed)) {
      projectPayload.toolsUsed.filter(Boolean).forEach((tool) => {
        params.append("entry.159720233", tool);
      });
    }

    const otherHighlights = decisions.slice(0, 2).map((d) => `• ${d}`);
    if (otherHighlights.length) {
      params.set("entry.840332325", otherHighlights.join("\n"));
    }

    return `${FORM_URL}?${params.toString()}`;
  }

  function setCaseStudyButton(projectPayload, finalPayload) {
    const btn = document.getElementById("openCaseStudyBtn");
    if (!btn) return;
    btn.onclick = (event) => {
      event.preventDefault();
      const url = getCaseStudyPrefilledUrl(projectPayload, finalPayload);
      if (url) {
        window.open(url, "_blank", "noopener");
      }
    };
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
        const statusEl = document.getElementById("copyStatus");
        const onCopied = () => {
          if (statusEl) {
            statusEl.textContent = "Copied to clipboard";
            statusEl.style.display = "block";
            setTimeout(() => {
              statusEl.style.display = "none";
            }, 2200);
          }
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
    const isResults = targetId === "dashResults";
    const isMidtermSummary = targetId === "dashMidtermSummary";
    const isFinalSummary = targetId === "dashSummaryText";
    let builtSource = sourceText;
    if (isResults) builtSource = buildResultsAIInput();
    if (isMidtermSummary && sourceText) {
      builtSource = [
        "Rewrite this into a cohesive midterm project summary (3–4 sentences) with no headings or bullets.",
        "Use plain language: summarize overall health/progress, key risks or blockers, notable wins, and immediate next steps.",
        "Translate any ratings or counts into words; avoid raw numbers, percentages, or score labels.",
        "Do not add new data or promises. Keep it concise and readable.",
        "",
        sourceText
      ].join("\n");
    }
    if (isFinalSummary && sourceText) {
      builtSource = [
        "Rewrite this into a concise final project wrap-up (3–5 sentences) with no headings or bullets.",
        "Use narrative sentences that cover: what was shipped (high-level), observed impact or signals, major wins, key challenges, and immediate next steps.",
        "Translate any ratings or counts into words; avoid raw numbers, percentages, or score labels.",
        "Do not include goal status lists, markdown headings, or bullets. Do not add new data or promises.",
        "",
        sourceText
      ].join("\n");
    }
    if ((isResults && !builtSource) || (!isResults && !sourceText)) {
      if (isResults) {
        const fallback =
          "Overall progress is generally on track. Several goals have been completed, with others actively in progress.";
        applyContent(targetId, target, fallback, { forceText: true });
        aiGeneratedState[helperKey] = false;
        setAIHelper(helperKey, false);
      } else {
        alert("No content to rewrite yet.");
      }
      btn.disabled = false;
      btn.innerHTML = original;
      return;
    }
    if (helperKey) {
      recordOriginal(helperKey, sourceText);
    }

    try {
      const base =
        window.location.protocol === "file:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
          ? "http://localhost:3001"
          : "";
      const res = await fetch(`${base}/api/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          phase: "dashboard",
          text: builtSource,
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
            const content = c.render(row);
            const shouldScroll = c.scroll === true;
            const wrapped = shouldScroll
              ? `<div class="cell-scroll">${content}</div>`
              : content;
            return `<td class="${cls}">${wrapped}</td>`;
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
      { header: "Final Status", render: (r) => formatStatus(r.finalStatus), className: (r) => r.finalStatus === "discard" ? "goal-row--discard" : "" },
      { header: "Final Notes", render: (r) => r.finalNotes || "—", className: (r) => r.finalStatus === "discard" ? "goal-row--discard" : "", scroll: true },
      { header: "How We Did It", render: (r) => r.completionNote || "—", className: (r) => r.finalStatus === "discard" ? "goal-row--discard" : "", scroll: true }
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
      { header: "Notes", render: (r) => r.notes || "—", className: (r) => r.status === "discard" ? "goal-row--discard" : "", scroll: true },
      { header: "How We Did It", render: (r) => r.completionNote || "—", className: (r) => r.status === "discard" ? "goal-row--discard" : "", scroll: true }
    ]);
    totalGoals = list.length;
    completedGoals = list.filter(r => (r.status || "").toLowerCase() === "completed").length;
    updateGoalCounter(completedGoals, totalGoals);
  }

  // --- Card content ---

  // If we have final data, show that (full project view)
  if (hasFinal) {
    const completedFinalGoals = goals.filter(
      (g) => getCanonicalStatus(g) === "completed"
    );
    const completedFinalPain = getAddressedPain(goals, "finalStatus");

    if (summaryCard) summaryCard.style.display = "block";
    if (dashOutcomes) {
      const typeLabel = (t) => {
        const val = (t || "").toLowerCase();
        if (val === "business") return "Business";
        if (val === "product") return "Product";
        if (val === "user") return "User";
        if (val === "pain") return "Pain point";
        return "Goal";
      };
    const activeGoals = finalGoalsList.filter((g) => getCanonicalStatus(g) !== "discard");
    const completedGoals = activeGoals
      .filter((g) => getCanonicalStatus(g) === "completed")
      .sort((a, b) => (Number(b.importance) || 0) - (Number(a.importance) || 0));

    setGoalsCompletedTitle(completedGoals.length);
    if (completedGoals.length) {
      const listHtml = completedGoals
        .map((g) => {
          const label = g.label || g.goal || "";
          return `<li>${escapeHTML(label)} (${typeLabel(g.type)})</li>`;
          })
          .join("");
        dashOutcomes.innerHTML = `<ul class="dash-list">${listHtml}</ul>`;
      } else {
        dashOutcomes.innerHTML = `<ul class="dash-list"><li>None completed yet</li></ul>`;
      }
      recordOriginal("outcomes", dashOutcomes.textContent || dashOutcomes.innerText || "");
      setCardVisibilityForContent("dashOutcomes");
    }
    if (dashResults) {
      const progressScore =
        final.progressScore != null ? final.progressScore : midterm.progressScore;
      const resultsText = buildResultsImpactText(finalGoalsList, progressScore);
      setSectionContent("dashResults", resultsText);
      recordOriginal("results", dashResults.textContent);
      setCardVisibilityForContent("dashResults");
    }
    if (dashPain) {
      const activeGoals = finalGoalsList.filter((g) => getCanonicalStatus(g) !== "discard");
      const completedPains = activeGoals
        .filter(
          (g) =>
            (g.type || "").toLowerCase() === "pain" &&
            getCanonicalStatus(g) === "completed"
        )
        .sort((a, b) => (Number(b.importance) || 0) - (Number(a.importance) || 0));

      if (painPointsTitle) {
        painPointsTitle.textContent = `Pain Points Addressed (${completedPains.length})`;
      }
      if (completedPains.length) {
        const listHtml = completedPains
          .map((g) => {
            const label = g.label || g.goal || "";
            const note = g.howWeDidIt || g.completionNote || g.finalNotes || "";
            const safeLabel = escapeHTML(label);
            const safeNote = escapeHTML(note);
            const noteLine = note ? `<div class="goal-note"><strong>How we addressed it:</strong> ${safeNote}</div>` : "";
            return `<li>${safeLabel}${noteLine ? `<br>${noteLine}` : ""}</li>`;
          })
          .join("");
        dashPain.innerHTML = `<ul class="dash-list">${listHtml}</ul>`;
      } else {
        dashPain.innerHTML = `<ul class="dash-list"><li>No pain points marked as addressed yet</li></ul>`;
      }
      recordOriginal("pain", dashPain.textContent || dashPain.innerText || "");
      setCardVisibilityForContent("dashPain");
    }
    if (dashChallenges) {
      const challengesText = (final.challenges && final.challenges.trim()) || "";
      if (challengesTitle) {
        const count = challengesText
          ? challengesText.split(/[\n•]/).map(t => t.trim()).filter(Boolean).length
          : 0;
        challengesTitle.textContent = `Challenges (${count})`;
      }
      setSectionContent(
        "dashChallenges",
        challengesText || "No challenges provided"
      );
      recordOriginal("challenges", dashChallenges.textContent);
      setCardVisibilityForContent("dashChallenges");
    }
    if (dashLearnings) {
      setSectionContent(
        "dashLearnings",
        (final.learnings && final.learnings.trim()) || "No learnings provided"
      );
      recordOriginal("learnings", dashLearnings.textContent);
      setCardVisibilityForContent("dashLearnings");
    }
    if (dashNextSteps) {
      const nextStepsText =
        (final.nextSteps && final.nextSteps.trim()) ||
        ((midterm && midterm.nextSteps && midterm.nextSteps.trim()) || "");
      setSectionContent(
        "dashNextSteps",
        nextStepsText || "No next steps provided"
      );
      recordOriginal("nextSteps", dashNextSteps.textContent);
      setCardVisibilityForContent("dashNextSteps");
    }

    if (dashSummaryText) {
      dashSummaryText.textContent =
        (finalSummary && finalSummary.trim()) ||
        "No final summary provided";
      const summaryCardEl = dashSummaryText.closest(".dash-card");
      if (summaryCardEl) {
        summaryCardEl.style.display =
          (dashSummaryText.textContent || "").trim() ? "block" : "none";
      }
    }
    ["outcomes", "pain", "results", "challenges", "learnings", "nextSteps", "midtermSummary", "finalSummary"].forEach(k =>
      setAIHelper(k, aiGeneratedState[k])
    );
    wireCopyButtons();
    wireAIButtons();
    wireRevertButtons();

    const finalDashboardPayload = {
      quickSummary: "",
      goalsCompleted: completedFinalGoals.map(g => g.label || ""),
      completedGoalsDetailed: completedFinalGoals.map(g => ({
        label: g.label || "",
        completionNote: g.completionNote || ""
      })),
      painPointsAddressed: completedFinalPain,
      originalPainPoints: selectedUserPains.map(p => p.label || ""),
      challengesText: dashChallenges ? dashChallenges.textContent : "",
      resultsImpactText: dashResults ? dashResults.textContent : "",
      keyLearningsText: dashLearnings ? dashLearnings.textContent : "",
      keyDecisions: getDecisions(),
      goals: finalGoalsList
    };
    setCaseStudyButton(projectPayloadBase, finalDashboardPayload);
    if (caseStudyBtn) caseStudyBtn.style.display = "inline-flex";
    if (caseStudyCard) caseStudyCard.style.display = "block";
    return;
  }

  // ---------- MIDTERM VIEW ----------
  if (hasMidterm) {
    if (summaryCard) summaryCard.style.display = "none";
    if (dashImpact && dashImpact.closest(".dash-card")) {
      dashImpact.closest(".dash-card").style.display = "none";
    }

    const midtermCompleted = Array.isArray(midterm.goalStatuses)
      ? midterm.goalStatuses.filter(r => (r.status || "").toLowerCase() === "completed")
      : [];
    const midtermCompletedPain = midtermCompleted.filter(
      g => (g.type || "").toLowerCase() === "pain"
    );
    const midtermAddressedPain = getAddressedPain(
      Array.isArray(midterm.goalStatuses) ? midterm.goalStatuses : midterm.goals || [],
      "status"
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
      setGoalsCompletedTitle(midtermCompleted.length || 0);
      recordOriginal("outcomes", dashOutcomes.textContent);
      setAIHelper("outcomes", aiGeneratedState.outcomes);
    }

    if (dashResults) {
      const list = Array.isArray(midterm.goalStatuses)
        ? midterm.goalStatuses
        : midterm.goals || [];
      const resultsText = buildResultsImpactText(list, midterm.progressScore);
      setSectionContent("dashResults", resultsText);
      recordOriginal("results", dashResults.textContent);
      setAIHelper("results", aiGeneratedState.results);
    }

    if (dashPain) {
      setPainPointsTitle(midtermAddressedPain.length || 0);
      setSectionContent(
        "dashPain",
        midtermAddressedPain.length
          ? midtermAddressedPain.join(" • ")
          : "No pain points marked as addressed yet."
      );
      recordOriginal("pain", dashPain.textContent);
      setAIHelper("pain", aiGeneratedState.pain);
    }

    if (dashChallenges) {
      const risksList = Array.isArray(midterm.risks)
        ? midterm.risks.filter(r => (r.selected ?? true) && (r.label || r.notes))
        : [];
      if (risksList.length) {
        setChallengesTitle(risksList.length);
      } else if (typeof midterm.risks === "string" && midterm.risks.trim()) {
        setChallengesTitle(1);
      } else {
        setChallengesTitle(0);
      }
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
      const nextStepsText = (midterm.nextSteps && midterm.nextSteps.trim()) || "";
      setSectionContent(
        "dashNextSteps",
        nextStepsText || "No next steps provided"
      );
      recordOriginal("nextSteps", dashNextSteps.textContent);
    }

    if (dashMidtermSummary && midtermSummaryCard) {
      const summaryInput = buildMidtermSummaryInput(midterm, goals, project);
      dashMidtermSummary.textContent = summaryInput || "No midterm summary provided yet.";
      midtermSummaryCard.style.display = "block";
      setAIHelper("midtermSummary", aiGeneratedState.midtermSummary);
    }

    wireCopyButtons();
    wireAIButtons();
    wireRevertButtons();

    const midtermDashboardPayload = {
      quickSummary: dashResults ? dashResults.textContent : "",
      goalsCompleted: midtermCompleted.map(g => g.label || ""),
      painPointsAddressed: midtermAddressedPain,
      originalPainPoints: selectedUserPains.map(p => p.label || ""),
      challengesText: dashChallenges ? dashChallenges.textContent : "",
      resultsImpactText: dashResults ? dashResults.textContent : "",
      keyLearningsText: dashLearnings ? dashLearnings.textContent : "",
      keyDecisions: getDecisions()
    };
    setCaseStudyButton(projectPayloadBase, midtermDashboardPayload);
    if (caseStudyBtn) caseStudyBtn.style.display = "none";
    if (caseStudyCard) caseStudyCard.style.display = "none";

    // Kickoff baseline placeholders suppressed in midterm view
    return;
  }

  // ---------- KICKOFF-ONLY BASELINE VIEW ----------
  if (!hasMidterm && !hasFinal) {
    // Hide all narrative cards when only kickoff data exists; show only the goals table card
    const allDashCards = Array.from(document.querySelectorAll(".dash-card"));
    allDashCards.forEach((card, idx) => {
      card.style.setProperty("display", idx === 0 ? "block" : "none", "important");
    });
    setGoalsCompletedTitle(0);
    setPainPointsTitle(0);
    setChallengesTitle(0);
    if (caseStudyCard) caseStudyCard.style.display = "none";
    const keyDecisionsCard = document.getElementById("dashNextSteps")
      ? document.getElementById("dashNextSteps").closest(".dash-card")
      : null;
    if (keyDecisionsCard) keyDecisionsCard.style.setProperty("display", "none", "important");
    if (caseStudyBtn) caseStudyBtn.style.display = "none";

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

    return;
  }

  // What we shipped → baseline business goals
  if (dashOutcomes) {
    setSectionContent("dashOutcomes", "Not captured yet.");
  }

  if (dashPain) {
    const addressedKickoffPain = getAddressedPain(selectedUserPains, "status");
    setSectionContent(
      "dashPain",
      addressedKickoffPain.length
        ? addressedKickoffPain.join(" • ")
        : "No pain points marked as addressed yet."
    );
    recordOriginal("pain", dashPain.textContent);
  }

  // Results & Impact → product / experience goals baseline
  if (dashResults) {
    setSectionContent("dashResults", "Not captured yet.");
    recordOriginal("results", dashResults.textContent);
  }

  // Challenges → user pains
  if (dashChallenges) {
    setSectionContent("dashChallenges", "Not captured yet.");
    recordOriginal("challenges", dashChallenges.textContent);
  }

  // Key Learnings → explanation
  if (dashLearnings) {
    setSectionContent("dashLearnings", "Not captured yet.");
    recordOriginal("learnings", dashLearnings.textContent);
  }

  // Next Steps → explanation
  if (dashNextSteps) {
    setSectionContent("dashNextSteps", "Not captured yet.");
    recordOriginal("nextSteps", dashNextSteps.textContent);
    const kdCard = dashNextSteps.closest(".dash-card");
    if (kdCard) kdCard.style.setProperty("display", "none", "important");
  }

  // Midterm summary card hidden in kickoff-only view
  if (midtermSummaryCard) {
    midtermSummaryCard.style.display = "none";
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
  wireRevertButtons();

  const kickoffPayload = {
    quickSummary: "",
    goalsCompleted: [],
    painPointsAddressed: [],
    originalPainPoints: selectedUserPains.map(p => p.label || ""),
    challengesText: dashChallenges ? dashChallenges.textContent : "",
    resultsImpactText: dashResults ? dashResults.textContent : "",
    keyLearningsText: dashLearnings ? dashLearnings.textContent : "",
    keyDecisions: getDecisions()
  };
  setCaseStudyButton(projectPayloadBase, kickoffPayload);
  if (caseStudyBtn) caseStudyBtn.style.display = "none";
}
