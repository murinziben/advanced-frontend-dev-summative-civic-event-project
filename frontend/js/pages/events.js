CivicApp.start(function () {
  var U = CivicUtils;
  var PER_PAGE = CivicConfig.PAGE_SIZE;
  var isAdmin = CivicAuth.isAdmin();

  var allEvents = [];
  var registeredIds = {};
  var state = {
    q: U.getQueryParam("q") || "",
    from: U.getQueryParam("from") || "",
    location: U.getQueryParam("location") || "",
    when: U.getQueryParam("when") || "upcoming",
    page: Number(U.getQueryParam("page")) || 1,
  };

  var $list = $("#events-list");
  var $count = $("#events-count");

  $("#filter-q").val(state.q);
  $("#filter-from").val(state.from);
  $("#filter-when").val(state.when);

  // Filters live in the URL so results can be bookmarked, shared and survive a refresh.
  function syncUrl() {
    var params = new URLSearchParams();
    if (state.q) params.set("q", state.q);
    if (state.from) params.set("from", state.from);
    if (state.location) params.set("location", state.location);
    if (state.when !== "upcoming") params.set("when", state.when);
    if (state.page > 1) params.set("page", state.page);
    var qs = params.toString();
    history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
  }

  function fillLocations() {
    var seen = {};
    allEvents.forEach(function (e) { if (e.location) seen[e.location.trim()] = true; });
    var options = Object.keys(seen).sort();
    var $sel = $("#filter-location");
    $sel.find("option:not(:first)").remove();
    options.forEach(function (loc) { $sel.append($("<option>").val(loc).text(loc)); });
    $sel.val(options.indexOf(state.location) !== -1 ? state.location : "");
  }

  // The API has no search or filter parameters, so filtering happens in the browser.
  function applyFilters() {
    var now = Date.now();
    var q = state.q.trim().toLowerCase();
    var fromTime = state.from ? new Date(state.from + "T00:00:00").getTime() : null;

    return allEvents.filter(function (e) {
      // ROLE GUARD: residents only see published events.
      if (!isAdmin && !U.toBool(e.published)) return false;

      var start = e.starts_at ? new Date(e.starts_at).getTime() : null;
      var end = e.ends_at ? new Date(e.ends_at).getTime() : start;
      var ended = end !== null && end < now;
      if (state.when === "upcoming" && ended) return false;
      if (state.when === "past" && !ended) return false;

      if (fromTime && (start === null || start < fromTime)) return false;
      if (state.location && (e.location || "").trim() !== state.location) return false;

      if (q) {
        var text = [e.title, e.description, e.location].join(" ").toLowerCase();
        if (text.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function render() {
    var results = applyFilters();
    if (state.when === "past") results.reverse();

    var pages = CivicPagination.totalPages(results.length, PER_PAGE);
    if (state.page > pages) state.page = pages;
    syncUrl();

    $count.text(results.length === 1 ? "1 event found" : results.length + " events found");

    if (!results.length) {
      var filtered = state.q || state.from || state.location || state.when !== "upcoming";
      $list.html(
        CivicUI.emptyState(
          filtered ? "No events match your search" : "No upcoming events yet",
          filtered ? "Try a different word, date or location, or clear the filters." : "New events will appear here as soon as the city publishes them.",
          filtered ? '<button type="button" data-clear-filters class="rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted">Clear filters</button>' : ""
        )
      );
      $("#events-pagination").empty();
      return;
    }

    $list.html(
      CivicPagination.slice(results, state.page, PER_PAGE)
        .map(function (e) { return CivicCards.event(e, { registered: !!registeredIds[e.id], registerable: true }); })
        .join("")
    );

    CivicPagination.render("#events-pagination", {
      page: state.page,
      totalItems: results.length,
      perPage: PER_PAGE,
      onChange: function (p) {
        state.page = p;
        render();

        // Move focus to the results so keyboard users aren't left on the pagination.
        $("#results-heading").trigger("focus");
      },
    });
  }

  function load() {
    $list.html(CivicUI.skeletonCards(6));
    $count.text("Loading events…");

    var requests = [CivicApi.get("/events")];

    // Admins don't register for events, so their registrations aren't fetched.
    if (!isAdmin) requests.push(CivicApi.get("/event-registrations/my-registrations").catch(function () { return { data: [] }; }));

    Promise.all(requests)
      .then(function (res) {
        allEvents = res[0].data || [];
        registeredIds = {};
        ((res[1] && res[1].data) || []).forEach(function (r) {
          if (r.status === "registered") registeredIds[r.event_id] = true;
        });
        fillLocations();
        render();
      })
      .catch(function (err) {
        $count.text("");
        $list.html(CivicUI.errorState(err));
        $list.find("[data-retry]").on("click", load);
      });
  }

  $("#filter-q").on("input", U.debounce(function () { state.q = this.value; state.page = 1; render(); }, 250));
  $("#filter-from").on("change", function () { state.from = this.value; state.page = 1; render(); });
  $("#filter-location").on("change", function () { state.location = this.value; state.page = 1; render(); });
  $("#filter-when").on("change", function () { state.when = this.value; state.page = 1; render(); });
  $("#filters").on("submit", function (e) { e.preventDefault(); });

  $(document).on("click", "[data-clear-filters], #clear-filters", function () {
    state = { q: "", from: "", location: "", when: "upcoming", page: 1 };
    $("#filter-q").val("");
    $("#filter-from").val("");
    $("#filter-location").val("");
    $("#filter-when").val("upcoming");
    render();
    $("#filter-q").trigger("focus");
  });

  load();
});
