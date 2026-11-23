window.CivicLayout = (function () {
  var U = window.CivicUtils;
  var esc = U.escapeHtml;
  var icon = function (n, c) { return window.CivicUI.icon(n, c); };

  // ROLE-BASED NAVIGATION: admins get "Dashboard", residents get "My Events".
  function navLinks() {
    var isAdmin = window.CivicAuth.isAdmin();
    var links = [
      { key: "home", label: "Home", href: "index.html" },
      { key: "events", label: "Events", href: "events.html" },
      { key: "announcements", label: "Announcements", href: "announcements.html" },
      { key: "promos", label: "Promos", href: "promos.html" },
    ];

    if (isAdmin) links.push({ key: "admin", label: "Dashboard", href: "admin/dashboard.html" });
    else links.push({ key: "my-events", label: "My Events", href: "my-registrations.html" });
    return links;
  }

  function logoHtml(extraClasses) {
    return (
      '<a href="' + U.url("index.html") + '" class="flex items-center gap-2.5 font-bold tracking-tight text-primary ' + (extraClasses || "") + '">' +
        // The name stays real text (not part of the image) so it is sharp at any size and readable by screen readers.
        '<img src="' + U.url("assets/images/logo-icon.png") + '" alt="" width="36" height="36" class="h-9 w-9 shrink-0" />' +
        '<span class="text-lg"><span class="text-navy">Civic</span>Events</span>' +
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

        '<div class="relative" id="bell-menu">' +
          '<button type="button" id="nav-bell" class="relative rounded-lg p-2 text-foreground/75 hover:bg-muted hover:text-foreground" aria-label="Notifications" aria-expanded="false" aria-controls="bell-panel">' +
            icon("bell") +
            '<span id="nav-bell-count" class="absolute -right-0.5 -top-0.5 hidden min-w-[1.25rem] rounded-full bg-destructive px-1 text-center text-[11px] font-bold leading-5 text-white" aria-hidden="true"></span>' +
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
        '<div class="relative" id="profile-menu">' +
          '<button type="button" id="profile-button" class="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-muted" aria-haspopup="true" aria-expanded="false" aria-controls="profile-dropdown">' +
            '<span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground" aria-hidden="true">' + esc(U.initials(user.full_name)) + "</span>" +
            '<span class="hidden max-w-[9rem] text-left leading-tight ' + (document.body.hasAttribute("data-admin-page") ? "md:block" : "xl:block") + '">' +
              '<span class="block truncate text-sm font-semibold">' + esc(user.full_name) + "</span>" +
              '<span class="block text-[11px] text-muted-foreground">' + (user.role === "admin" ? "Administrator" : "Resident") + "</span>" +
            "</span>" +
            '<span class="sr-only">Open account menu</span>' +
            icon("chevronDown", "h-4 w-4 text-muted-foreground") +
          "</button>" +
          '<div id="profile-dropdown" class="absolute right-0 top-full z-50 mt-2 hidden w-64 overflow-hidden rounded-xl border border-border bg-card shadow-lift">' +
            '<div class="border-b border-border px-4 py-3">' +
              '<p class="truncate text-sm font-semibold">' + esc(user.full_name) + "</p>" +
              '<p class="truncate text-xs text-muted-foreground">' + esc(user.email) + "</p>" +
              '<span class="mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ' +
                (user.role === "admin" ? "bg-violet-50 text-violet-700" : "bg-primary-soft text-primary") + '">' +
                (user.role === "admin" ? "Administrator" : "Resident") + "</span>" +
            "</div>" +
            '<nav class="p-1.5 text-sm" aria-label="Account">' +
              (user.role === "admin"
                ? '<a href="' + U.url("admin/dashboard.html") + '" class="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted">' + icon("layout", "h-4 w-4") + "Admin dashboard</a>" +
                  '<a href="' + U.url("index.html") + '" class="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted">' + icon("eye", "h-4 w-4") + "View public site</a>"
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

    // Admin pages use the sidebar shell, so a top bar replaces the public header.
    if (document.body.hasAttribute("data-admin-page")) {
      $("#site-header").html(adminTopBar(rightSide, user));
      bindHeaderEvents();
      if (loggedIn) refreshUnreadCount();
      return;
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

  function adminTopBar(rightSide) {
    var crumbs = window.CivicAdminLayout ? window.CivicAdminLayout.breadcrumbHtml() : "";
    return (
      '<a href="#main" class="skip-link">Skip to content</a>' +
      '<header class="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">' +
        '<div class="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">' +
          '<button type="button" id="admin-menu-button" class="rounded-lg p-2 text-foreground/75 hover:bg-muted lg:hidden" aria-expanded="false" aria-controls="admin-sidebar">' +
            '<span class="sr-only">Open admin menu</span>' + icon("menu", "h-6 w-6") +
          "</button>" +
          crumbs +
          '<div class="ml-auto flex items-center gap-1.5 sm:gap-2">' +
            '<form role="search" action="' + U.url("admin/events.html") + '" method="get" class="relative hidden md:block">' +
              '<label for="admin-search" class="sr-only">Search events</label>' +
              '<span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">' + icon("search", "h-4 w-4") + "</span>" +
              '<input id="admin-search" name="q" type="search" placeholder="Search events…" ' +
                'class="w-56 rounded-full border border-border bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground transition focus:w-72 focus:border-ring focus:bg-card lg:w-64" />' +
            "</form>" +
            rightSide +
          "</div>" +
        "</div>" +
      "</header>"
    );
  }

  function bindHeaderEvents() {
    $("#mobile-menu-button").on("click", function () {
      var open = $(this).attr("aria-expanded") === "true";
      $(this).attr("aria-expanded", String(!open));
      $(this).find(".sr-only").text(open ? "Open main menu" : "Close main menu");
      $("#mobile-menu").toggleClass("hidden", open);
    });

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
        refreshUnreadCount();
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

  var latestNotifications = null;

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
                '<span class="mt-1.5 h-2 w-2 shrink-0 rounded-full ' + (unread ? "bg-primary" : "bg-transparent") + '" aria-hidden="true"></span>' +
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

  // Bound once with a namespace because the header re-renders after profile updates.
  function bindGlobalEvents() {
    $(document)
      .off(".civicLayout")
      .on("click.civicLayout", function (e) {
        if (!$(e.target).closest("#profile-menu").length) closeProfileMenu();
        if (!$(e.target).closest("#bell-menu").length) closeBellPanel();
      })
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
      .on("click.civicLayout", '[data-action="logout"]', function () {
        window.CivicUI.confirm({
          title: "Sign out?",
          message: "You will need to sign in again to register for events or see notifications.",
          confirmText: "Sign out",
        }).then(function (ok) {
          if (ok) window.CivicAuth.logout();
        });
      })
      .on("civic:user-updated.civicLayout", function () { renderHeader(); })
      .on("civic:notifications-changed.civicLayout", function () {
        if (latestNotifications) {
          setUnreadCount(window.CivicNotifyStore.countUnread(latestNotifications));
          renderBellList();
        }
      });
  }

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

  function refreshUnreadCount() {
    window.CivicApi.get("/notifications")
      .then(function (body) {
        latestNotifications = body.data || [];
        setUnreadCount(window.CivicNotifyStore.countUnread(latestNotifications));
        renderBellList();
      })
      .catch(function () {
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

  function init() {
    bindGlobalEvents();
    if ($("#site-header").length) renderHeader();
    if ($("#site-footer").length) renderFooter();
  }

  return { init: init, renderHeader: renderHeader, setUnreadCount: setUnreadCount, refreshUnreadCount: refreshUnreadCount, logoHtml: logoHtml };
})();
