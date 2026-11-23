CivicApp.start(function () {
  var U = CivicUtils;
  var esc = U.escapeHtml;
  var icon = CivicUI.icon;
  CivicAdminLayout.init();
  CivicSlideshow.init("#banner-slides", CivicConfig.BANNER_SLIDES, {
    label: "Photos of Kigali",
    // Fade into the banner colour so the photo blends with the welcome text instead of ending in a hard edge.
    overlay: '<div class="pointer-events-none absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-primary-soft to-transparent" aria-hidden="true"></div>',
    controls: "bottom-3 right-3",
  });

  var charts = {};
  var me = CivicAuth.getUser();
  $("#welcome-title").text("Welcome back, " + me.full_name + "!");
  $("#growth-icon").html(icon("trendingUp", "h-4 w-4"));
  $("#activity-icon").html(icon("zap", "h-4 w-4"));
  $("#users-icon").html(icon("users", "h-4 w-4"));

  // PostgreSQL COUNT() arrives as a string.
  function num(value) { return Number(value || 0); }
  function fmt(value) { return num(value).toLocaleString("en-GB"); }

  // Chart.js needs real colour values, so the CSS design tokens are read at runtime.
  function token(name, alpha) {
    var v = getComputedStyle(document.documentElement).getPropertyValue("--" + name).trim().split(/\s+/).join(",");
    return "rgba(" + v + "," + (alpha !== undefined ? alpha : 1) + ")";
  }

  var TONES = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    cyan: "bg-cyan-50 text-cyan-600",
    orange: "bg-orange-50 text-orange-600",
    green: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  };

  function statCard(o) {
    return (
      '<a href="' + o.href + '" class="group relative flex flex-col rounded-xl border border-border bg-card p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift">' +
        '<div class="flex items-start justify-between">' +
          '<span class="flex h-11 w-11 items-center justify-center rounded-full ' + TONES[o.tone] + '">' + icon(o.icon, "h-5 w-5") + "</span>" +
          '<span class="rounded-full p-1 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary">' + icon("arrowRight", "h-4 w-4") + "</span>" +
        "</div>" +
        '<p class="mt-3 text-2xl font-bold tracking-tight text-navy">' + esc(o.value) + "</p>" +
        '<p class="text-sm font-medium text-foreground/80">' + esc(o.label) + "</p>" +
        (o.trend ? '<p class="mt-2 flex items-center gap-1 text-xs font-medium ' + o.trend.cls + '">' + icon(o.trend.icon, "h-3.5 w-3.5") + esc(o.trend.text) + "</p>"
                 : o.hint ? '<p class="mt-2 text-xs text-muted-foreground">' + esc(o.hint) + "</p>" : "") +
        '<span class="sr-only"> – open ' + esc(o.label) + "</span>" +
      "</a>"
    );
  }

  function statSkeletons(n) {
    var html = "";
    for (var i = 0; i < n; i++) {
      html += '<div class="rounded-xl border border-border bg-card p-4 shadow-card" aria-hidden="true"><div class="skeleton h-11 w-11 rounded-full"></div><div class="skeleton mt-4 h-7 w-14"></div><div class="skeleton mt-2 h-3 w-24"></div></div>';
    }
    return html + '<span class="sr-only" role="status">Loading statistics…</span>';
  }

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

  // Only users have month-by-month history, so only that card shows a trend (no invented percentages).
  function userTrend(series) {
    var thisMonth = series.values[5];
    var lastMonth = series.values[4];
    if (thisMonth === 0 && lastMonth === 0) return null;
    var diff = thisMonth - lastMonth;
    return {
      icon: diff >= 0 ? "trendingUp" : "trendingDown",
      cls: diff >= 0 ? "text-emerald-600" : "text-rose-600",
      text: (thisMonth === 1 ? "1 new" : thisMonth + " new") + " this month (" + lastMonth + " last month)",
    };
  }

  function tableHtml(caption, headers, rows) {
    return (
      '<table class="mt-2 w-full text-left text-sm"><caption class="sr-only">' + esc(caption) + "</caption>" +
        "<thead><tr>" + headers.map(function (h) { return '<th scope="col" class="border-b border-border py-2 font-semibold">' + esc(h) + "</th>"; }).join("") + "</tr></thead>" +
        "<tbody>" + rows.map(function (r) { return '<tr><td class="border-b border-border py-1.5">' + esc(r[0]) + '</td><td class="border-b border-border py-1.5 tabular-nums">' + esc(r[1]) + "</td></tr>"; }).join("") + "</tbody>" +
      "</table>"
    );
  }

  function baseOptions() {
    var font = { family: "Inter", size: 12 };
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: token("primary"),
          titleFont: { family: "Inter", weight: "600" },
          bodyFont: font,
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: token("muted-foreground"), font: font }, border: { color: token("border") } },
        y: { beginAtZero: true, grid: { color: token("border") }, ticks: { color: token("muted-foreground"), precision: 0, font: font }, border: { display: false } },
      },
    };
  }

  function drawCharts(d, growth) {
    if (typeof Chart === "undefined") {
      $(".chart-box").html('<p class="text-sm text-muted-foreground">Charts couldn\'t load (Chart.js comes from the internet). The numbers above are still live.</p>');
      return;
    }

    var canvas = document.getElementById("chart-growth");
    var fill = canvas.getContext("2d").createLinearGradient(0, 0, 0, 240);
    fill.addColorStop(0, token("primary", 0.22));
    fill.addColorStop(1, token("primary", 0));
    if (charts.growth) charts.growth.destroy();
    charts.growth = new Chart(canvas, {
      type: "line",
      data: {
        labels: growth.labels,
        datasets: [{
          label: "New users",
          data: growth.values,
          borderColor: token("primary"),
          backgroundColor: fill,
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: token("card"),
          pointBorderColor: token("primary"),
          pointBorderWidth: 2,
        }],
      },
      options: baseOptions(),
    });
    $("#table-growth").html(tableHtml("New users per month", ["Month", "New users"], growth.labels.map(function (l, i) { return [l, growth.values[i]]; })));

    var activity = [
      ["Registrations", num(d.registrations && d.registrations.total_registrations)],
      ["Notifications", num(d.notifications && d.notifications.total_notifications)],
      ["Events", num(d.events && d.events.total_events)],
      ["Feedback", num(d.feedbacks && d.feedbacks.total_feedback)],
      ["Announcements", num(d.announcements && d.announcements.total_announcements)],
      ["Promotions", num(d.promos && d.promos.total_promos)],
    ].sort(function (a, b) { return b[1] - a[1]; });

    var opts = baseOptions();
    opts.indexAxis = "y";
    opts.interaction = { mode: "nearest", intersect: true };
    var xs = opts.scales.x;
    opts.scales = { x: opts.scales.y, y: xs };
    opts.scales.x.grid = { color: token("border") };
    if (charts.activity) charts.activity.destroy();
    charts.activity = new Chart(document.getElementById("chart-activity"), {
      type: "bar",
      data: {
        labels: activity.map(function (a) { return a[0]; }),
        datasets: [{ label: "Total", data: activity.map(function (a) { return a[1]; }), backgroundColor: token("blue"), hoverBackgroundColor: token("primary"), borderRadius: 4, maxBarThickness: 20 }],
      },
      options: opts,
    });
    $("#table-activity").html(tableHtml("Platform activity totals", ["Item", "Total"], activity));
  }

  var ACTIVITY_STYLE = {
    event: { icon: "calendar", cls: "bg-blue-50 text-blue-600", href: function (m) { return "../event.html?id=" + encodeURIComponent(m.event_id); }, key: "event_id" },
    announcement: { icon: "megaphone", cls: "bg-orange-50 text-orange-600", href: function (m) { return "../announcement.html?id=" + encodeURIComponent(m.announcement_id); }, key: "announcement_id" },
    promo: { icon: "tag", cls: "bg-emerald-50 text-emerald-600", href: function (m) { return "../promo.html?id=" + encodeURIComponent(m.promo_id); }, key: "promo_id" },
  };

  function listEmpty(text) {
    return '<li class="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">' + esc(text) + "</li>";
  }
  function listSkeleton() {
    var h = "";
    for (var i = 0; i < 4; i++) h += '<li class="flex items-center gap-3 py-2" aria-hidden="true"><div class="skeleton h-9 w-9 rounded-full"></div><div class="flex-1"><div class="skeleton h-3 w-2/3"></div><div class="skeleton mt-2 h-3 w-1/3"></div></div></li>';
    return h;
  }

  // The backend creates a notification for every new event, announcement and promo, which makes it the activity log.
  function renderActivity(notifications) {
    var items = (notifications || []).slice(0, 5);
    if (!items.length) {
      $("#recent-activity").html(listEmpty("No activity yet. Creating events, announcements or promotions will show up here."));
      return;
    }
    $("#recent-activity").html(items.map(function (n) {
      var style = ACTIVITY_STYLE[n.type] || { icon: "info", cls: "bg-slate-100 text-slate-600" };
      var meta = n.metadata || {};
      if (typeof meta === "string") { try { meta = JSON.parse(meta); } catch (e) { meta = {}; } }
      var href = style.key && meta[style.key] ? style.href(meta) : "../notifications.html?id=" + encodeURIComponent(n.id);
      return (
        "<li>" +
          '<a href="' + href + '" class="flex items-start gap-3 rounded-lg p-2 transition hover:bg-muted/70">' +
            '<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full ' + style.cls + '">' + icon(style.icon, "h-4 w-4") + "</span>" +
            '<span class="min-w-0 flex-1">' +
              '<span class="block truncate text-sm font-semibold text-foreground">' + esc(n.title) + "</span>" +
              '<span class="block truncate text-xs text-muted-foreground">' + esc(n.message) + "</span>" +
            "</span>" +
            '<time class="shrink-0 text-[11px] text-muted-foreground" datetime="' + esc(n.created_at) + '">' + esc(U.timeAgo(n.created_at)) + "</time>" +
          "</a>" +
        "</li>"
      );
    }).join(""));
  }

  var AVATAR_TONES = ["bg-blue-100 text-blue-700", "bg-violet-100 text-violet-700", "bg-cyan-100 text-cyan-700", "bg-orange-100 text-orange-700", "bg-emerald-100 text-emerald-700", "bg-rose-100 text-rose-700"];
  function avatarTone(id) {
    var sum = 0;
    String(id).split("").forEach(function (c) { sum += c.charCodeAt(0); });
    return AVATAR_TONES[sum % AVATAR_TONES.length];
  }

  function renderUsers(users) {
    if (!users.length) {
      $("#recent-users").html(listEmpty("No users yet."));
      return;
    }
    $("#recent-users").html(users.slice(0, 5).map(function (u) {
      return (
        '<li class="flex items-center gap-3 rounded-lg p-2">' +
          '<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ' + avatarTone(u.id) + '" aria-hidden="true">' + esc(U.initials(u.full_name)) + "</span>" +
          '<span class="min-w-0 flex-1">' +
            '<span class="block truncate text-sm font-semibold">' + esc(u.full_name) +
              (u.role === "admin" ? ' <span class="ml-1 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">Admin</span>' : "") + "</span>" +
            '<span class="block truncate text-xs text-muted-foreground">' + esc(u.email) + "</span>" +
          "</span>" +
          '<span class="shrink-0 text-[11px] text-muted-foreground">' + esc(U.timeAgo(u.created_at)) + "</span>" +
        "</li>"
      );
    }).join(""));
  }

  $("#quick-actions").html(
    [
      ["event-form.html", "calendarPlus", "Create event", "bg-blue-50 text-blue-600"],
      ["announcement-form.html", "megaphone", "New announcement", "bg-orange-50 text-orange-600"],
      ["promo-form.html", "tag", "New promotion", "bg-emerald-50 text-emerald-600"],
      ["users.html", "users", "Manage users", "bg-violet-50 text-violet-600"],
    ].map(function (a) {
      return (
        '<a href="' + a[0] + '" class="group flex items-center gap-3 rounded-lg border border-border p-3 text-sm font-semibold transition hover:border-primary/30 hover:bg-primary-soft/50">' +
          '<span class="flex h-9 w-9 items-center justify-center rounded-lg ' + a[3] + '">' + icon(a[1], "h-4 w-4") + "</span>" + a[2] +
          '<span class="ml-auto text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary">' + icon("chevronRight", "h-4 w-4") + "</span>" +
        "</a>"
      );
    }).join("")
  );

  function load() {
    var $stats = $("#admin-stats").html(statSkeletons(6));
    $("#recent-activity, #recent-users").html(listSkeleton());
    var $btn = $("#refresh-dashboard");
    CivicUI.setButtonLoading($btn, true, "Refreshing…");

    Promise.all([
      CivicApi.get("/dashboard/admin"),
      CivicApi.get("/notifications").catch(function () { return { data: [] }; }),
      CivicApi.get("/users?limit=5").catch(function () { return { data: [] }; }),
    ])
      .then(function (res) {
        var d = res[0].data || {};
        var notifications = res[1].data || [];
        var users = d.users || {};
        var events = d.events || {};
        var growth = growthSeries(d.user_growth);

        $stats.html(
          statCard({ href: "users.html", icon: "users", tone: "blue", value: fmt(users.total_users), label: "Total Users", trend: userTrend(growth),
                     hint: fmt(users.active_users) + " active · " + fmt(users.inactive_users) + " disabled" }) +
          statCard({ href: "events.html", icon: "calendar", tone: "violet", value: fmt(events.total_events), label: "Total Events",
                     hint: fmt(events.upcoming_events) + " upcoming · " + fmt(events.past_events) + " past" }) +
          statCard({ href: "events.html", icon: "ticket", tone: "cyan", value: fmt(d.registrations && d.registrations.total_registrations), label: "Registrations",
                     hint: fmt(d.feedbacks && d.feedbacks.total_feedback) + " feedback ratings" }) +
          statCard({ href: "announcements.html", icon: "megaphone", tone: "orange", value: fmt(d.announcements && d.announcements.total_announcements), label: "Announcements", hint: "Audio updates" }) +
          statCard({ href: "promos.html", icon: "tag", tone: "green", value: fmt(d.promos && d.promos.total_promos), label: "Promotions", hint: "Captioned videos" }) +
          statCard({ href: "notifications.html", icon: "bell", tone: "rose", value: fmt(CivicNotifyStore.countUnread(notifications)), label: "Unread Notifications",
                     hint: fmt(d.notifications && d.notifications.total_notifications) + " sent in total" })
        );

        renderActivity(notifications);
        renderUsers(res[2].data || []);
        $("#updated-at").text("Updated at " + new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
        drawCharts(d, growth);
      })
      .catch(function (err) {
        $stats.html(CivicUI.errorState(err));
        $stats.find("[data-retry]").on("click", load);
        $("#recent-activity, #recent-users").html(listEmpty("Couldn't load."));
      })
      .finally(function () { CivicUI.setButtonLoading($btn, false); });
  }

  $("#refresh-dashboard").on("click", load);
  load();
});
