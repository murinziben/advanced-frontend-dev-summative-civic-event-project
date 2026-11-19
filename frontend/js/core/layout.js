/*
 * CivicLayout – shared header, footer and navigation.
 * ---------------------------------------------------------------
 * WHY: every page needs the same header and footer. Instead of copying
 * the HTML into 20 files, each page has two empty placeholders:
 *     <div id="site-header"></div>  ...  <div id="site-footer"></div>
 * and this script fills them in. Change the menu here → it changes everywhere.
 *
 * The header adapts to the user:
 *   - visitor:  Sign in / Create account buttons
 *   - user:     My Events link, bell, profile dropdown
 *   - admin:    Dashboard link, bell, profile dropdown (with admin links)
 */
window.CivicLayout = (function () {
  var U = window.CivicUtils;
  var esc = U.escapeHtml;
  var icon = function (n, c) { return window.CivicUI.icon(n, c); };

  /** Main navigation links. `show` decides who sees each link. */
  function navLinks() {
    var isAdmin = window.CivicAuth.isAdmin();
    var links = [
      { key: "home", label: "Home", href: "index.html" },
      { key: "events", label: "Events", href: "events.html" },
      { key: "announcements", label: "Announcements", href: "announcements.html" },
      { key: "promos", label: "Promos", href: "promos.html" },
    ];
    // ROLE-BASED NAVIGATION: admins get "Dashboard", everyone else "My Events".
    if (isAdmin) links.push({ key: "admin", label: "Dashboard", href: "admin/dashboard.html" });
    else links.push({ key: "my-events", label: "My Events", href: "my-registrations.html" });
    return links;
  }

  function logoHtml(extraClasses) {
    return (
      '<a href="' + U.url("index.html") + '" class="flex items-center gap-2.5 font-bold tracking-tight text-primary ' + (extraClasses || "") + '">' +
        '<span class="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-white shadow-sm">' + icon("landmark", "h-5 w-5") + "</span>" +
        '<span class="text-lg">CivicEvents</span>' +
        '<span class="sr-only">– home</span>' +
      "</a>"
    );
  }

  function renderHeader() {
    var current = document.body.getAttribute("data-page");
    var user = window.CivicAuth.getUser();
    var loggedIn = window.CivicAuth.isLoggedIn();

    var desktopLinks = navLinks()
      .map(function (l) {
        var active = l.key === current;
        return (
          '<a href="' + U.url(l.href) + '" class="rounded-lg px-3 py-2 text-sm font-medium transition-colors ' +
          (active ? "bg-primary-soft text-primary" : "text-foreground/75 hover:bg-muted hover:text-foreground") + '"' +
          (active ? ' aria-current="page"' : "") + ">" + l.label + "</a>"
        );
      })
      .join("");

    var mobileLinks = navLinks()
      .map(function (l) {
        var active = l.key === current;
        return (
          '<a href="' + U.url(l.href) + '" class="block rounded-lg px-3 py-2.5 text-base font-medium ' +
          (active ? "bg-primary-soft text-primary" : "hover:bg-muted") + '"' + (active ? ' aria-current="page"' : "") + ">" + l.label + "</a>"
        );
      })
      .join("");

    // Global search → goes to the events page with ?q=...
    var searchForm = function (id, extra) {
      return (
        '<form role="search" action="' + U.url("events.html") + '" method="get" class="relative ' + (extra || "") + '">' +
          '<label for="' + id + '" class="sr-only">Search events</label>' +
          '<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">' + icon("search", "h-4 w-4") + "</span>" +
          '<input id="' + id + '" name="q" type="search" placeholder="Search events…" ' +
            'class="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring" />' +
        "</form>"
      );
    };

    var rightSide;
    if (loggedIn) {
      rightSide =
        // Notification bell with unread count + drawer panel
        '<div class="relative" id="bell-menu">' +
          '<button type="button" id="nav-bell" class="relative rounded-lg p-2 text-foreground/75 hover:bg-muted hover:text-foreground" aria-label="Notifications" aria-expanded="false" aria-controls="bell-panel">' +
            icon("bell") +
            '<span id="nav-bell-count" class="absolute -right-0.5 -top-0.5 hidden min-w-[1.25rem] rounded-full bg-secondary px-1 text-center text-[11px] font-bold leading-5 text-white" aria-hidden="true"></span>' +
          "</button>" +
          '<div id="bell-panel" class="absolute right-0 top-full z-50 mt-2 hidden w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-lift" role="region" aria-label="Latest notifications">' +
            '<div class="flex items-center justify-between border-b border-border px-4 py-3">' +
              '<h2 class="text-sm font-bold">Notifications</h2>' +
              '<button type="button" id="bell-mark-all" class="text-xs font-semibold text-primary hover:underline">Mark all as read</button>' +
            "</div>" +
            '<div id="bell-list" class="max-h-96 overflow-y-auto"></div>' +
            '<a href="' + U.url("notifications.html") + '" class="block border-t border-border px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-muted">View all notifications</a>' +
          "</div>" +
        "</div>" +
        // Profile dropdown
        '<div class="relative" id="profile-menu">' +
          '<button type="button" id="profile-button" class="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-muted" aria-haspopup="true" aria-expanded="false" aria-controls="profile-dropdown">' +
            '<span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground" aria-hidden="true">' + esc(U.initials(user.full_name)) + "</span>" +
            '<span class="hidden max-w-[8rem] truncate text-sm font-semibold xl:inline">' + esc(user.full_name) + "</span>" +
            '<span class="sr-only">Open account menu</span>' +
            icon("chevronDown", "h-4 w-4 text-muted-foreground") +
          "</button>" +
          '<div id="profile-dropdown" class="absolute right-0 top-full z-50 mt-2 hidden w-64 overflow-hidden rounded-xl border border-border bg-card shadow-lift">' +
            '<div class="border-b border-border px-4 py-3">' +
              '<p class="truncate text-sm font-semibold">' + esc(user.full_name) + "</p>" +
              '<p class="truncate text-xs text-muted-foreground">' + esc(user.email) + "</p>" +
              '<span class="mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ' +
                (user.role === "admin" ? "bg-secondary-soft text-secondary-foreground" : "bg-primary-soft text-primary") + '">' +
                (user.role === "admin" ? "Administrator" : "Resident") + "</span>" +
            "</div>" +
            '<nav class="p-1.5 text-sm" aria-label="Account">' +
              (user.role === "admin"
                ? '<a href="' + U.url("admin/dashboard.html") + '" class="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted">' + icon("layout", "h-4 w-4") + "Admin dashboard</a>"
                : '<a href="' + U.url("dashboard.html") + '" class="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted">' + icon("layout", "h-4 w-4") + "My dashboard</a>" +
                  '<a href="' + U.url("my-registrations.html") + '" class="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted">' + icon("ticket", "h-4 w-4") + "My registrations</a>") +
              '<a href="' + U.url("profile.html") + '" class="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted">' + icon("user", "h-4 w-4") + "My profile</a>" +
              '<a href="' + U.url("notifications.html") + '" class="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted">' + icon("bell", "h-4 w-4") + "Notifications</a>" +
              '<button type="button" data-action="logout" class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-destructive hover:bg-destructive-soft">' + icon("logOut", "h-4 w-4") + "Sign out</button>" +
            "</nav>" +
          "</div>" +
        "</div>";
    } else {
      rightSide =
        '<a href="' + U.url("login.html") + '" class="rounded-lg border border-input bg-card px-3.5 py-2 text-sm font-semibold hover:bg-muted">Sign in</a>' +
        '<a href="' + U.url("signup.html") + '" class="hidden rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:inline-block">Create account</a>';
    }

    var html =
      '<a href="#main" class="skip-link">Skip to content</a>' +
      '<header class="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">' +
        '<div class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">' +
          logoHtml("shrink-0") +
          '<nav class="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">' + desktopLinks + "</nav>" +
          '<div class="ml-auto flex items-center gap-2">' +
            searchForm("global-search", "hidden w-52 xl:block") +
            rightSide +
            '<button type="button" id="mobile-menu-button" class="rounded-lg p-2 hover:bg-muted lg:hidden" aria-expanded="false" aria-controls="mobile-menu">' +
              '<span class="sr-only">Open main menu</span>' + icon("menu", "h-6 w-6") +
            "</button>" +
          "</div>" +
        "</div>" +
        // Mobile menu panel
        '<div id="mobile-menu" class="hidden border-t border-border bg-card px-4 pb-4 pt-3 lg:hidden">' +
          searchForm("mobile-search", "mb-3") +
          '<nav class="space-y-1" aria-label="Main (mobile)">' + mobileLinks + "</nav>" +
          (loggedIn ? "" :
            '<a href="' + U.url("signup.html") + '" class="mt-3 block rounded-lg bg-primary px-3 py-2.5 text-center font-semibold text-primary-foreground sm:hidden">Create account</a>') +
        "</div>" +
      "</header>";

    $("#site-header").html(html);
    bindHeaderEvents();
    if (loggedIn) refreshUnreadCount();
  }

  function bindHeaderEvents() {
    // Mobile menu toggle
    $("#mobile-menu-button").on("click", function () {
      var open = $(this).attr("aria-expanded") === "true";
      $(this).attr("aria-expanded", String(!open));
      $(this).find(".sr-only").text(open ? "Open main menu" : "Close main menu");
      $("#mobile-menu").toggleClass("hidden", open);
    });

    // Profile dropdown toggle
    $("#profile-button").on("click", function (e) {
      e.stopPropagation();
      closeBellPanel();
      var $btn = $(this);
      var $menu = $("#profile-dropdown");
      var open = $btn.attr("aria-expanded") === "true";
      $menu.toggleClass("hidden", open);
      $btn.attr("aria-expanded", String(!open));
      if (!open) $menu.find("a, button").first().trigger("focus");
    });

    // Notification drawer toggle
    $("#nav-bell").on("click", function (e) {
      e.stopPropagation();
      closeProfileMenu();
      var open = $(this).attr("aria-expanded") === "true";
      if (open) {
        closeBellPanel();
      } else {
        $("#bell-panel").removeClass("hidden");
        $(this).attr("aria-expanded", "true");
        renderBellList();
        refreshUnreadCount(); // fetch fresh data while the panel is open
      }
    });

    $("#bell-mark-all").on("click", function () {
      window.CivicNotifyStore.markAllRead(latestNotifications);
      renderBellList();
    });
  }

  function closeProfileMenu() {
    $("#profile-dropdown").addClass("hidden");
    $("#profile-button").attr("aria-expanded", "false");
  }

  function closeBellPanel() {
    $("#bell-panel").addClass("hidden");
    $("#nav-bell").attr("aria-expanded", "false");
  }

  /** Last list fetched from GET /api/notifications (used by the drawer). */
  var latestNotifications = null;

  /** Draws the 6 newest notifications inside the drawer. */
  function renderBellList() {
    var $list = $("#bell-list");
    if (!$list.length) return;
    if (latestNotifications === null) {
      $list.html('<div class="space-y-3 p-4" aria-hidden="true"><div class="skeleton h-4 w-3/4"></div><div class="skeleton h-3 w-1/2"></div><div class="skeleton h-4 w-2/3"></div></div>');
      return;
    }
    if (!latestNotifications.length) {
      $list.html('<p class="px-4 py-8 text-center text-sm text-muted-foreground">You\'re all caught up. No notifications yet.</p>');
      return;
    }
    $list.html(
      '<ul class="divide-y divide-border">' +
        latestNotifications.slice(0, 6).map(function (n) {
          var unread = !window.CivicNotifyStore.isRead(n);
          return (
            "<li>" +
              '<a href="' + U.url("notifications.html?id=" + encodeURIComponent(n.id)) + '" class="flex gap-3 px-4 py-3 hover:bg-muted">' +
                '<span class="mt-1.5 h-2 w-2 shrink-0 rounded-full ' + (unread ? "bg-secondary" : "bg-transparent") + '" aria-hidden="true"></span>' +
                '<span class="min-w-0 flex-1">' +
                  '<span class="block truncate text-sm ' + (unread ? "font-bold" : "font-medium") + '">' + (unread ? '<span class="sr-only">Unread: </span>' : "") + esc(n.title) + "</span>" +
                  '<span class="block truncate text-xs text-muted-foreground">' + esc(n.message) + "</span>" +
                  '<span class="mt-0.5 block text-[11px] text-muted-foreground">' + esc(U.timeAgo(n.created_at)) + "</span>" +
                "</span>" +
              "</a>" +
            "</li>"
          );
        }).join("") +
      "</ul>"
    );
  }

  /**
   * Document-level listeners are bound ONCE (not every time the header
   * re-renders), using a ".civicLayout" namespace so they never duplicate.
   */
  function bindGlobalEvents() {
    $(document)
      .off(".civicLayout")
      // Click outside the dropdown closes it
      .on("click.civicLayout", function (e) {
        if (!$(e.target).closest("#profile-menu").length) closeProfileMenu();
        if (!$(e.target).closest("#bell-menu").length) closeBellPanel();
      })
      // Esc closes an open dropdown and returns focus to its button
      .on("keydown.civicLayout", function (e) {
        if (e.key !== "Escape") return;
        if ($("#profile-button").attr("aria-expanded") === "true") {
          closeProfileMenu();
          $("#profile-button").trigger("focus");
        }
        if ($("#nav-bell").attr("aria-expanded") === "true") {
          closeBellPanel();
          $("#nav-bell").trigger("focus");
        }
      })
      // Sign out (asks for confirmation first)
      .on("click.civicLayout", '[data-action="logout"]', function () {
        window.CivicUI.confirm({
          title: "Sign out?",
          message: "You will need to sign in again to register for events or see notifications.",
          confirmText: "Sign out",
        }).then(function (ok) {
          if (ok) window.CivicAuth.logout();
        });
      })
      // Keep the header name in sync after a profile update
      .on("civic:user-updated.civicLayout", function () { renderHeader(); })
      .on("civic:notifications-changed.civicLayout", function () {
        // Read/unread changed locally → recount without a new request.
        if (latestNotifications) {
          setUnreadCount(window.CivicNotifyStore.countUnread(latestNotifications));
          renderBellList();
        }
      });
  }

  /** Updates the red number on the bell. */
  function setUnreadCount(count) {
    var $count = $("#nav-bell-count");
    if (count > 0) {
      $count.text(count > 99 ? "99+" : count).removeClass("hidden");
      $("#nav-bell").attr("aria-label", "Notifications, " + count + " unread");
    } else {
      $count.addClass("hidden");
      $("#nav-bell").attr("aria-label", "Notifications, none unread");
    }
  }

  /** Fetches notifications and counts the unread ones. */
  function refreshUnreadCount() {
    window.CivicApi.get("/notifications")
      .then(function (body) {
        latestNotifications = body.data || [];
        setUnreadCount(window.CivicNotifyStore.countUnread(latestNotifications));
        renderBellList();
      })
      .catch(function () {
        /* The bell is not critical – fail quietly. */
      });
  }

  function renderFooter() {
    var c = window.CivicConfig.CONTACT;
    var year = new Date().getFullYear();
    var html =
      '<footer class="mt-auto border-t border-border bg-card">' +
        '<div class="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">' +
          "<div>" + logoHtml() +
            '<p class="mt-3 max-w-xs text-sm text-muted-foreground">The official portal for events, announcements and community life in the City of Greenhill.</p>' +
          "</div>" +
          '<nav aria-label="Footer">' +
            '<h2 class="text-sm font-bold">Explore</h2>' +
            '<ul class="mt-3 space-y-2 text-sm text-muted-foreground">' +
              '<li><a class="hover:text-primary" href="' + U.url("index.html") + '">Home</a></li>' +
              '<li><a class="hover:text-primary" href="' + U.url("events.html") + '">Events</a></li>' +
              '<li><a class="hover:text-primary" href="' + U.url("announcements.html") + '">Announcements</a></li>' +
              '<li><a class="hover:text-primary" href="' + U.url("promos.html") + '">Promos</a></li>' +
            "</ul>" +
          "</nav>" +
          "<div>" +
            '<h2 class="text-sm font-bold">Contact &amp; help</h2>' +
            '<address class="mt-3 space-y-2 text-sm not-italic text-muted-foreground">' +
              "<p>" + esc(c.address) + "</p>" +
              '<p><a class="hover:text-primary" href="tel:' + c.phone.replace(/\s/g, "") + '">' + esc(c.phone) + "</a></p>" +
              '<p><a class="hover:text-primary" href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a></p>" +
            "</address>" +
          "</div>" +
        "</div>" +
        '<div class="border-t border-border py-5 text-center text-xs text-muted-foreground">' +
          "© " + year + " City of Greenhill · Built to WCAG 2.1 AA accessibility guidelines" +
        "</div>" +
      "</footer>";
    $("#site-footer").html(html);
  }

  /**
   * init – called once on every page (see js/core/app.js).
   */
  function init() {
    bindGlobalEvents();
    if ($("#site-header").length) renderHeader();
    if ($("#site-footer").length) renderFooter();
  }

  return { init: init, renderHeader: renderHeader, setUnreadCount: setUnreadCount, refreshUnreadCount: refreshUnreadCount, logoHtml: logoHtml };
})();
