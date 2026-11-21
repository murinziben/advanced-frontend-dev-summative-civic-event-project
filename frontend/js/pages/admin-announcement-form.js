/*
 * Admin – create / edit announcement (admin/announcement-form.html[?id=...])
 * ---------------------------------------------------------------
 * APIs (admin only):
 *   POST /api/announcements      multipart: title*, audio* (file key "audio"), published
 *   PUT  /api/announcements/:id  multipart: title*, published
 *   GET  /api/announcements/:id  to fill the form when editing
 *
 * Backend facts (backend/src/controllers/announcements.controller.js):
 *   - Creating one also creates a broadcast notification for everyone.
 *   - The update route accepts an audio file but never saves it, so when
 *     editing we only allow changing the title and published status.
 */
CivicApp.start(function () {
  var U = CivicUtils;
  CivicAdminLayout.init();

  var id = U.getQueryParam("id");
  var editing = !!id;
  var $form = $("#announcement-form");
  var $submit = $("#announcement-submit");
  var audioField = null;

  $("#form-title").text(editing ? "Edit announcement" : "New announcement");
  $submit.text(editing ? "Save changes" : "Publish announcement");
  document.title = (editing ? "Edit announcement" : "New announcement") + " · CivicEvents";

  if (editing) {
    // Replacing the recording isn't supported by the backend → show the current one instead.
    $("#audio-group").html(
      '<p class="mb-1.5 text-sm font-semibold">Recording</p>' +
      '<div id="current-audio"></div>' +
      '<p class="mt-2 text-xs text-muted-foreground">The recording can\'t be replaced after upload (the backend doesn\'t support it). To change it, delete this announcement and create a new one.</p>'
    );
    $form.addClass("opacity-60 pointer-events-none");
    CivicApi.get("/announcements/" + encodeURIComponent(id))
      .then(function (body) {
        var a = body.data;
        $("#title").val(a.title);
        $("#published").prop("checked", U.toBool(a.published));
        CivicMedia.audioPlayer("#current-audio", { src: a.audio_url, title: a.title });
        $form.removeClass("opacity-60 pointer-events-none");
      })
      .catch(function (err) {
        $form.replaceWith('<div class="grid">' + CivicUI.errorState(err) + "</div>");
        $("[data-retry]").on("click", function () { window.location.reload(); });
      });
  } else {
    audioField = CivicFileField.init({ input: "#audio", kind: "audio", preview: "#audio-preview" });
  }

  $("#published").on("change", function () {
    $("#published-label").text(this.checked ? "Published – residents can see it" : "Draft – only admins can see it");
  }).trigger("change");

  $("#title").on("input", function () { CivicUI.clearFieldError(this); });

  $form.on("submit", function (e) {
    e.preventDefault();
    CivicUI.clearFormErrors($form);
    var ok = true;
    var title = $("#title").val().trim();
    if (!title) { CivicUI.showFieldError("#title", "Enter a title."); ok = false; }
    if (!editing) {
      if (!audioField.getFile()) { CivicUI.showFieldError("#audio", "Choose an audio file to upload."); ok = false; }
      else if (!audioField.isValid()) ok = false;
    }
    if (!ok) { $form.find("[aria-invalid=true]").first().trigger("focus"); return; }

    var data = new FormData();
    data.append("title", title);
    data.append("published", $("#published").is(":checked") ? "true" : "false");
    if (!editing) data.append("audio", audioField.getFile()); // key must be "audio"

    CivicUI.setButtonLoading($submit, true, editing ? "Saving…" : "Uploading…");

    CivicApi.upload(editing ? "PUT" : "POST", editing ? "/announcements/" + encodeURIComponent(id) : "/announcements", data, editing ? null : audioField.setProgress)
      .then(function () {
        CivicCache.invalidate("announcements");
        CivicAuth.setFlash("success", editing ? "Announcement updated." : "Announcement uploaded. Residents have been notified.");
        window.location.href = "announcements.html";
      })
      .catch(function (err) {
        CivicUI.setButtonLoading($submit, false);
        CivicUI.showFormAlert($form, err.message);
        $form.find("[data-form-alert]").attr("tabindex", "-1").trigger("focus");
      });
  });
});
