/*
 * Promo detail (promo.html?id=...)
 * ---------------------------------------------------------------
 * APIs:
 *   GET    /api/promos/:id
 *   PATCH  /api/promos/:id/publish | /unpublish   (admin)
 *   DELETE /api/promos/:id                        (admin)
 *
 * Video: native <video controls> gives play/pause, volume, fullscreen
 * and a CC button, all keyboard accessible.
 * Captions: built from caption_text by CivicMedia.attachCaptions()
 * (see js/components/media.js) and shown by default.
 * The full caption text is also printed below as a transcript.
 */
CivicApp.start(function () {
  var U = CivicUtils;
  var esc = U.escapeHtml;
  var isAdmin = CivicAuth.isAdmin();
  var id = U.getQueryParam("id");
  var promo = null;
  var $root = $("#promo-root");

  function notFound() {
    $root.html('<div class="grid">' + CivicUI.emptyState("Promo not found", "It may have been removed or isn't published yet.",
      '<a href="promos.html" class="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">All promos</a>') + "</div>");
  }

  function render() {
    document.title = promo.title + " · CivicEvents";
    var hasCaptions = promo.caption_text && String(promo.caption_text).trim();

    $root.html(
      '<article aria-labelledby="promo-title">' +
        '<div class="overflow-hidden rounded-xl bg-black shadow-lift">' +
          '<video id="promo-video" controls playsinline preload="metadata" class="aspect-video w-full" aria-describedby="promo-desc">' +
            '<source src="' + esc(promo.video_url) + '" />' +
            'Your browser can\'t play this video. <a href="' + esc(promo.video_url) + '" download>Download the video</a>.' +
          "</video>" +
        "</div>" +
        '<p id="video-error" class="mt-3 hidden rounded-lg bg-destructive-soft p-3 text-sm text-destructive" role="alert"></p>' +
        '<div class="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">' +
          "<time datetime=\"" + esc(promo.created_at) + '">' + esc(U.formatDate(promo.created_at)) + "</time>" +
          '<span aria-hidden="true">·</span><span id="video-length">Loading length…</span>' +
          '<span aria-hidden="true">·</span><span>' + (hasCaptions ? "English captions available" : "No captions") + "</span>" +
          (isAdmin ? CivicAdminLayout.statusBadge(promo.published) : "") +
        "</div>" +
        '<h1 id="promo-title" class="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">' + esc(promo.title) + "</h1>" +
        '<p id="promo-desc" class="mt-3 max-w-prose text-base text-foreground/85">' + esc(promo.description || "") + "</p>" +

        '<section class="mt-8" aria-labelledby="transcript-title">' +
          '<h2 id="transcript-title" class="text-lg font-bold">Transcript</h2>' +
          (hasCaptions
            ? '<div class="mt-2 whitespace-pre-line rounded-xl border border-border bg-card p-5 text-sm leading-relaxed shadow-card">' + esc(promo.caption_text) + "</div>"
            : '<p class="mt-2 rounded-xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">No transcript was provided for this video.</p>') +
        "</section>" +

        (isAdmin
          ? '<section class="mt-8 rounded-xl border border-border bg-card p-5 shadow-card" aria-labelledby="admin-title">' +
              '<h2 id="admin-title" class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin actions</h2>' +
              '<div class="mt-3 flex flex-wrap gap-2">' +
                '<a href="admin/promo-form.html?id=' + encodeURIComponent(promo.id) + '" class="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Edit</a>' +
                '<button type="button" id="toggle-publish" class="rounded-lg border border-input px-4 py-2.5 text-sm font-semibold hover:bg-muted">' + (U.toBool(promo.published) ? "Unpublish" : "Publish") + "</button>" +
                '<button type="button" id="delete-item" class="rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive-soft">Delete</button>' +
              "</div>" +
            "</section>"
          : "") +
      "</article>"
    );

    var video = document.getElementById("promo-video");
    CivicMedia.attachCaptions(video, promo.caption_text);
    $(video).on("loadedmetadata", function () {
      if (isFinite(video.duration)) $("#video-length").text(U.formatDuration(video.duration));
    });
    $(video).find("source").on("error", function () {
      $("#video-error").removeClass("hidden").html('This video couldn\'t be loaded. <a class="underline" href="' + esc(promo.video_url) + '" download>Try downloading it</a>.');
      $("#video-length").text("Unavailable");
    });

    $("#toggle-publish").on("click", togglePublish);
    $("#delete-item").on("click", remove);
  }

  function togglePublish() {
    var $btn = $("#toggle-publish");
    var publish = !U.toBool(promo.published);
    CivicUI.setButtonLoading($btn, true, publish ? "Publishing…" : "Unpublishing…");
    CivicApi.patch("/promos/" + encodeURIComponent(promo.id) + (publish ? "/publish" : "/unpublish"))
      .then(function (body) {
        promo = body.data || Object.assign(promo, { published: publish });
        CivicCache.invalidate("promos");
        CivicUI.toast("success", publish ? "Promo published. Residents were notified." : "Promo unpublished.");
        render();
      })
      .catch(function (err) {
        CivicUI.setButtonLoading($btn, false);
        CivicUI.toast("error", err.message);
      });
  }

  function remove() {
    CivicUI.confirm({ title: "Delete this promo?", message: "“" + promo.title + "” will be permanently removed.", confirmText: "Delete", danger: true })
      .then(function (ok) {
        if (!ok) return;
        CivicApi.del("/promos/" + encodeURIComponent(promo.id))
          .then(function () {
            CivicCache.invalidate("promos");
            CivicAuth.setFlash("success", "Promo deleted.");
            window.location.href = "admin/promos.html";
          })
          .catch(function (err) { CivicUI.toast("error", err.message); });
      });
  }

  function load() {
    if (!id) return notFound();
    $root.html('<div aria-hidden="true"><div class="skeleton aspect-video w-full rounded-xl"></div><div class="skeleton mt-6 h-9 w-2/3"></div></div>');
    CivicApi.get("/promos/" + encodeURIComponent(id))
      .then(function (body) {
        promo = body.data;
        if (!promo || (!isAdmin && !U.toBool(promo.published))) return notFound();
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
