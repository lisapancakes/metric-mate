// dashboard-link.js
// Shared helpers to open the Metric Mate dashboard from any stage.

// Safely parse JSON or return null
function safeParse(json) {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch (e) {
    console.warn("Failed to parse JSON in dashboard-link.js", e);
    return null;
  }
}

// Kickoff-only or Kickoff + Midterm + Final (if present later)
function buildDashboardPayload() {
  const kickoff = safeParse(localStorage.getItem("metricMateKickoff"));
  const midterm = safeParse(localStorage.getItem("metricMateMidterm"));
  const final   = safeParse(localStorage.getItem("metricMateFinal")); // optional (future)

  return { kickoff, midterm, final };
}

// Only register helpers if the page hasn't already defined its own versions.
if (!window.openDashboardFromKickoff) {
  window.openDashboardFromKickoff = function openDashboardFromKickoff() {
    const payload = buildDashboardPayload();

    if (!payload.kickoff) {
      alert("No kickoff data found yet. Please complete the kickoff survey first.");
      return;
    }

    try {
      localStorage.setItem("metricMateDashboard", JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to save dashboard payload for kickoff", e);
    }

    window.open("dashboard.html", "_blank", "noopener");
  };
}

if (!window.openDashboardFromMidterm) {
  window.openDashboardFromMidterm = function openDashboardFromMidterm() {
    const payload = buildDashboardPayload();

    if (!payload.kickoff && !payload.midterm) {
      alert("No mid-project data found yet. Please complete the mid-project review first.");
      return;
    }

    try {
      localStorage.setItem("metricMateDashboard", JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to save dashboard payload for midterm", e);
    }

    window.open("dashboard.html", "_blank", "noopener");
  };
}

// You already have an openDashboard() in final.js that passes kickoff + midterm + final.
// If you ever want to unify naming, you can just have final.js call buildDashboardPayload()
// and reuse this pattern, but we’ll leave final.js as-is for now.
