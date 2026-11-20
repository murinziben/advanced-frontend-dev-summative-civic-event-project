/*
 * Announcement detail (announcement.html?id=...)
 * ---------------------------------------------------------------
 * APIs:
 *   GET    /api/announcements/:id
 *   PATCH  /api/announcements/:id/publish     (admin)
 *   PATCH  /api/announcements/:id/unpublish   (admin)
 *   DELETE /api/announcements/:id             (admin)
 *
 * Audio: HTML5 <audio> with source = audio_url, wrapped in the
 * accessible CivicMedia player (play/pause, seek, time, volume).
 *
 * Transcript: the provided backend has no transcript field, so we
 * say so clearly instead of inventing text.
 */
CivicApp.start(function () {
  var U = CivicUtils;
  var esc = U.escapeHtml;
  var isAdmin = CivicAuth.isAdmin();
  var id = U.getQueryParam("id");
  var item = null;
  var $root = $("#announcement-root");

  function notFound() {
    $root.html('<div class="grid">' + CivicUI.emptyState("Announcement not found", "It may have been removed or isn't published yet.",
      '<a href="announcements.html" class="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">All announcements</a>') + "</div>");
  }

  function render() {
    document.title = item.title + " · CivicEvents";
    $root.html(
      '<article aria-labelledby="announcement-title">' +
        '<div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">' +
          '<span class="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">Audio announcement</span>' +
          '<time datetime="' + esc(item.created_at) + '">' + esc(U.formatDateTime(item.created_at)) + "</time>" +
          (isAdmin ? CivicAdminLayout.statusBadge(item.published) : "") +
        "</div>" +
        '<h1 id="announcement-title" class="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">' + esc(item.title) + "</h1>" +
        '<p class="mt-2 text-muted-foreground">Issued by the City of Greenhill</p>' +

        '<section class="mt-8 rounded-xl border border-border bg-card p-5 shadow-card" aria-labelledby="listen-title">' +
          '<h2 id="listen-title" class="mb-3 text-sm font-semibold">Listen <span id="duration-label" class="font-normal text-muted-foreground"></span></h2>' +
          '<div id="player"></div>' +
          '<p class="mt-3 text-xs text-muted-foreground">Tip: use Tab to reach the controls, Space or Enter to play and pause, and the arrow keys on the slider to move through the recording.</p>' +
        "</section>" +

        '<section class="mt-8" aria-labelledby="transcript-title">' +
          '<h2 id="transcript-title" class="text-lg font-bold">Transcript</h2>' +
          '<p class="mt-2 rounded-xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">' +
            "A written transcript wasn't provided for this announcement. If you need this information in another format, contact " +
            '<a class="font-semibold text-primary hover:underline" href="mailto:' + esc(CivicConfig.CONTACT.email) + '">' + esc(CivicConfig.CONTACT.email) + "</a>." +
          "</p>" +
        "</section>" +

        (isAdmin
          ? '<section class="mt-8 rounded-xl border border-border bg-card p-5 shadow-card" aria-labelledby="admin-title">' +
              '<h2 id="admin-title" class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin actions</h2>' +
              '<div class="mt-3 flex flex-wrap gap-2">' +
                '<a href="admin/announcement-form.html?id=' + encodeURIComponent(item.id) + '" class="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Edit</a>' +
                '<button type="button" id="toggle-publish" class="rounded-lg border border-input px-4 py-2.5 text-sm font-semibold hover:bg-muted">' + (U.toBool(item.published) ? "Unpublish" : "Publish") + "</button>" +
                '<button type="button" id="delete-item" class="rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive-soft">Delete</button>' +
              "</div>" +
            "</section>"
          : "") +
      "</article>"
    );

    CivicMedia.audioPlayer("#player", {
      src: item.audio_url,
      title: item.title,
      onDuration: function (sec) { $("#duration-label").text("(" + U.formatDuration(sec) + ")"); },
    });

    $("#toggle-publish").on("click", togglePublish);
    $("#delete-item").on("click", remove);
  }

  function togglePublish() {
    var $btn = $("#toggle-publish");
    var publish = !U.toBool(item.published);
    CivicUI.setButtonLoading($btn, true, publish ? "Publishing…" : "Unpublishing…");
    CivicApi.patch("/announcements/" + encodeURIComponent(item.id) + (publish ? "/publish" : "/unpublish"))
      .then(function (body) {
        item = body.data || Object.assign(item, { published: publish });
        CivicCache.invalidate("announcements");
        CivicUI.toast("success", publish ? "Announcement published. Residents were notified." : "Announcement unpublished.");
        render();
        $("#toggle-publish").trigger("focus");
      })
      .catch(function (err) {
        CivicUI.setButtonLoading($btn, false);
        CivicUI.toast("error", err.message);
      });
  }

  function remove() {
    CivicUI.confirm({ title: "Delete this announcement?", message: "“" + item.title + "” will be permanently removed.", confirmText: "Delete", danger: true })
      .then(function (ok) {
        if (!ok) return;
        CivicApi.del("/announcements/" + encodeURIComponent(item.id))
          .then(function () {
            CivicCache.invalidate("announcements");
            CivicAuth.setFlash("success", "Announcement deleted.");
            window.location.href = "admin/announcements.html";
          })
          .catch(function (err) { CivicUI.toast("error", err.message); });
      });
  }

  function load() {
    if (!id) return notFound();
    $root.html('<div aria-hidden="true"><div class="skeleton h-4 w-40"></div><div class="skeleton mt-4 h-9 w-2/3"></div><div class="skeleton mt-8 h-24 w-full rounded-xl"></div></div>');
    CivicApi.get("/announcements/" + encodeURIComponent(id))
      .then(function (body) {
        item = body.data;
        if (!item || (!isAdmin && !U.toBool(item.published))) return notFound();
        render();
      })
      .catch(function (err) {
        if (err.status === 404 || (err.status === 500 && /uuid/i.test(err.message))) return notFound();
        $root.html('<div class="grid">' + CivicUI.errorState(err) + "</div>");
        $root.find("[data-retry]").on("click", load);
      });
  }

  load();
});
