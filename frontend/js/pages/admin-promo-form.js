CivicApp.start(function () {
  var U = CivicUtils;
  CivicAdminLayout.init();

  var id = U.getQueryParam("id");
  var editing = !!id;
  var $form = $("#promo-form");
  var $submit = $("#promo-submit");
  var videoField;

  $("#form-title").text(editing ? "Edit promo" : "New promo video");
  $submit.text(editing ? "Save changes" : "Upload promo");
  document.title = (editing ? "Edit promo" : "New promo") + " · CivicEvents";
  if (editing) $("#video-required").addClass("hidden");

  function initVideo(existing) {
    videoField = CivicFileField.init({ input: "#video", kind: "video", preview: "#video-preview", existingUrl: existing });
  }

  if (editing) {
    $form.addClass("opacity-60 pointer-events-none");
    CivicApi.get("/promos/" + encodeURIComponent(id))
      .then(function (body) {
        var p = body.data;
        $("#title").val(p.title);
        $("#description").val(p.description || "");
        $("#caption_text").val(p.caption_text || "").trigger("input");
        $("#published").prop("checked", U.toBool(p.published)).trigger("change");
        initVideo(p.video_url);
        $form.removeClass("opacity-60 pointer-events-none");
      })
      .catch(function (err) {
        $form.replaceWith('<div class="grid">' + CivicUI.errorState(err) + "</div>");
        $("[data-retry]").on("click", function () { window.location.reload(); });
      });
  } else {
    initVideo(null);
  }

  $("#published").on("change", function () {
    $("#published-label").text(this.checked ? "Published – residents can see it" : "Draft – only admins can see it");
  }).trigger("change");

  $("#caption_text").on("input", function () {
    var words = this.value.trim() ? this.value.trim().split(/\s+/).length : 0;
    $("#caption-count").text(words + (words === 1 ? " word" : " words"));
  }).trigger("input");

  $form.on("input", "input[type=text], textarea", function () { CivicUI.clearFieldError(this); });

  function validate() {
    CivicUI.clearFormErrors($form);
    var ok = true;
    function fail(sel, msg) { CivicUI.showFieldError(sel, msg); ok = false; }
    if (!$("#title").val().trim()) fail("#title", "Enter a title.");
    if (!$("#description").val().trim()) fail("#description", "Enter a short description.");
    if (!$("#caption_text").val().trim()) fail("#caption_text", "Enter the caption text. Captions make the video accessible to Deaf and hard-of-hearing residents.");
    if (!editing && !videoField.getFile()) fail("#video", "Choose a video file to upload.");
    if (videoField && !videoField.isValid()) ok = false;
    if (!ok) $form.find("[aria-invalid=true]").first().trigger("focus");
    return ok;
  }

  $form.on("submit", function (e) {
    e.preventDefault();
    if (!validate()) return;

    var published = $("#published").is(":checked");
    var data = new FormData();
    data.append("title", $("#title").val().trim());
    data.append("description", $("#description").val().trim());
    data.append("caption_text", $("#caption_text").val().trim());
    if (editing) data.append("published", published ? "true" : "false");
    var file = videoField.getFile();
    // The key must be "video" to match uploadPromoVideo.single('video').
    if (file) data.append("video", file);

    CivicUI.setButtonLoading($submit, true, file ? "Uploading…" : "Saving…");

    CivicApi.upload(editing ? "PUT" : "POST", editing ? "/promos/" + encodeURIComponent(id) : "/promos", data, file ? videoField.setProgress : null)
      .then(function (body) {
        // New promos are always created as published, so a draft is unpublished right after creation.
        if (!editing && !published && body.data && body.data.id) {
          return CivicApi.patch("/promos/" + encodeURIComponent(body.data.id) + "/unpublish");
        }
      })
      .then(function () {
        CivicCache.invalidate("promos");
        CivicAuth.setFlash("success", editing ? "Promo updated." : "Promo uploaded." + (published ? " Residents have been notified." : " Saved as a draft."));
        window.location.href = "promos.html";
      })
      .catch(function (err) {
        CivicUI.setButtonLoading($submit, false);
        CivicUI.showFormAlert($form, err.message);
        $form.find("[data-form-alert]").attr("tabindex", "-1").trigger("focus");
      });
  });
});
