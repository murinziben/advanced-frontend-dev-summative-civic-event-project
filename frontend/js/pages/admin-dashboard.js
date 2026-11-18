/*
 * Admin dashboard (admin/dashboard.html)
 * ---------------------------------------------------------------
 * API: GET /api/dashboard/admin  (server-side: authenticate + authorize(['admin']))
 * Response data shape (backend/src/models/dashboard.model.js):
 *   users:        { total_users, active_users, inactive_users }
 *   events:       { total_events, upcoming_events, past_events }
 *   registrations:{ total_registrations }
 *   feedbacks:    { total_feedback }
 *   promos:       { total_promos }
 *   announcements:{ total_announcements }
 *   notifications:{ total_notifications }
 *   user_growth:  [ { month: "2026-11", new_users: "4" }, ... ]
 * PostgreSQL COUNT() comes back as text ("12"), so we convert with Number().
 *
 * Phase 10 will add Chart.js charts using user_growth and these counts.
 */
CivicApp.start(function () {
  function num(value) {
    return Number(value || 0).toLocaleString("en-GB");
  }

  function load() {
    var $stats = $("#admin-stats").html(CivicCards.statSkeletons(7));

    CivicApi.get("/dashboard/admin")
      .then(function (body) {
        var d = body.data || {};
        var users = d.users || {};
        var events = d.events || {};
        $stats.html(
          CivicCards.stat("Total users", num(users.total_users), "users", num(users.active_users) + " active · " + num(users.inactive_users) + " disabled") +
          CivicCards.stat("Total events", num(events.total_events), "calendar", num(events.upcoming_events) + " upcoming · " + num(events.past_events) + " past") +
          CivicCards.stat("Registrations", num(d.registrations && d.registrations.total_registrations), "ticket", "Across all events") +
          CivicCards.stat("Feedback received", num(d.feedbacks && d.feedbacks.total_feedback), "checkCircle", "Event ratings") +
          CivicCards.stat("Promos", num(d.promos && d.promos.total_promos), "play", "Videos uploaded") +
          CivicCards.stat("Announcements", num(d.announcements && d.announcements.total_announcements), "megaphone", "Audio updates") +
          CivicCards.stat("Notifications", num(d.notifications && d.notifications.total_notifications), "bell", "Sent in total")
        );
      })
      .catch(function (err) {
        $stats.html(CivicUI.errorState(err));
        $stats.find("[data-retry]").on("click", load);
      });
  }

  load();
});
