/*
 * Admin dashboard (admin/dashboard.html)
 * ---------------------------------------------------------------
 * API: GET /api/dashboard/admin  (server-side: authenticate + authorize(['admin']))
 * Response data shape (backend/src/models/dashboard.model.js):
 *   users:         { total_users, active_users, inactive_users }
 *   events:        { total_events, upcoming_events, past_events }
 *   registrations: { total_registrations }
 *   feedbacks:     { total_feedback }
 *   promos:        { total_promos }
 *   announcements: { total_announcements }
 *   notifications: { total_notifications }
 *   user_growth:   [ { month: "2026-11", new_users: "4" }, ... ]   (last 6 months)
 * PostgreSQL COUNT() comes back as text ("12"), so we convert with Number().
 *
 * Charts use Chart.js and ONLY these real numbers – nothing is hard-coded.
 * "Refresh" reloads the data and redraws the charts (brief: "Charts …
 * update when data changes"). Each chart also has a "View as table"
 * option for screen-reader users.
 */
CivicApp.start(function () {
  var esc = CivicUtils.escapeHtml;
  CivicAdminLayout.init();

  var charts = {};

  function num(value) { return Number(value || 0); }
  function fmt(value) { return num(value).toLocaleString("en-GB"); }

  /**
   * Reads a colour token from css/styles.css so the charts match the design.
   * Chart.js understands rgb() better than oklch(), so we let a tiny canvas
   * convert the colour: paint one pixel, then read its RGB values back.
   */
  var probe = document.createElement("canvas").getContext("2d");
  function token(name, alpha) {
    var v = getComputedStyle(document.documentElement).getPropertyValue("--" + name).trim();
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = "oklch(" + v + ")";
    probe.fillRect(0, 0, 1, 1);
    var px = probe.getImageData(0, 0, 1, 1).data;
    return "rgba(" + px[0] + "," + px[1] + "," + px[2] + "," + (alpha !== undefined ? alpha : 1) + ")";
  }

  // Thin marks, rounded bar ends, quiet grid. One colour per chart (single series).
  function baseOptions() {
    var axisFont = { family: "Plus Jakarta Sans" };
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: {
        legend: { display: false }, // single series: the chart heading names it
        tooltip: {
          backgroundColor: token("foreground"),
          titleFont: { family: "Plus Jakarta Sans", weight: "600" },
          bodyFont: axisFont,
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: token("muted-foreground"), font: axisFont }, border: { color: token("border") } },
        y: { beginAtZero: true, grid: { color: token("border") }, ticks: { color: token("muted-foreground"), precision: 0, font: axisFont }, border: { display: false } },
      },
    };
  }

  /** The last 6 months, with 0 for months that had no sign-ups. */
  function growthSeries(rows) {
    var map = {};
    (rows || []).forEach(function (r) { map[r.month] = num(r.new_users); });
    var labels = [], values = [];
    var d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 5);
    for (var i = 0; i < 6; i++) {
      var key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      labels.push(d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }));
      values.push(map[key] || 0);
      d.setMonth(d.getMonth() + 1);
    }
    return { labels: labels, values: values };
  }

  function tableHtml(caption, headers, rows) {
    return (
      '<table class="mt-2 w-full text-left text-sm"><caption class="sr-only">' + esc(caption) + "</caption>" +
        "<thead><tr>" + headers.map(function (h) { return '<th scope="col" class="border-b border-border py-2 font-semibold">' + esc(h) + "</th>"; }).join("") + "</tr></thead>" +
        "<tbody>" + rows.map(function (r) { return '<tr><td class="border-b border-border py-1.5">' + esc(r[0]) + '</td><td class="border-b border-border py-1.5 tabular-nums">' + esc(r[1]) + "</td></tr>"; }).join("") + "</tbody>" +
      "</table>"
    );
  }

  function drawCharts(d) {
    if (typeof Chart === "undefined") {
      $(".chart-box").html('<p class="text-sm text-muted-foreground">Charts couldn\'t load (Chart.js comes from the internet). The numbers above are still live.</p>');
      return;
    }

    /* 1. New users per month – bar chart (a count per period) */
    var g = growthSeries(d.user_growth);
    if (charts.growth) charts.growth.destroy();
    charts.growth = new Chart(document.getElementById("chart-growth"), {
      type: "bar",
      data: {
        labels: g.labels,
        datasets: [{ label: "New users", data: g.values, backgroundColor: token("primary"), hoverBackgroundColor: token("primary", 0.85), borderRadius: 4, maxBarThickness: 36 }],
      },
      options: baseOptions(),
    });
    $("#table-growth").html(tableHtml("New users per month", ["Month", "New users"], g.labels.map(function (l, i) { return [l, g.values[i]]; })));

    /* 2. Activity overview – horizontal bars, largest first (compare totals) */
    var activity = [
      ["Registrations", num(d.registrations && d.registrations.total_registrations)],
      ["Notifications", num(d.notifications && d.notifications.total_notifications)],
      ["Events", num(d.events && d.events.total_events)],
      ["Feedback", num(d.feedbacks && d.feedbacks.total_feedback)],
      ["Announcements", num(d.announcements && d.announcements.total_announcements)],
      ["Promos", num(d.promos && d.promos.total_promos)],
    ].sort(function (a, b) { return b[1] - a[1]; });

    var opts = baseOptions();
    opts.indexAxis = "y";
    var xScale = opts.scales.x;
    opts.scales = { x: opts.scales.y, y: xScale };
    opts.scales.x.grid = { color: token("border") };
    if (charts.activity) charts.activity.destroy();
    charts.activity = new Chart(document.getElementById("chart-activity"), {
      type: "bar",
      data: {
        labels: activity.map(function (a) { return a[0]; }),
        datasets: [{ label: "Total", data: activity.map(function (a) { return a[1]; }), backgroundColor: token("secondary"), hoverBackgroundColor: token("secondary", 0.85), borderRadius: 4, maxBarThickness: 22 }],
      },
      options: opts,
    });
    $("#table-activity").html(tableHtml("Platform activity totals", ["Item", "Total"], activity));
  }

  function load() {
    var $stats = $("#admin-stats").html(CivicCards.statSkeletons(5));
    var $btn = $("#refresh-dashboard");
    CivicUI.setButtonLoading($btn, true, "Refreshing…");

    Promise.all([
      CivicApi.get("/dashboard/admin"),
      CivicApi.get("/notifications").catch(function () { return { data: [] }; }),
    ])
      .then(function (res) {
        var d = res[0].data || {};
        var users = d.users || {};
        var events = d.events || {};
        var unread = CivicNotifyStore.countUnread(res[1].data || []);

        $stats.html(
          CivicCards.stat("Total users", fmt(users.total_users), "users", fmt(users.active_users) + " active · " + fmt(users.inactive_users) + " disabled") +
          CivicCards.stat("Total events", fmt(events.total_events), "calendar", fmt(events.upcoming_events) + " upcoming · " + fmt(events.past_events) + " past") +
          CivicCards.stat("Registrations", fmt(d.registrations && d.registrations.total_registrations), "ticket", fmt(d.feedbacks && d.feedbacks.total_feedback) + " feedback ratings") +
          CivicCards.stat("Promos & audio", fmt(num(d.promos && d.promos.total_promos) + num(d.announcements && d.announcements.total_announcements)), "play",
            fmt(d.promos && d.promos.total_promos) + " promos · " + fmt(d.announcements && d.announcements.total_announcements) + " announcements") +
          CivicCards.stat("Unread notifications", fmt(unread), "bell", fmt(d.notifications && d.notifications.total_notifications) + " sent in total")
        );
        $("#updated-at").text("Updated at " + new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
        drawCharts(d);
      })
      .catch(function (err) {
        $stats.html(CivicUI.errorState(err));
        $stats.find("[data-retry]").on("click", load);
      })
      .finally(function () { CivicUI.setButtonLoading($btn, false); });
  }

  $("#refresh-dashboard").on("click", load);
  load();
});
