CivicApp.start(function () {
  var U = CivicUtils;
  var esc = U.escapeHtml;
  var icon = CivicUI.icon;

  var rows = [];
  var tab = U.getQueryParam("tab") || "upcoming";
  var $list = $("#registrations-list");

  function ended(r) {
    var end = r.ends_at || r.starts_at;
    return end && new Date(end).getTime() < Date.now();
  }

  function groups() {
    return {
      upcoming: rows.filter(function (r) { return r.status === "registered" && !ended(r); })
        .sort(function (a, b) { return new Date(a.starts_at) - new Date(b.starts_at); }),
      past: rows.filter(function (r) { return r.status === "registered" && ended(r); })
        .sort(function (a, b) { return new Date(b.starts_at) - new Date(a.starts_at); }),
      cancelled: rows.filter(function (r) { return r.status === "cancelled"; }),
    };
  }

  function renderTabs() {
    var g = groups();
    var tabs = [["upcoming", "Upcoming"], ["past", "Past"], ["cancelled", "Cancelled"]];
    $("#registration-tabs").html(
      tabs.map(function (t) {
        var active = t[0] === tab;
        return (
          '<button type="button" role="tab" id="tab-' + t[0] + '" data-tab="' + t[0] + '" aria-controls="registrations-list" aria-selected="' + active + '" tabindex="' + (active ? 0 : -1) + '" ' +
          'class="rounded-lg px-4 py-2 text-sm font-semibold transition ' + (active ? "bg-primary text-primary-foreground" : "text-foreground/75 hover:bg-muted") + '">' +
            t[1] + ' <span class="ml-1 rounded-full px-1.5 text-xs ' + (active ? "bg-white/20" : "bg-muted") + '">' + g[t[0]].length + "</span>" +
          "</button>"
        );
      }).join("")
    );
    $list.attr("aria-labelledby", "tab-" + tab);
  }

  function renderList() {
    var items = groups()[tab];
    if (!items.length) {
      var copy = {
        upcoming: ["No upcoming events", "When you register for an event it will show up here."],
        past: ["No past events yet", "Events you attended will be listed here."],
        cancelled: ["No cancelled registrations", "Registrations you cancel will be listed here."],
      }[tab];
      $list.html(CivicUI.emptyState(copy[0], copy[1], tab === "upcoming" ? '<a href="events.html" class="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Browse events</a>' : ""));
      return;
    }

    $list.html(
      items.map(function (r) {
        var badge = r.status === "cancelled"
          ? '<span class="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">Cancelled</span>'
          : ended(r)
            ? '<span class="rounded-full bg-secondary-soft px-2.5 py-1 text-xs font-semibold text-secondary-foreground">Attended</span>'
            : '<span class="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">Registered</span>';

        return (
          '<article class="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card sm:flex-row sm:items-center">' +
            '<div class="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-soft text-primary" aria-hidden="true">' +
              '<span class="text-xs font-bold uppercase">' + esc(new Date(r.starts_at).toLocaleDateString("en-GB", { month: "short" })) + "</span>" +
              '<span class="text-2xl font-extrabold leading-none">' + esc(new Date(r.starts_at).getDate() || "") + "</span>" +
            "</div>" +
            '<div class="min-w-0 flex-1">' +
              '<div class="flex flex-wrap items-center gap-2">' + badge + "</div>" +
              '<h2 class="mt-1.5 text-base font-bold"><a class="hover:text-primary" href="event.html?id=' + encodeURIComponent(r.event_id) + '">' + esc(r.title) + "</a></h2>" +
              '<p class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">' +
                '<span class="inline-flex items-center gap-1.5">' + icon("calendar", "h-4 w-4") + esc(U.formatDate(r.starts_at)) + "</span>" +
                '<span class="inline-flex items-center gap-1.5">' + icon("clock", "h-4 w-4") + esc(U.formatTimeRange(r.starts_at, r.ends_at)) + "</span>" +
                '<span class="inline-flex items-center gap-1.5">' + icon("mapPin", "h-4 w-4") + esc(r.location || "") + "</span>" +
              "</p>" +
            "</div>" +
            '<div class="flex shrink-0 gap-2">' +
              '<a href="event.html?id=' + encodeURIComponent(r.event_id) + '" class="rounded-lg border border-input px-3 py-2 text-sm font-semibold hover:bg-muted">' +
                (ended(r) && r.status === "registered" ? "Rate event" : "View") + '<span class="sr-only"> ' + esc(r.title) + "</span></a>" +
              (tab === "upcoming"
                ? '<button type="button" data-cancel="' + esc(r.event_id) + '" data-title="' + esc(r.title) + '" class="rounded-lg border border-destructive/30 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive-soft">Cancel<span class="sr-only"> registration for ' + esc(r.title) + "</span></button>"
                : "") +
            "</div>" +
          "</article>"
        );
      }).join("")
    );
  }

  function render() {
    renderTabs();
    renderList();
  }

  function load() {
    $list.html(CivicUI.skeletonCards(3, false));
    CivicApi.get("/event-registrations/my-registrations")
      .then(function (body) {
        rows = body.data || [];
        render();
      })
      .catch(function (err) {
        $list.html(CivicUI.errorState(err));
        $list.find("[data-retry]").on("click", load);
      });
  }

  $("#registration-tabs").on("click", "[data-tab]", function () {
    tab = $(this).attr("data-tab");
    history.replaceState(null, "", "?tab=" + tab);
    render();
    $("#tab-" + tab).trigger("focus");
  });
  // Arrow keys follow the WAI-ARIA tabs pattern.
  $("#registration-tabs").on("keydown", "[role=tab]", function (e) {
    var order = ["upcoming", "past", "cancelled"];
    var i = order.indexOf($(this).attr("data-tab"));
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      var next = order[(i + (e.key === "ArrowRight" ? 1 : order.length - 1)) % order.length];
      $("#tab-" + next).trigger("click");
    }
  });

  $list.on("click", "[data-cancel]", function () {
    var $btn = $(this);
    var eventId = $btn.attr("data-cancel");
    var title = $btn.attr("data-title");

    CivicUI.confirm({
      title: "Cancel your registration?",
      message: "You'll lose your spot at " + title + ". The online system doesn't let you register again for the same event after cancelling.",
      confirmText: "Cancel registration",
      cancelText: "Keep my spot",
      danger: true,
    }).then(function (ok) {
      if (!ok) return;
      CivicUI.setButtonLoading($btn, true, "Cancelling…");
      CivicApi.post("/event-registrations/cancel", { event_id: eventId })
        .then(function () {
          rows.forEach(function (r) { if (r.event_id === eventId) r.status = "cancelled"; });
          CivicUI.toast("success", "Your registration for " + title + " was cancelled.");
          render();
          $("#tab-" + tab).trigger("focus");
        })
        .catch(function (err) {
          CivicUI.setButtonLoading($btn, false);
          CivicUI.toast("error", err.message);
        });
    });
  });

  load();
});
