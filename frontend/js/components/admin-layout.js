window.CivicAdminLayout = (function () {
  var U = window.CivicUtils;
  var esc = U.escapeHtml;
  var icon = function (n, c) { return window.CivicUI.icon(n, c); };
  var COLLAPSE_KEY = "civic_sidebar_collapsed";

  var LINKS = [
    { key: "dashboard", label: "Dashboard", href: "admin/dashboard.html", icon: "home" },
    { key: "events", label: "Events", href: "admin/events.html", icon: "calendar" },
    { key: "announcements", label: "Announcements", href: "admin/announcements.html", icon: "megaphone" },
    { key: "promos", label: "Promotions", href: "admin/promos.html", icon: "tag" },
    { key: "users", label: "Users", href: "admin/users.html", icon: "users" },
    { key: "notifications", label: "Notifications", href: "admin/notifications.html", icon: "bell" },
  ];
  var ACCOUNT_LINKS = [
    { label: "My profile", href: "profile.html", icon: "user" },
    { label: "View public site", href: "index.html", icon: "eye" },
  ];

  function current() { return document.body.getAttribute("data-admin-page"); }

  function navItem(l, active) {
    return (
      '<a href="' + U.url(l.href) + '" data-nav-link title="' + esc(l.label) + '"' + (active ? ' aria-current="page"' : "") +
      ' class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ' +
      (active ? "bg-primary text-white shadow-sm shadow-primary/30" : "text-sidebar-foreground hover:bg-primary-soft hover:text-primary") + '">' +
        '<span class="shrink-0">' + icon(l.icon, "h-5 w-5") + "</span>" +
        '<span data-collapse-hide class="truncate">' + esc(l.label) + "</span>" +
      "</a>"
    );
  }

  function sidebarHtml() {
    var cur = current();
    return (
      '<div class="flex h-full flex-col">' +
        '<div class="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-4">' +
          '<a href="' + U.url("admin/dashboard.html") + '" class="flex items-center gap-2.5 font-bold tracking-tight text-navy">' +
            '<img src="' + U.url("assets/images/logo-icon.png") + '" alt="" width="36" height="36" class="h-9 w-9 shrink-0" />' +
            '<span data-collapse-hide class="text-lg">Civic<span class="text-primary">Events</span></span>' +
          "</a>" +
          '<button type="button" id="sidebar-collapse" class="hidden rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:block" aria-label="Collapse sidebar" aria-pressed="false">' +
            '<span data-collapse-icon class="block transition">' + icon("chevronsLeft", "h-4 w-4") + "</span>" +
          "</button>" +
          '<button type="button" id="sidebar-close" class="rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden" aria-label="Close admin menu">' + icon("x", "h-5 w-5") + "</button>" +
        "</div>" +
        '<nav aria-label="Administration" class="flex-1 overflow-y-auto px-3 py-4">' +
          '<p data-collapse-hide class="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>' +
          '<div class="space-y-1">' + LINKS.map(function (l) { return navItem(l, l.key === cur); }).join("") + "</div>" +
          '<p data-collapse-hide class="mt-6 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Account</p>' +
          '<div class="space-y-1">' + ACCOUNT_LINKS.map(function (l) { return navItem(l, false); }).join("") + "</div>" +
        "</nav>" +
        '<div data-collapse-hide class="m-3 rounded-xl border border-primary/10 bg-primary-soft p-4 text-center">' +
          '<span class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-card text-primary shadow-card">' + icon("calendarPlus", "h-6 w-6") + "</span>" +
          '<p class="mt-3 text-sm font-semibold text-navy">Plan better,<br>organize smarter</p>' +
          '<a href="' + U.url("admin/event-form.html") + '" class="mt-3 block rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary/90">Create event</a>' +
        "</div>" +
      "</div>"
    );
  }

  function breadcrumbHtml() {
    var cur = current();
    var page = LINKS.filter(function (l) { return l.key === cur; })[0];
    var parts = ['<li><a href="' + U.url("admin/dashboard.html") + '" class="flex items-center gap-1.5 hover:text-primary">' + icon("home", "h-4 w-4") + '<span class="sr-only sm:not-sr-only">Admin</span></a></li>'];
    if (page && page.key !== "dashboard") {
      var isForm = document.body.getAttribute("data-crumb") === "form";
      parts.push(
        '<li class="flex items-center gap-1.5">' + icon("chevronRight", "h-4 w-4 text-input") +
          (isForm ? '<a href="' + U.url(page.href) + '" class="hover:text-primary">' + esc(page.label) + "</a>"
                  : '<span class="font-semibold text-foreground" aria-current="page">' + esc(page.label) + "</span>") +
        "</li>"
      );
      if (isForm) {
        parts.push('<li class="flex items-center gap-1.5">' + icon("chevronRight", "h-4 w-4 text-input") +
          '<span class="font-semibold text-foreground" aria-current="page">' + (U.getQueryParam("id") ? "Edit" : "New") + "</span></li>");
      }
    } else {
      parts.push('<li class="flex items-center gap-1.5">' + icon("chevronRight", "h-4 w-4 text-input") + '<span class="font-semibold text-foreground" aria-current="page">Dashboard</span></li>');
    }
    return '<nav aria-label="Breadcrumb" class="min-w-0"><ol class="flex items-center gap-1.5 truncate text-sm text-muted-foreground">' + parts.join("") + "</ol></nav>";
  }

  function openDrawer() {
    $("#admin-sidebar").removeClass("-translate-x-full");
    $("#admin-backdrop").removeClass("hidden");
    $("#admin-menu-button").attr("aria-expanded", "true");
    $("#admin-sidebar").find("a, button").filter(":visible").first().trigger("focus");
  }
  function closeDrawer(returnFocus) {
    if ($(window).width() >= 1024) return;
    $("#admin-sidebar").addClass("-translate-x-full");
    $("#admin-backdrop").addClass("hidden");
    $("#admin-menu-button").attr("aria-expanded", "false");
    if (returnFocus) $("#admin-menu-button").trigger("focus");
  }

  function setCollapsed(collapsed) {
    $("body").toggleClass("sidebar-collapsed", collapsed);
    $("#sidebar-collapse")
      .attr("aria-pressed", String(collapsed))
      .attr("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
    // Remembered so the layout doesn't jump between pages; storage may be blocked, and the preference is optional.
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0"); } catch (e) {  }
  }

  function init() {
    var $side = $("#admin-sidebar");
    $side.html(sidebarHtml());
    if (!$("#admin-backdrop").length) {
      $side.after('<div id="admin-backdrop" class="fixed inset-0 z-30 hidden bg-navy/40 lg:hidden" aria-hidden="true"></div>');
    }

    var saved = false;
    try { saved = localStorage.getItem(COLLAPSE_KEY) === "1"; } catch (e) {  }
    setCollapsed(saved);

    $("#sidebar-collapse").on("click", function () { setCollapsed(!$("body").hasClass("sidebar-collapsed")); });
    $("#sidebar-close").on("click", function () { closeDrawer(true); });
    $("#admin-backdrop").on("click", function () { closeDrawer(true); });

    // The menu button is drawn by CivicLayout, so its click is delegated from the document.
    $(document).off(".civicAdmin")
      .on("click.civicAdmin", "#admin-menu-button", function () {
        $(this).attr("aria-expanded") === "true" ? closeDrawer(true) : openDrawer();
      })
      .on("keydown.civicAdmin", function (e) {
        if (e.key === "Escape" && $("#admin-menu-button").attr("aria-expanded") === "true") closeDrawer(true);
      });
    $(window).off("resize.civicAdmin").on("resize.civicAdmin", U.debounce(function () {
      if ($(window).width() >= 1024) {
        $("#admin-backdrop").addClass("hidden");
        $("#admin-menu-button").attr("aria-expanded", "false");
      } else if ($("#admin-menu-button").attr("aria-expanded") !== "true") {
        $side.addClass("-translate-x-full");
      }
    }, 150));

    var q = U.getQueryParam("q");
    if (q) $("#admin-search").val(q);
  }

  function statusBadge(published) {
    return window.CivicUtils.toBool(published)
      ? '<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/15"><span class="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>Published</span>'
      : '<span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/15"><span class="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true"></span>Unpublished</span>';
  }

  function tableSkeleton(cols, rows) {
    var html = "";
    for (var r = 0; r < (rows || 5); r++) {
      html += "<tr>";
      for (var c = 0; c < cols; c++) html += '<td class="px-4 py-4"><div class="skeleton h-4 ' + (c === 0 ? "w-40" : "w-20") + '"></div></td>';
      html += "</tr>";
    }
    return html;
  }

  function tableMessage(cols, html) {
    return '<tr><td colspan="' + cols + '" class="p-4">' + html + "</td></tr>";
  }

  return {
    init: init,
    breadcrumbHtml: breadcrumbHtml,
    statusBadge: statusBadge,
    tableSkeleton: tableSkeleton,
    tableMessage: tableMessage,
  };
})();
