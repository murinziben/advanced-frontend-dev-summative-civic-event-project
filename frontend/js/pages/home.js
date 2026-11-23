CivicApp.start(function () {
  CivicSlideshow.init("#hero-slides", CivicConfig.HERO_SLIDES, {
    label: "Photos of places in Rwanda",
    // Navy gradient on the left keeps the white headline readable on every photo.
    overlay: '<div class="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/60 to-navy/20" aria-hidden="true"></div>',
    controls: "bottom-20 right-4 sm:right-6 lg:bottom-24 lg:right-8",
  });

  var icon = CivicUI.icon;
  $("#hero-search-icon").html(icon("search", "h-5 w-5"));

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

  // Event and announcement routes require a token, so visitors get a sign-in prompt instead of data.
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

  function loadEvents() {
    var $list = $("#featured-events").html(CivicUI.skeletonCards(3));
    var mine = CivicAuth.isAdmin()
      ? Promise.resolve({ data: [] })
      : CivicApi.get("/event-registrations/my-registrations").catch(function () { return { data: [] }; });

    Promise.all([CivicApi.get("/events"), mine])
      .then(function (res) {
        var body = res[0];
        var registered = {};
        (res[1].data || []).forEach(function (r) { if (r.status === "registered") registered[r.event_id] = true; });
        var now = Date.now();

        var upcoming = (body.data || []).filter(function (e) {
          var ended = e.ends_at && new Date(e.ends_at).getTime() < now;
          return CivicUtils.toBool(e.published) && !ended;
        });

        if (!upcoming.length) {
          $list.html(CivicUI.emptyState("No upcoming events yet", "New events will appear here as soon as the city publishes them."));
          return;
        }
        $list.html(upcoming.slice(0, 3).map(function (e) { return CivicCards.event(e, { registered: !!registered[e.id], registerable: true }); }).join(""));
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
