/*
 * CivicAdminLayout – the dark-green sidebar used on every admin page.
 * ---------------------------------------------------------------
 * Brief: "Left or top sidebar for Dashboard pages (admin)".
 *  - Large screens: a sticky sidebar on the left (uses the design's
 *    "sidebar" colours from css/styles.css).
 *  - Small screens: the same links as a scrollable row of tabs.
 *
 * Every admin page has <body data-admin-page="events"> (etc.) so the
 * current link is highlighted, and calls CivicAdminLayout.init().
 *
 * ROLE GUARD NOTE: admin pages are already protected by data-guard="admin"
 * (js/core/guards.js); this file only draws navigation.
 */
window.CivicAdminLayout = (function () {
  var U = window.CivicUtils;
  var icon = function (n, c) { return window.CivicUI.icon(n, c); };

  var LINKS = [
    { key: "dashboard", label: "Dashboard", href: "admin/dashboard.html", icon: "layout" },
    { key: "events", label: "Events", href: "admin/events.html", icon: "calendar" },
    { key: "announcements", label: "Announcements", href: "admin/announcements.html", icon: "megaphone" },
    { key: "promos", label: "Promos", href: "admin/promos.html", icon: "play" },
    { key: "users", label: "Users", href: "admin/users.html", icon: "users" },
    { key: "notifications", label: "Notifications", href: "admin/notifications.html", icon: "bell" },
  ];

  function init() {
    var current = document.body.getAttribute("data-admin-page");

    var side = LINKS.map(function (l) {
      var active = l.key === current;
      return (
        '<a href="' + U.url(l.href) + '"' + (active ? ' aria-current="page"' : "") +
        ' class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ' +
        (active ? "bg-sidebar-accent text-white" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white") + '">' +
        icon(l.icon, "h-4 w-4") + l.label + "</a>"
      );
    }).join("");

    $("#admin-sidebar").html(
      '<nav aria-label="Administration" class="sticky top-24 rounded-2xl bg-sidebar p-4 shadow-card">' +
        '<p class="px-3 pb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-sidebar-foreground/60">Administration</p>' +
        '<div class="space-y-1">' + side + "</div>" +
        '<div class="mt-6 rounded-lg bg-sidebar-accent/50 p-3 text-xs text-sidebar-foreground/80">' +
          icon("shield", "mb-1 h-4 w-4") + "Admin tools are visible only to administrators. The server checks your role on every request." +
        "</div>" +
      "</nav>"
    );

    var tabs = LINKS.map(function (l) {
      var active = l.key === current;
      return (
        '<a href="' + U.url(l.href) + '"' + (active ? ' aria-current="page"' : "") +
        ' class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ' +
        (active ? "bg-sidebar text-white" : "bg-card text-foreground/80 border border-border") + '">' +
        icon(l.icon, "h-4 w-4") + l.label + "</a>"
      );
    }).join("");
    $("#admin-mobile-nav").html('<nav aria-label="Administration (mobile)" class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">' + tabs + "</nav>");
  }

  /** "Published" / "Draft" pill used in admin tables. */
  function statusBadge(published) {
    return window.CivicUtils.toBool(published)
      ? '<span class="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary"><span class="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true"></span>Published</span>'
      : '<span class="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground"><span class="h-1.5 w-1.5 rounded-full bg-muted-foreground" aria-hidden="true"></span>Unpublished</span>';
  }

  /** Grey rows while a table loads. */
  function tableSkeleton(cols, rows) {
    var html = "";
    for (var r = 0; r < (rows || 5); r++) {
      html += "<tr>";
      for (var c = 0; c < cols; c++) html += '<td class="px-4 py-4"><div class="skeleton h-4 ' + (c === 0 ? "w-40" : "w-20") + '"></div></td>';
      html += "</tr>";
    }
    return html;
  }

  /** A full-width table row holding a message (empty or error). */
  function tableMessage(cols, html) {
    return '<tr><td colspan="' + cols + '" class="p-4">' + html + "</td></tr>";
  }

  return { init: init, statusBadge: statusBadge, tableSkeleton: tableSkeleton, tableMessage: tableMessage };
})();
