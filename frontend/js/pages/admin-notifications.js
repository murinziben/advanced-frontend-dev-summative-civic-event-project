CivicApp.start(function () {
  var U = CivicUtils;
  var esc = U.escapeHtml;
  CivicAdminLayout.init();

  var items = [];
  var $body = $("#notifications-body");
  var page = 1;
  var PER_PAGE = 10;

  // The backend has no route for custom broadcasts; they're created automatically with events, announcements and promos.
  function render() {
    var q = $("#search").val().trim().toLowerCase();
    var type = $("#type").val();
    var list = items.filter(function (n) {
      if (type && n.type !== type) return false;
      return !q || (n.title + " " + n.message).toLowerCase().indexOf(q) !== -1;
    });
    $("#notifications-count").text(list.length + (list.length === 1 ? " notification" : " notifications"));

    if (!list.length) {
      $body.html(CivicAdminLayout.tableMessage(4, CivicUI.emptyState("No notifications", items.length ? "Nothing matches your filters." : "Notifications appear when you create events, announcements or promos.")));
      $("#notifications-pagination").empty();
      return;
    }

    if (page > CivicPagination.totalPages(list.length, PER_PAGE)) page = 1;
    CivicPagination.render("#notifications-pagination", {
      page: page, totalItems: list.length, perPage: PER_PAGE,
      onChange: function (p) { page = p; render(); },
    });

    $body.html(
      CivicPagination.slice(list, page, PER_PAGE).map(function (n) {
        return (
          '<tr class="border-b border-border last:border-0 hover:bg-muted/40">' +
            '<td class="px-4 py-3"><p class="font-semibold">' + esc(n.title) + '</p><p class="text-sm text-muted-foreground">' + esc(n.message) + "</p></td>" +
            '<td class="px-4 py-3"><span class="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold capitalize">' + esc(n.type || "system") + "</span>" +
              '<p class="mt-1 text-xs text-muted-foreground">' + (n.recipient_id ? "Targeted" : "Broadcast") + "</p></td>" +
            '<td class="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">' + esc(U.formatDateTime(n.created_at)) + "</td>" +
            '<td class="px-4 py-3 text-right"><button type="button" data-delete="' + esc(n.id) + '" class="rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive-soft">Delete<span class="sr-only"> ' + esc(n.title) + "</span></button></td>" +
          "</tr>"
        );
      }).join("")
    );
  }

  function load() {
    $body.html(CivicAdminLayout.tableSkeleton(4, 5));
    CivicApi.get("/notifications")
      .then(function (res) { items = res.data || []; render(); })
      .catch(function (err) {
        $body.html(CivicAdminLayout.tableMessage(4, CivicUI.errorState(err)));
        $body.find("[data-retry]").on("click", load);
      });
  }

  $body.on("click", "[data-delete]", function () {
    var id = $(this).attr("data-delete");
    var n = items.filter(function (x) { return x.id === id; })[0];
    CivicUI.confirm({ title: "Delete this notification?", message: "“" + n.title + "” will disappear for every resident.", confirmText: "Delete", danger: true })
      .then(function (ok) {
        if (!ok) return;
        var backup = items.slice();
        items = items.filter(function (x) { return x.id !== id; });
        render();
        CivicApi.del("/notifications/" + encodeURIComponent(id))
          .then(function () { CivicUI.toast("success", "Notification deleted."); CivicLayout.refreshUnreadCount(); })
          .catch(function (err) {
            items = backup;
            render();
            CivicUI.toast("error", "Couldn't delete: " + err.message);
          });
      });
  });

  $("#search").on("input", U.debounce(function () { page = 1; render(); }, 200));
  $("#type").on("change", function () { page = 1; render(); });
  load();
});
