/*
 * Home page
 * ---------------------------------------------------------------
 * The backend protects ALL event and announcement routes with
 * `authenticate` (see backend/src/routes/events.routes.js), so a visitor
 * who isn't signed in can't load them. So:
 *   - visitors see the hero, the feature cards and a "sign in" prompt;
 *   - signed-in users see the next 3 published events and the
 *     2 latest published announcements, loaded from the API.
 *
 * APIs: GET /api/events, GET /api/announcements
 */
CivicApp.start(function () {
  var icon = CivicUI.icon;
  $("#hero-search-icon").html(icon("search", "h-5 w-5"));

  /* ---------------- Feature cards ---------------- */
  var features = [
    { href: "events.html", icon: "calendar", title: "Events", text: "Find and register for city events" },
    { href: "announcements.html", icon: "megaphone", title: "Announcements", text: "Listen to or read city updates" },
    { href: "promos.html", icon: "play", title: "Promos", text: "Captioned city videos" },
  ];
  $("#feature-cards").html(
    features
      .map(function (f) {
        return (
          '<a href="' + f.href + '" class="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">' +
            '<span class="rounded-lg bg-primary-soft p-3 text-primary">' + icon(f.icon, "h-5 w-5") + "</span>" +
            '<span><span class="block font-bold">' + f.title + '</span><span class="block text-sm text-muted-foreground">' + f.text + "</span></span>" +
          "</a>"
        );
      })
      .join("")
  );

  /* ---------------- Visitors: sign-in prompt ---------------- */
  if (!CivicAuth.isLoggedIn()) {
    var prompt = function (what) {
      return CivicUI.emptyState(
        "Sign in to see " + what,
        "Create a free account or sign in to browse " + what + ", register for events and get notifications.",
        '<div class="flex flex-wrap justify-center gap-2">' +
          '<a href="login.html" class="rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted">Sign in</a>' +
          '<a href="signup.html" class="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Create account</a>' +
        "</div>"
      );
    };
    $("#featured-events").html(prompt("upcoming events"));
    $("#latest-announcements").html(prompt("announcements"));
    return;
  }

  /* ---------------- Signed in: load real data ---------------- */
  function loadEvents() {
    var $list = $("#featured-events").html(CivicUI.skeletonCards(3));
    CivicApi.get("/events")
      .then(function (body) {
        var now = Date.now();
        // Only published, not-finished events, soonest first (the API already sorts by starts_at).
        var upcoming = (body.data || []).filter(function (e) {
          var ended = e.ends_at && new Date(e.ends_at).getTime() < now;
          return CivicUtils.toBool(e.published) && !ended;
        });

        if (!upcoming.length) {
          $list.html(CivicUI.emptyState("No upcoming events yet", "New events will appear here as soon as the city publishes them."));
          return;
        }
        $list.html(upcoming.slice(0, 3).map(function (e) { return CivicCards.event(e); }).join(""));
      })
      .catch(function (err) {
        $list.html(CivicUI.errorState(err));
        $list.find("[data-retry]").on("click", loadEvents);
      });
  }

  function loadAnnouncements() {
    var $list = $("#latest-announcements").html(CivicUI.skeletonCards(2, false));
    CivicApi.get("/announcements")
      .then(function (body) {
        var published = (body.data || []).filter(function (a) { return CivicUtils.toBool(a.published); });
        if (!published.length) {
          $list.html(CivicUI.emptyState("No announcements yet", "City updates will appear here."));
          return;
        }
        $list.html(published.slice(0, 2).map(CivicCards.announcementSummary).join(""));
      })
      .catch(function (err) {
        $list.html(CivicUI.errorState(err));
        $list.find("[data-retry]").on("click", loadAnnouncements);
      });
  }

  loadEvents();
  loadAnnouncements();
});
