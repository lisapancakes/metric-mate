// =====================================
// Metric Mate – Dashboard Bootstrap
// Responsibilities:
//  - Load dashboard data on DOM ready
//  - Kick off rendering
// =====================================

document.addEventListener("DOMContentLoaded", () => {
  const data = loadDashboardData();
  renderDashboard(data);
});
