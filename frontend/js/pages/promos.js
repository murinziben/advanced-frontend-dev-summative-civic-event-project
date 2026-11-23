CivicApp.start(function () {
  var U = CivicUtils;
  var esc = U.escapeHtml;
  var isAdmin = CivicAuth.isAdmin();
  var promos = [];
  var $list = $("#promos-list");

  function render() {
    var q = $("#search").val().trim().toLowerCase();
    var list = promos.filter(function (p) {
      // ROLE GUARD: residents only see published promos.
      if (!isAdmin && !U.toBool(p.published)) return false;
      return !q || [p.title, p.description].join(" ").toLowerCase().indexOf(q) !== -1;
    });

    if (!list.length) {
      $list.html(CivicUI.emptyState(q ? "No promos match your search" : "No promos yet", q ? "Try a different word." : "City videos will appear here."));
      return;
    }

    $list.html(
      list.map(function (p) {
        var href = "promo.html?id=" + encodeURIComponent(p.id);
        var hasCaptions = p.caption_text && String(p.caption_text).trim();
        return (
          '<article class="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">' +
            '<a href="' + href + '" class="relative block aspect-video overflow-hidden bg-foreground" aria-label="Play ' + esc(p.title) + '">' +
              // No thumbnails in the backend: the first frame acts as one, and preload="metadata" avoids downloading the whole video.
              '<video src="' + esc(p.video_url) + '#t=0.5" preload="metadata" muted playsinline tabindex="-1" aria-hidden="true" class="h-full w-full object-cover opacity-90 transition group-hover:scale-[1.03]"></video>' +
              '<span class="absolute inset-0 flex items-center justify-center" aria-hidden="true">' +
                '<span class="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-primary shadow-lift transition group-hover:scale-110">' +
                  '<svg viewBox="0 0 24 24" fill="currentColor" class="ml-1 h-6 w-6"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z"/></svg>' +
                "</span>" +
              "</span>" +
              '<span class="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-white" data-length-for="' + esc(p.id) + '">' +
                (hasCaptions ? "CC" : "No captions") +
              "</span>" +
              (isAdmin && !U.toBool(p.published) ? '<span class="absolute left-2 top-2 rounded-full bg-foreground/80 px-2.5 py-1 text-[11px] font-semibold text-white">Unpublished</span>' : "") +
            "</a>" +
            '<div class="flex flex-1 flex-col p-5">' +
              '<h2 class="font-bold"><a href="' + href + '" class="hover:text-primary">' + esc(p.title) + "</a></h2>" +
              '<p class="mt-1.5 line-clamp-2 text-sm text-muted-foreground">' + esc(p.description || "") + "</p>" +
              '<p class="mt-auto pt-3 text-xs text-muted-foreground">' + esc(U.formatDate(p.created_at)) + "</p>" +
            "</div>" +
          "</article>"
        );
      }).join("")
    );

    $list.find("video").each(function () {
      var video = this;
      var $badge = $(video).closest("a").find("[data-length-for]");
      $(video).one("loadedmetadata", function () {
        if (isFinite(video.duration)) $badge.text(U.formatDuration(video.duration) + ($badge.text() === "CC" ? " · CC" : ""));
      });
    });
  }

  function load() {
    $list.html(CivicUI.skeletonCards(3));
    CivicCache.cachedGet("promos", "/promos?limit=100")
      .then(function (body) {
        promos = body.data || [];
        render();
      })
      .catch(function (err) {
        $list.html(CivicUI.errorState(err));
        $list.find("[data-retry]").on("click", load);
      });
  }

  $("#search").on("input", U.debounce(render, 200));
  load();
});
