CivicApp.start(function () {
  var U = CivicUtils;
  var esc = U.escapeHtml;
  var icon = CivicUI.icon;
  var isAdmin = CivicAuth.isAdmin();

  var items = [];
  var filter = "all";
  var openId = U.getQueryParam("id");
  var $list = $("#notifications-list");

  var TYPES = {
    event: { label: "Event", icon: "calendar", cls: "bg-primary-soft text-primary" },
    announcement: { label: "Announcement", icon: "megaphone", cls: "bg-secondary-soft text-secondary-foreground" },
    promo: { label: "Promo", icon: "play", cls: "bg-accent text-accent-foreground" },
  };
  function typeInfo(type) { return TYPES[type] || { label: "System", icon: "info", cls: "bg-muted text-muted-foreground" }; }

  function relatedLink(n) {
    var m = n.metadata || {};
    if (typeof m === "string") { try { m = JSON.parse(m); } catch (e) { m = {}; } }
    if (m.event_id) return { href: "event.html?id=" + encodeURIComponent(m.event_id), label: "View event" };
    if (m.announcement_id) return { href: "announcement.html?id=" + encodeURIComponent(m.announcement_id), label: "Listen to announcement" };
    if (m.promo_id) return { href: "promo.html?id=" + encodeURIComponent(m.promo_id), label: "Watch promo" };
    return null;
  }

  function render() {
    var unreadCount = CivicNotifyStore.countUnread(items);
    $("#unread-summary").text(unreadCount ? unreadCount + " unread" : "All caught up");
    $("#filter-all").attr("aria-pressed", String(filter === "all")).toggleClass("bg-primary text-primary-foreground", filter === "all").toggleClass("bg-card", filter !== "all");
    $("#filter-unread").attr("aria-pressed", String(filter === "unread")).toggleClass("bg-primary text-primary-foreground", filter === "unread").toggleClass("bg-card", filter !== "unread");
    $("#mark-all").prop("disabled", unreadCount === 0);

    var list = items.filter(function (n) { return filter === "all" || !CivicNotifyStore.isRead(n); });
    if (!list.length) {
      $list.html(CivicUI.emptyState(filter === "unread" ? "No unread notifications" : "No notifications yet",
        filter === "unread" ? "You've read everything. Nice!" : "When the city publishes new events, announcements or promos, you'll be notified here."));
      return;
    }

    $list.html(
      '<ul class="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-card">' +
        list.map(function (n) {
          var unread = !CivicNotifyStore.isRead(n);
          var t = typeInfo(n.type);
          var open = n.id === openId;
          var link = relatedLink(n);
          return (
            '<li data-id="' + esc(n.id) + '" class="' + (unread ? "bg-primary-soft/40" : "") + '">' +
              '<div class="flex items-start gap-3 p-4 sm:p-5">' +
                '<span class="mt-0.5 rounded-lg p-2 ' + t.cls + '">' + icon(t.icon, "h-4 w-4") + "</span>" +
                '<div class="min-w-0 flex-1">' +
                  '<button type="button" data-open="' + esc(n.id) + '" aria-expanded="' + open + '" aria-controls="detail-' + esc(n.id) + '" class="block w-full text-left">' +
                    '<span class="flex flex-wrap items-center gap-2">' +
                      (unread ? '<span class="h-2 w-2 rounded-full bg-primary" aria-hidden="true"></span><span class="sr-only">Unread:</span>' : "") +
                      '<span class="text-sm ' + (unread ? "font-bold" : "font-semibold") + '">' + esc(n.title) + "</span>" +
                    "</span>" +
                    '<span class="mt-0.5 block text-sm text-muted-foreground ' + (open ? "" : "truncate") + '">' + esc(n.message) + "</span>" +
                  "</button>" +
                  '<p class="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">' +
                    "<span>" + t.label + "</span>" +
                    '<time datetime="' + esc(n.created_at) + '" title="' + esc(U.formatDateTime(n.created_at)) + '">' + esc(U.timeAgo(n.created_at)) + "</time>" +
                    "<span>" + (n.recipient_id ? "Sent to you" : "Sent to everyone") + "</span>" +
                  "</p>" +
                  '<div id="detail-' + esc(n.id) + '" class="' + (open ? "" : "hidden") + ' mt-3 rounded-lg border border-border bg-background p-4">' +
                    '<p class="text-sm leading-relaxed">' + esc(n.message) + "</p>" +
                    '<p class="mt-2 text-xs text-muted-foreground">Received ' + esc(U.formatDateTime(n.created_at)) + "</p>" +
                    '<div class="mt-3 flex flex-wrap gap-2">' +
                      (link ? '<a href="' + link.href + '" class="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">' + link.label + "</a>" : "") +
                      '<button type="button" data-unread="' + esc(n.id) + '" class="rounded-lg border border-input px-3 py-2 text-xs font-semibold hover:bg-muted">Mark as unread</button>' +
                    "</div>" +
                  "</div>" +
                "</div>" +
                (isAdmin ? '<button type="button" data-delete="' + esc(n.id) + '" class="rounded-lg p-2 text-muted-foreground hover:bg-destructive-soft hover:text-destructive" aria-label="Delete notification: ' + esc(n.title) + '">' +
                  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="h-4 w-4" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></button>' : "") +
              "</div>" +
            "</li>"
          );
        }).join("") +
      "</ul>"
    );
  }

  function load() {
    $list.html(CivicUI.skeletonCards(3, false));
    CivicApi.get("/notifications")
      .then(function (body) {
        items = body.data || [];
        if (openId) {
          CivicNotifyStore.markRead(openId);
          if (!items.some(function (n) { return n.id === openId; })) openId = null;
        }
        render();
        if (openId) $list.find('[data-open="' + openId + '"]').trigger("focus");
      })
      .catch(function (err) {
        $list.html(CivicUI.errorState(err));
        $list.find("[data-retry]").on("click", load);
      });
  }

  $list.on("click", "[data-open]", function () {
    var id = $(this).attr("data-open");
    openId = openId === id ? null : id;
    // Marked read immediately: it's stored locally, so it can't fail.
    if (openId) CivicNotifyStore.markRead(id);
    render();
    $list.find('[data-open="' + id + '"]').trigger("focus");
  });

  $list.on("click", "[data-unread]", function () {
    var id = $(this).attr("data-unread");
    CivicNotifyStore.markUnread(id);
    openId = null;
    render();
    $list.find('[data-open="' + id + '"]').trigger("focus");
    CivicUI.toast("info", "Marked as unread.");
  });

  $list.on("click", "[data-delete]", function () {
    var id = $(this).attr("data-delete");
    var n = items.filter(function (x) { return x.id === id; })[0];
    CivicUI.confirm({ title: "Delete this notification?", message: "“" + n.title + "” will be removed for everyone who can see it.", confirmText: "Delete", danger: true })
      .then(function (ok) {
        if (!ok) return;
        // Removed straight away and restored if the server refuses.
        var backup = items.slice();
        items = items.filter(function (x) { return x.id !== id; });
        render();
        CivicApi.del("/notifications/" + encodeURIComponent(id))
          .then(function () {
            CivicUI.toast("success", "Notification deleted.");
            CivicLayout.refreshUnreadCount();
          })
          .catch(function (err) {
            items = backup;
            render();
            CivicUI.toast("error", "Couldn't delete: " + err.message);
          });
      });
  });

  $("#filter-all").on("click", function () { filter = "all"; render(); });
  $("#filter-unread").on("click", function () { filter = "unread"; render(); });
  $("#mark-all").on("click", function () {
    CivicNotifyStore.markAllRead(items);
    render();
    CivicUI.toast("success", "All notifications marked as read.");
  });

  load();
});
