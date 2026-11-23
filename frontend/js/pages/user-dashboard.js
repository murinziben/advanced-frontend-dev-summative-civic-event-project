CivicApp.start(function () {
  var U = CivicUtils;
  var user = CivicAuth.getUser();
  $("#welcome").text("Welcome, " + user.full_name.split(" ")[0]);

  function num(value) {
    return Number(value || 0).toLocaleString("en-GB");
  }

  function loadStats() {
    var $stats = $("#user-stats").html(CivicCards.statSkeletons(4));

    Promise.all([CivicApi.get("/dashboard/me"), CivicApi.get("/notifications")])
      .then(function (results) {
        var d = results[0].data || {};
        // The backend's unread count can't know what was read in the browser, so we count locally.
        var unread = CivicNotifyStore.countUnread(results[1].data || []);
        $stats.html(
          CivicCards.stat("Events registered", num(d.registrations && d.registrations.total_registered_events), "ticket", "All time") +
          CivicCards.stat("Feedback given", num(d.feedbacks && d.feedbacks.total_feedbacks), "checkCircle", "Ratings you've left") +
          CivicCards.stat("Unread notifications", num(unread), "bell", "On this device") +
          CivicCards.stat("Announcements", num(d.announcements && d.announcements.total_announcements), "megaphone", "From the city")
        );
      })
      .catch(function (err) {
        $stats.html(CivicUI.errorState(err));
        $stats.find("[data-retry]").on("click", loadStats);
      });
  }

  function loadUpcoming() {
    var $list = $("#upcoming-registrations").html(CivicUI.skeletonCards(3, false));

    CivicApi.get("/event-registrations/my-registrations")
      .then(function (body) {
        var now = Date.now();
        var upcoming = (body.data || [])
          .filter(function (r) {
            return r.status === "registered" && (!r.ends_at || new Date(r.ends_at).getTime() >= now);
          })
          .sort(function (a, b) { return new Date(a.starts_at) - new Date(b.starts_at); });

        if (!upcoming.length) {
          $list.html(
            CivicUI.emptyState(
              "You haven't registered for any upcoming events",
              "Browse what's on in the city and save your spot.",
              '<a href="events.html" class="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Browse events</a>'
            )
          );
          return;
        }

        $list.html(
          upcoming.slice(0, 3).map(function (r) {
            return (
              '<article class="rounded-xl border border-border bg-card p-5 shadow-card">' +
                '<p class="text-xs font-semibold text-muted-foreground">' + U.escapeHtml(U.formatDate(r.starts_at)) + "</p>" +
                '<h3 class="mt-1 font-bold"><a class="hover:text-primary" href="event.html?id=' + encodeURIComponent(r.event_id) + '">' + U.escapeHtml(r.title) + "</a></h3>" +
                '<p class="mt-2 flex items-center gap-2 text-sm text-muted-foreground">' + CivicUI.icon("mapPin", "h-4 w-4") + U.escapeHtml(r.location || "") + "</p>" +
                '<p class="mt-1 flex items-center gap-2 text-sm text-muted-foreground">' + CivicUI.icon("clock", "h-4 w-4") + U.escapeHtml(U.formatTimeRange(r.starts_at, r.ends_at)) + "</p>" +
              "</article>"
            );
          }).join("")
        );
      })
      .catch(function (err) {
        $list.html(CivicUI.errorState(err));
        $list.find("[data-retry]").on("click", loadUpcoming);
      });
  }

  loadStats();
  loadUpcoming();
});
