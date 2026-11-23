CivicApp.start(function () {
  var U = CivicUtils;
  var esc = U.escapeHtml;
  CivicAdminLayout.init();

  var events = [];
  var page = 1;
  var PER_PAGE = 10;
  var $body = $("#events-body");
  if (U.getQueryParam("q")) $("#search").val(U.getQueryParam("q"));

  function filtered() {
    var q = $("#search").val().trim().toLowerCase();
    var when = $("#when").val();
    var now = Date.now();
    return events.filter(function (e) {
      var end = new Date(e.ends_at || e.starts_at).getTime();
      if (when === "upcoming" && end < now) return false;
      if (when === "past" && end >= now) return false;
      return !q || [e.title, e.location, e.description].join(" ").toLowerCase().indexOf(q) !== -1;
    });
  }

  function render() {
    var list = filtered();
    $("#events-count").text(list.length + (list.length === 1 ? " event" : " events"));

    if (!list.length) {
      $body.html(CivicAdminLayout.tableMessage(5, CivicUI.emptyState(
        events.length ? "No events match your search" : "No events yet",
        events.length ? "Try another search or filter." : "Create the first event so residents can register.",
        events.length ? "" : '<a href="event-form.html" class="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Create event</a>'
      )));
      $("#events-pagination").empty();
      return;
    }

    if (page > CivicPagination.totalPages(list.length, PER_PAGE)) page = 1;

    $body.html(
      CivicPagination.slice(list, page, PER_PAGE).map(function (e) {
        var img = CivicCards.eventImage(e);
        var timing = CivicCards.eventTiming(e);
        return (
          '<tr class="border-b border-border last:border-0 hover:bg-muted/40">' +
            '<td class="px-4 py-3">' +
              '<div class="flex items-center gap-3">' +
                (img ? '<img src="' + esc(img) + '" alt="" class="h-11 w-14 shrink-0 rounded-md object-cover" loading="lazy" />'
                     : '<div class="flex h-11 w-14 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary" aria-hidden="true">' + CivicUI.icon("calendar", "h-4 w-4") + "</div>") +
                '<div class="min-w-0"><a href="../event.html?id=' + encodeURIComponent(e.id) + '" class="font-semibold hover:text-primary">' + esc(e.title) + "</a>" +
                '<p class="truncate text-xs text-muted-foreground">' + esc(e.location || "—") + "</p></div>" +
              "</div>" +
            "</td>" +
            '<td class="whitespace-nowrap px-4 py-3 text-sm">' + esc(U.formatDate(e.starts_at)) + '<br><span class="text-xs text-muted-foreground">' + esc(U.formatTimeRange(e.starts_at, e.ends_at)) + "</span></td>" +
            '<td class="px-4 py-3"><span class="rounded-full px-2.5 py-1 text-xs font-semibold ' + timing.cls + '">' + timing.label + "</span></td>" +
            // The backend can't unpublish events, so the status is shown without a toggle.
            '<td class="px-4 py-3">' + CivicAdminLayout.statusBadge(e.published) + "</td>" +
            '<td class="px-4 py-3">' +
              '<div class="flex justify-end gap-1.5">' +
                '<a href="../event.html?id=' + encodeURIComponent(e.id) + '#attendees" class="rounded-lg border border-input px-2.5 py-1.5 text-xs font-semibold hover:bg-muted">Registrants<span class="sr-only"> for ' + esc(e.title) + "</span></a>" +
                '<a href="event-form.html?id=' + encodeURIComponent(e.id) + '" class="rounded-lg border border-input px-2.5 py-1.5 text-xs font-semibold hover:bg-muted">Edit<span class="sr-only"> ' + esc(e.title) + "</span></a>" +
                '<button type="button" data-delete="' + esc(e.id) + '" data-title="' + esc(e.title) + '" class="rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive-soft">Delete<span class="sr-only"> ' + esc(e.title) + "</span></button>" +
              "</div>" +
            "</td>" +
          "</tr>"
        );
      }).join("")
    );

    CivicPagination.render("#events-pagination", {
      page: page, totalItems: list.length, perPage: PER_PAGE,
      onChange: function (p) { page = p; render(); },
    });
  }

  function load() {
    $body.html(CivicAdminLayout.tableSkeleton(5, 5));
    CivicApi.get("/events")
      .then(function (res) {
        events = (res.data || []).sort(function (a, b) { return new Date(b.starts_at) - new Date(a.starts_at); });
        render();
      })
      .catch(function (err) {
        $body.html(CivicAdminLayout.tableMessage(5, CivicUI.errorState(err)));
        $body.find("[data-retry]").on("click", load);
      });
  }

  $("#search").on("input", U.debounce(function () { page = 1; render(); }, 200));
  $("#when").on("change", function () { page = 1; render(); });

  $body.on("click", "[data-delete]", function () {
    var $btn = $(this);
    var id = $btn.attr("data-delete");
    var title = $btn.attr("data-title");
    CivicUI.confirm({
      title: "Delete this event?",
      message: "“" + title + "” will be permanently removed. This can't be undone.",
      confirmText: "Delete event",
      danger: true,
    }).then(function (ok) {
      if (!ok) return;
      CivicUI.setButtonLoading($btn, true, "Deleting…");
      CivicApi.del("/events/" + encodeURIComponent(id))
        .then(function () {
          events = events.filter(function (e) { return e.id !== id; });
          CivicUI.toast("success", "“" + title + "” was deleted.");
          render();
        })
        .catch(function (err) {
          CivicUI.setButtonLoading($btn, false);
          // Registrations reference the event without ON DELETE CASCADE.
          CivicUI.toast("error", /foreign key|violates/i.test(err.message || "")
            ? "“" + title + "” can't be deleted because people have registered for it."
            : err.message);
        });
    });
  });

  load();
});
