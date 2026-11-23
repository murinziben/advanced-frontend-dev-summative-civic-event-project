CivicApp.start(function () {
  var U = CivicUtils;
  var esc = U.escapeHtml;
  var isAdmin = CivicAuth.isAdmin();
  var items = [];
  var $list = $("#announcements-list");

  function render() {
    var q = $("#search").val().trim().toLowerCase();
    var list = items.filter(function (a) {
      // ROLE GUARD: residents only see published announcements.
      if (!isAdmin && !U.toBool(a.published)) return false;
      return !q || (a.title || "").toLowerCase().indexOf(q) !== -1;
    });

    $("#announcements-count").text(list.length + (list.length === 1 ? " announcement" : " announcements"));

    if (!list.length) {
      $list.html(CivicUI.emptyState(
        q ? "No announcements match your search" : "No announcements yet",
        q ? "Try a different word." : "Updates from city departments will appear here."
      ));
      return;
    }

    $list.html(
      list.map(function (a) {
        return (
          '<article class="rounded-xl border border-border bg-card p-5 shadow-card" aria-labelledby="a-' + esc(a.id) + '">' +
            '<div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">' +
              '<span class="rounded-full bg-primary-soft px-2.5 py-1 font-semibold text-primary">Audio</span>' +
              '<time datetime="' + esc(a.created_at) + '">' + esc(U.formatDate(a.created_at)) + "</time>" +
              '<span aria-hidden="true">·</span><span data-duration-for="' + esc(a.id) + '">Length loading…</span>' +
              (isAdmin ? '<span class="ml-auto">' + CivicAdminLayout.statusBadge(a.published) + "</span>" : "") +
            "</div>" +
            '<h2 id="a-' + esc(a.id) + '" class="mt-2 text-lg font-bold"><a class="hover:text-primary" href="announcement.html?id=' + encodeURIComponent(a.id) + '">' + esc(a.title) + "</a></h2>" +
            '<div class="mt-4" data-player-for="' + esc(a.id) + '"></div>' +
            '<div class="mt-3 flex flex-wrap gap-4 text-sm">' +
              '<a href="announcement.html?id=' + encodeURIComponent(a.id) + '" class="font-semibold text-primary hover:underline">Details &amp; transcript<span class="sr-only"> for ' + esc(a.title) + "</span></a>" +
              (isAdmin ? '<a href="admin/announcement-form.html?id=' + encodeURIComponent(a.id) + '" class="font-semibold text-muted-foreground hover:text-foreground">Manage<span class="sr-only"> ' + esc(a.title) + "</span></a>" : "") +
            "</div>" +
          "</article>"
        );
      }).join("")
    );

    list.forEach(function (a) {
      CivicMedia.audioPlayer($list.find('[data-player-for="' + a.id + '"]'), {
        src: a.audio_url,
        title: a.title,
        compact: true,
        // The backend doesn't store the length, so it's read from the audio file.
        onDuration: function (sec) { $list.find('[data-duration-for="' + a.id + '"]').text(U.formatDuration(sec) + " audio"); },
      });
    });
  }

  function load() {
    $list.html(CivicUI.skeletonCards(3, false));
    CivicCache.cachedGet("announcements", "/announcements?limit=100")
      .then(function (body) {
        items = body.data || [];
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
