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
    // The update route ignores uploaded files, so a new recording is saved as a fresh announcement
    // and the old one is removed. That's the only way to swap audio without changing the backend.
    $("#audio-group").html(
      '<p class="mb-1.5 text-sm font-semibold">Current recording</p>' +
      '<div id="current-audio"></div>' +
      '<label for="audio" class="mb-1.5 mt-5 block text-sm font-semibold">Replace recording <span class="font-normal text-muted-foreground">(optional)</span></label>' +
      '<input id="audio" type="file" class="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary-soft file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-primary" />' +
      '<div id="audio-preview" class="mt-3" aria-live="polite"></div>' +
      '<p class="mt-2 text-xs text-muted-foreground">Choosing a new file re-publishes this announcement with the new audio, so residents get a fresh notification.</p>'
    );
    $("#announcement-delete").prop("hidden", false);
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
  }
  audioField = CivicFileField.init({ input: "#audio", kind: "audio", preview: "#audio-preview" });

  $("#announcement-delete").on("click", function () {
    CivicUI.confirm({
      title: "Delete this announcement?",
      message: "“" + $("#title").val() + "” and its recording will be permanently removed. This can't be undone.",
      confirmText: "Delete",
      danger: true,
    }).then(function (ok) {
      if (!ok) return;
      CivicApi.del("/announcements/" + encodeURIComponent(id))
        .then(function () {
          CivicCache.invalidate("announcements");
          CivicAuth.setFlash("success", "Announcement deleted.");
          window.location.href = "announcements.html";
        })
        .catch(function (err) { CivicUI.toast("error", "Couldn't delete: " + err.message); });
    });
  });

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
    var newFile = audioField.getFile();
    if (!editing && !newFile) { CivicUI.showFieldError("#audio", "Choose an audio file to upload."); ok = false; }
    else if (newFile && !audioField.isValid()) ok = false;
    if (!ok) { $form.find("[aria-invalid=true]").first().trigger("focus"); return; }

    var replacing = editing && !!newFile;
    var data = new FormData();
    data.append("title", title);
    data.append("published", $("#published").is(":checked") ? "true" : "false");
    // The key must be "audio" to match uploadAudio.single('audio').
    if (newFile) data.append("audio", newFile);

    CivicUI.setButtonLoading($submit, true, newFile ? "Uploading…" : "Saving…");

    var request = editing && !replacing
      ? CivicApi.upload("PUT", "/announcements/" + encodeURIComponent(id), data, null)
      : CivicApi.upload("POST", "/announcements", data, audioField.setProgress).then(function (res) {
          // Only remove the old one once the new recording is safely stored.
          return replacing ? CivicApi.del("/announcements/" + encodeURIComponent(id)).then(function () { return res; }) : res;
        });

    request
      .then(function () {
        CivicCache.invalidate("announcements");
        CivicAuth.setFlash("success", replacing ? "Recording replaced. Residents have been notified." : editing ? "Announcement updated." : "Announcement uploaded. Residents have been notified.");
        window.location.href = "announcements.html";
      })
      .catch(function (err) {
        CivicUI.setButtonLoading($submit, false);
        CivicUI.showFormAlert($form, err.message);
        $form.find("[data-form-alert]").attr("tabindex", "-1").trigger("focus");
      });
  });
});
