/*
 * CivicCards – reusable card markup (event, announcement, stat).
 * ---------------------------------------------------------------
 * Used by the home page, list pages and dashboards so every card
 * looks the same everywhere (matches the CivicEvents design).
 *
 * All text from the API goes through escapeHtml() before it is
 * inserted, to prevent XSS.
 */
window.CivicCards = (function () {
  var U = window.CivicUtils;
  var esc = U.escapeHtml;
  var icon = function (n, c) { return window.CivicUI.icon(n, c); };

  /** Image from the backend (metadata.image_url), or null. */
  function eventImage(evt) {
    var meta = evt.metadata || {};
    if (typeof meta === "string") {
      try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
    }
    return meta.image_url || null;
  }

  /** Placeholder shown when an event has no image. */
  function imageFallback(sizeClasses) {
    return (
      '<div class="flex items-center justify-center bg-gradient-to-br from-primary-soft to-secondary-soft text-primary ' + sizeClasses + '" aria-hidden="true">' +
        icon("calendar", "h-10 w-10 opacity-60") +
      "</div>"
    );
  }

  /** "Upcoming", "Happening now" or "Past" from the event dates. */
  function eventTiming(evt) {
    var now = Date.now();
    var start = evt.starts_at ? new Date(evt.starts_at).getTime() : null;
    var end = evt.ends_at ? new Date(evt.ends_at).getTime() : null;
    if (end && end < now) return { label: "Past event", cls: "bg-muted text-muted-foreground" };
    if (start && start <= now && (!end || end >= now)) return { label: "Happening now", cls: "bg-secondary-soft text-secondary-foreground" };
    return { label: "Upcoming", cls: "bg-primary-soft text-primary" };
  }

  /**
   * Event card.
   * options.adminControls → shows Edit / Delete buttons (only passed by admin pages,
   * and only when CivicAuth.isAdmin() is true – ROLE-BASED UI GUARD).
   */
  function event(evt, options) {
    var o = options || {};
    var href = U.url("event.html?id=" + encodeURIComponent(evt.id));
    var img = eventImage(evt);
    var timing = eventTiming(evt);
    var registered = o.registered === true;

    var media = img
      ? '<img src="' + esc(img) + '" alt="' + esc(evt.title) + '" loading="lazy" class="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03]" />'
      : imageFallback("h-44 w-full");

    var adminButtons = "";
    if (o.adminControls && window.CivicAuth.isAdmin()) {
      adminButtons =
        '<div class="flex gap-2 border-t border-border px-5 py-3">' +
          '<a href="' + U.url("admin/event-form.html?id=" + encodeURIComponent(evt.id)) + '" class="rounded-lg border border-input px-3 py-1.5 text-xs font-semibold hover:bg-muted">Edit<span class="sr-only"> ' + esc(evt.title) + "</span></a>" +
          '<button type="button" data-delete-event="' + esc(evt.id) + '" data-title="' + esc(evt.title) + '" class="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive-soft">Delete<span class="sr-only"> ' + esc(evt.title) + "</span></button>" +
        "</div>";
    }

    return (
      '<article class="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">' +
        '<div class="relative overflow-hidden">' + media +
          '<span class="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ' + timing.cls + '">' + timing.label + "</span>" +
          (registered ? '<span class="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm">Registered</span>' : "") +
          (!U.toBool(evt.published) ? '<span class="absolute bottom-3 left-3 rounded-full bg-foreground/80 px-2.5 py-1 text-[11px] font-semibold text-white">Unpublished</span>' : "") +
        "</div>" +
        '<div class="flex flex-1 flex-col p-5">' +
          '<p class="text-xs font-semibold text-muted-foreground">' + esc(U.formatDate(evt.starts_at)) + "</p>" +
          '<h3 class="mt-1 text-base font-bold leading-snug">' +
            '<a href="' + href + '" class="hover:text-primary focus:outline-none">' + esc(evt.title) + "</a>" +
          "</h3>" +
          '<ul class="mt-3 space-y-1.5 text-sm text-muted-foreground">' +
            '<li class="flex items-center gap-2">' + icon("mapPin", "h-4 w-4 shrink-0") + '<span class="truncate">' + esc(evt.location || "Location to be confirmed") + "</span></li>" +
            '<li class="flex items-center gap-2">' + icon("clock", "h-4 w-4 shrink-0") + "<span>" + esc(U.formatTimeRange(evt.starts_at, evt.ends_at)) + "</span></li>" +
          "</ul>" +
          '<div class="mt-auto pt-4">' +
            '<a href="' + href + '" class="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">View details<span class="sr-only"> for ' + esc(evt.title) + "</span>" + icon("arrowRight", "h-4 w-4") + "</a>" +
          "</div>" +
        "</div>" +
        adminButtons +
      "</article>"
    );
  }

  /** Small announcement card used on the home page / dashboard. */
  function announcementSummary(a) {
    var href = U.url("announcement.html?id=" + encodeURIComponent(a.id));
    return (
      '<article class="rounded-xl border border-border bg-card p-5 shadow-card transition hover:shadow-lift">' +
        '<p class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">' +
          icon("megaphone", "h-3.5 w-3.5") + "Audio announcement · " + esc(U.formatDate(a.created_at)) +
        "</p>" +
        '<h3 class="mt-2 text-base font-bold"><a href="' + href + '" class="hover:text-primary">' + esc(a.title) + "</a></h3>" +
        '<a href="' + href + '" class="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">' +
          icon("play", "h-4 w-4") + "Listen<span class=\"sr-only\"> to " + esc(a.title) + "</span></a>" +
      "</article>"
    );
  }

  /** KPI / statistic tile for dashboards. */
  function stat(label, value, iconName, hint) {
    return (
      '<div class="rounded-xl border border-border bg-card p-5 shadow-card">' +
        '<div class="flex items-center justify-between">' +
          '<p class="text-sm font-medium text-muted-foreground">' + esc(label) + "</p>" +
          '<span class="rounded-lg bg-primary-soft p-2 text-primary">' + icon(iconName || "layout", "h-4 w-4") + "</span>" +
        "</div>" +
        '<p class="mt-3 text-3xl font-extrabold tracking-tight">' + esc(value) + "</p>" +
        (hint ? '<p class="mt-1 text-xs text-muted-foreground">' + esc(hint) + "</p>" : "") +
      "</div>"
    );
  }

  /** Grey placeholders while stats load. */
  function statSkeletons(count) {
    var html = "";
    for (var i = 0; i < count; i++) {
      html +=
        '<div class="rounded-xl border border-border bg-card p-5 shadow-card" aria-hidden="true">' +
          '<div class="skeleton h-3 w-24"></div><div class="skeleton mt-4 h-8 w-16"></div>' +
        "</div>";
    }
    return html + '<span class="sr-only" role="status">Loading statistics…</span>';
  }

  /** Five stars showing a rating, e.g. 4.5 → ★★★★½ (with text for screen readers). */
  function stars(rating, sizeClass) {
    var r = Number(rating) || 0;
    var html = '<span class="inline-flex items-center gap-0.5" aria-hidden="true">';
    for (var i = 1; i <= 5; i++) {
      var fill = r >= i ? "100%" : r > i - 1 ? Math.round((r - (i - 1)) * 100) + "%" : "0%";
      html +=
        '<span class="relative inline-block ' + (sizeClass || "h-4 w-4") + '">' +
          '<svg viewBox="0 0 24 24" class="absolute inset-0 h-full w-full text-border" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>' +
          '<span class="absolute inset-y-0 left-0 overflow-hidden" style="width:' + fill + '">' +
            '<svg viewBox="0 0 24 24" class="max-w-none text-secondary ' + (sizeClass || "h-4 w-4") + '" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>' +
          "</span>" +
        "</span>";
    }
    return html + '</span><span class="sr-only">Rated ' + r.toFixed(1).replace(/\.0$/, "") + " out of 5</span>";
  }

  return {
    stars: stars,
    event: event,
    eventImage: eventImage,
    eventTiming: eventTiming,
    imageFallback: imageFallback,
    announcementSummary: announcementSummary,
    stat: stat,
    statSkeletons: statSkeletons,
  };
})();
