// Metric Mate - Dashboard
// Renders a visual overview + a Google Doc–ready export.

function $(id) {
  return document.getElementById(id);
}

function safeGet(obj, path, fallback = "") {
  try {
    const parts = path.split(".");
    let cur = obj;
    for (const p of parts) {
      if (!cur || !(p in cur)) return fallback;
      cur = cur[p];
    }
    return cur ?? fallback;
  } catch {
    return fallback;
  }
}

function parsePayloadFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("data");
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw));
  } catch (err) {
    console.error("Failed to parse dashboard payload", err);
    return null;
  }
}

function renderError(msg) {
  const panel = $("errorPanel");
  if (!panel) return;
  panel.textContent = msg;
  panel.style.display = "block";
}

// Basic “health chips” and dot bar
function getHealthStatus(midterm, final) {
  // For now: only midterm healthScore
  const score = midterm && typeof midterm.healthScore === "number"
    ? midterm.healthScore
    : null;

  if (!score) {
    return { label: "Unknown", level: "yellow", score: null };
  }

  if (score >= 4) return { label: "On track", level: "green", score };
  if (score >= 3) return { label: "Needs attention", level: "yellow", score };
  return { label: "At risk", level: "red", score };
}

function buildHealthDots(score) {
  const max = 5;
  const s = Math.max(1, Math.min(max, score || 3));
  let dots = "";
  for (let i = 1; i <= max; i++) {
    dots += `<span class="health-dot ${i <= s ? "filled" : ""}"></span>`;
  }
  return `<div class="health-dots">${dots}</div>`;
}

function buildGoalsTable(goals = []) {
  if (!goals.length) {
    return `<p class="subdued">No goals captured for this area.</p>`;
  }

  const rows = goals
    .filter((g) => g.selected)
    .map((g) => {
      const label = g.label || "Goal";
      const currentScore =
        typeof g.currentScore === "number" ? g.currentScore : null;
      const width = currentScore
        ? `${Math.max(5, Math.min(100, (currentScore / 5) * 100))}%`
        : "0%";

      return `
        <tr>
          <td>${label}</td>
          <td>
            ${
              currentScore
                ? `
              <div class="score-pill">
                <span>${currentScore}/5</span>
                <div class="score-bar">
                  <span style="width:${width};"></span>
                </div>
              </div>
            `
                : `<span class="subdued">n/a</span>`
            }
          </td>
          <td class="subdued">
            Outcome notes → adjust in Google Doc
          </td>
        </tr>
      `;
    })
    .join("");

  if (!rows) {
    return `<p class="subdued">No priority goals were selected.</p>`;
  }

  return `
    <table class="goals-table">
      <thead>
        <tr>
          <th>Goal</th>
          <th>Kickoff score</th>
          <th>Outcome</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function buildDocExport(payload) {
  const kickoff = payload.kickoff || {};
  const midterm = payload.midterm || {};
  const final = payload.final || {};

  const info = kickoff.info || {};
  const dir = kickoff.directory || {};

  const projectName =
    info.projectName || info.name || final.projectName || "Untitled project";
  const client =
    final.client ||
    info.client ||
    (typeof info.clientId === "number" && Array.isArray(dir.clients)
      ? dir.clients[info.clientId]
      : "") ||
    "";
  const pm =
    final.pm ||
    info.pm ||
    (typeof info.pmId === "number" && Array.isArray(dir.pms)
      ? dir.pms[info.pmId]
      : "") ||
    "";
  const designer =
    final.designer ||
    info.designer ||
    (typeof info.designerId === "number" && Array.isArray(dir.designers)
      ? dir.designers[info.designerId]
      : "") ||
    "";
  const dev =
    final.dev ||
    info.dev ||
    (typeof info.devId === "number" && Array.isArray(dir.devs)
      ? dir.devs[info.devId]
      : "") ||
    "";

  const healthScore =
    typeof midterm.healthScore === "number" ? midterm.healthScore : null;

  let lines = [];

  lines.push("FINAL PROJECT REVIEW — CLIENT-FRIENDLY SUMMARY");
  lines.push("------------------------------------------------");
  lines.push(`Project: ${projectName}`);
  if (client) lines.push(`Client: ${client}`);
  if (pm) lines.push(`PM: ${pm}`);
  if (designer) lines.push(`Product Designer: ${designer}`);
  if (dev) lines.push(`Lead Developer: ${dev}`);
  if (final.date) lines.push(`Final review date: ${final.date}`);
  lines.push("");

  const bGoals = (kickoff.businessGoals || []).filter((g) => g.selected);
  const pGoals = (kickoff.productGoals || []).filter((g) => g.selected);

  if (bGoals.length || pGoals.length) {
    lines.push("Initial goals from kickoff:");
    if (bGoals.length) {
      lines.push("• Business goals:");
      bGoals.forEach((g) => {
        const score =
          typeof g.currentScore === "number" ? ` (${g.currentScore}/5)` : "";
        lines.push(`  - ${g.label || "Goal"}${score}`);
      });
    }
    if (pGoals.length) {
      lines.push("• Product / UX goals:");
      pGoals.forEach((g) => {
        const score =
          typeof g.currentScore === "number" ? ` (${g.currentScore}/5)` : "";
        lines.push(`  - ${g.label || "Goal"}${score}`);
      });
    }
    lines.push("");
  }

  if (healthScore) {
    lines.push(`Mid-project health (self-rated): ${healthScore}/5`);
    lines.push("");
  }

  if ((midterm.progressGood || "").trim()) {
    lines.push("At mid-project, here’s what was going well:");
    lines.push(midterm.progressGood.trim());
    lines.push("");
  }

  if ((midterm.progressOff || "").trim()) {
    lines.push("At mid-project, here’s what was off track / unclear:");
    lines.push(midterm.progressOff.trim());
    lines.push("");
  }

  if ((midterm.risks || "").trim()) {
    lines.push("Risks we were watching:");
    lines.push(midterm.risks.trim());
    lines.push("");
  }

  if ((midterm.nextSteps || "").trim()) {
    lines.push("Mid-project next steps:");
    lines.push(midterm.nextSteps.trim());
    lines.push("");
  }

  if ((final.outcomes || "").trim()) {
    lines.push("What we shipped:");
    lines.push(final.outcomes.trim());
    lines.push("");
  }

  if ((final.results || "").trim()) {
    lines.push("Results / impact:");
    lines.push(final.results.trim());
    lines.push("");
  }

  if ((final.wins || "").trim()) {
    lines.push("Biggest wins:");
    lines.push(final.wins.trim());
    lines.push("");
  }

  if ((final.challenges || "").trim()) {
    lines.push("Challenges / misses:");
    lines.push(final.challenges.trim());
    lines.push("");
  }

  if ((final.learnings || "").trim()) {
    lines.push("Key learnings:");
    lines.push(final.learnings.trim());
    lines.push("");
  }

  if ((final.nextSteps || "").trim()) {
    lines.push("Next steps / follow-ups:");
    lines.push(final.nextSteps.trim());
  }

  return lines.join("\n");
}

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    console.error("Copy failed", err);
  }
  document.body.removeChild(textarea);
}

function initDashboard() {
  const payload = parsePayloadFromUrl();
  if (!payload) {
    renderError(
      "No project data found. Open this dashboard from the Final Review page so it can pass in all context."
    );
    return;
  }

  const kickoff = payload.kickoff || {};
  const midterm = payload.midterm || {};
  const final = payload.final || {};

  // --- Header meta ---
  const info = kickoff.info || {};
  const dir = kickoff.directory || {};

  const projectName =
    final.projectName || info.projectName || info.name || "Untitled project";
  const client =
    final.client ||
    info.client ||
    (typeof info.clientId === "number" && Array.isArray(dir.clients)
      ? dir.clients[info.clientId]
      : "") ||
    "";
  const pm =
    final.pm ||
    info.pm ||
    (typeof info.pmId === "number" && Array.isArray(dir.pms)
      ? dir.pms[info.pmId]
      : "") ||
    "";
  const designer =
    final.designer ||
    info.designer ||
    (typeof info.designerId === "number" && Array.isArray(dir.designers)
      ? dir.designers[info.designerId]
      : "") ||
    "";
  const dev =
    final.dev ||
    info.dev ||
    (typeof info.devId === "number" && Array.isArray(dir.devs)
      ? dir.devs[info.devId]
      : "") ||
    "";

  const metaEl = $("projectMeta");
  if (metaEl) {
    const parts = [];
    parts.push(`<strong>${projectName}</strong>`);
    if (client) parts.push(`for ${client}`);
    metaEl.innerHTML = parts.join(" ");
    const roles = [];
    if (pm) roles.push(`PM: ${pm}`);
    if (designer) roles.push(`Product Designer: ${designer}`);
    if (dev) roles.push(`Lead Dev: ${dev}`);
    if (roles.length) {
      metaEl.innerHTML += `<br><span class="subdued">${roles.join(" · ")}</span>`;
    }
  }

  const status = getHealthStatus(midterm, final);
  const chipsEl = $("statusChips");
  if (chipsEl) {
    chipsEl.innerHTML = `
      <span class="chip ${status.level}">
        ${status.score ? `${status.score}/5 – ` : ""}${status.label}
      </span>
      <span class="chip">
        Kickoff → Midterm → Final captured
      </span>
    `;
  }

  // --- Main dashboard layout ---
  const root = $("app");
  if (!root) return;

  const businessGoals = kickoff.businessGoals || [];
  const productGoals = kickoff.productGoals || [];

  const midtermHealthDots = status.score
    ? buildHealthDots(status.score)
    : '<span class="subdued">No health score recorded</span>';

  const docExport = buildDocExport(payload);

  root.innerHTML = `
    <section class="grid">
      <article class="card">
        <h2>Mid-Project Health</h2>
        <div class="health-row">
          ${status.score ? `<strong>${status.score}/5</strong>` : ""}
          ${status.score ? midtermHealthDots : ""}
        </div>
        <div class="section-stack">
          ${
            (midterm.progressGood || "").trim()
              ? `<p><strong>What was going well</strong><br>${midterm.progressGood.trim()}</p>`
              : ""
          }
          ${
            (midterm.progressOff || "").trim()
              ? `<p><strong>What was off track / unclear</strong><br>${midterm.progressOff.trim()}</p>`
              : ""
          }
          ${
            (midterm.risks || "").trim()
              ? `<p><strong>Risks</strong><br>${midterm.risks.trim()}</p>`
              : ""
          }
          ${
            (midterm.decisions || "").trim()
              ? `<p><strong>Key decisions since kickoff</strong><br>${midterm.decisions.trim()}</p>`
              : ""
          }
          ${
            (midterm.nextSteps || "").trim()
              ? `<p><strong>Mid-project next steps</strong><br>${midterm.nextSteps.trim()}</p>`
              : ""
          }
          ${
            !(midterm.progressGood || midterm.progressOff || midterm.risks || midterm.decisions || midterm.nextSteps)
              ? `<p class="subdued">No mid-project notes captured yet.</p>`
              : ""
          }
        </div>
      </article>

      <article class="card">
        <h2>Final Review Snapshot</h2>
        <div class="section-stack">
          ${
            (final.outcomes || "").trim()
              ? `<p><strong>What we shipped</strong><br>${final.outcomes.trim()}</p>`
              : ""
          }
          ${
            (final.results || "").trim()
              ? `<p><strong>Results / impact</strong><br>${final.results.trim()}</p>`
              : ""
          }
          ${
            (final.wins || "").trim()
              ? `<p><strong>Biggest wins</strong><br>${final.wins.trim()}</p>`
              : ""
          }
          ${
            (final.challenges || "").trim()
              ? `<p><strong>Challenges / misses</strong><br>${final.challenges.trim()}</p>`
              : ""
          }
          ${
            (final.learnings || "").trim()
              ? `<p><strong>Key learnings</strong><br>${final.learnings.trim()}</p>`
              : ""
          }
          ${
            (final.nextSteps || "").trim()
              ? `<p><strong>Next steps / follow-ups</strong><br>${final.nextSteps.trim()}</p>`
              : ""
          }
          ${
            !(
              final.outcomes ||
              final.results ||
              final.wins ||
              final.challenges ||
              final.learnings ||
              final.nextSteps
            )
              ? `<p class="subdued">Fill out the Final Review survey to populate this section.</p>`
              : ""
          }
        </div>
      </article>
    </section>

    <section class="grid">
      <article class="card">
        <h2>Business Goals (Kickoff)</h2>
        <p class="subdued">
          Goals your team prioritized at the start of the project.
        </p>
        ${buildGoalsTable(businessGoals)}
      </article>

      <article class="card">
        <h2>Product / UX Goals (Kickoff)</h2>
        <p class="subdued">
          Experience improvements you aimed to deliver.
        </p>
        ${buildGoalsTable(productGoals)}
      </article>
    </section>

    <section class="card export-card">
      <h2>Google Doc–Ready Summary</h2>
      <p class="subdued">
        Paste this into a Google Doc and adjust wording, metrics, or screenshots as needed.
      </p>
      <textarea id="docExport" readonly>${docExport}</textarea>
      <div class="btn-row">
        <button type="button" class="btn btn-primary" id="copyDocExportBtn">
          <span>📋</span> Copy for Google Doc
        </button>
      </div>
    </section>
  `;

  const copyBtn = $("copyDocExportBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const txt = $("docExport")?.value || "";
      copyToClipboard(txt);
    });
  }
}

document.addEventListener("DOMContentLoaded", initDashboard);
