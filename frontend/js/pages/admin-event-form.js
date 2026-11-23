CivicApp.start(function () {
  var U = CivicUtils;
  CivicAdminLayout.init();

  var id = U.getQueryParam("id");
  var editing = !!id;
  var $form = $("#event-form");
  var $submit = $("#event-submit");
  var imageField;

  $("#form-title").text(editing ? "Edit event" : "Create event");
  $("#form-intro").text(editing ? "Update the details residents see. Leave the image empty to keep the current one." : "Add a new event. Residents get a notification as soon as you publish it.");
  $submit.text(editing ? "Save changes" : "Create event");
  document.title = (editing ? "Edit event" : "Create event") + " · CivicEvents";

  function initImage(existingUrl) {
    imageField = CivicFileField.init({ input: "#image", kind: "image", preview: "#image-preview", existingUrl: existingUrl });
  }

  if (editing) {
    $form.addClass("opacity-60 pointer-events-none").attr("aria-busy", "true");
    CivicApi.get("/events/" + encodeURIComponent(id))
      .then(function (body) {
        var e = body.data;
        $("#title").val(e.title);
        $("#description").val(e.description || "");
        $("#location").val(e.location || "");
        $("#starts_at").val(U.isoToLocalInput(e.starts_at));
        $("#ends_at").val(U.isoToLocalInput(e.ends_at));
        initImage(CivicCards.eventImage(e));
        $("#view-link").attr("href", "../event.html?id=" + encodeURIComponent(e.id)).removeClass("hidden");
        $form.removeClass("opacity-60 pointer-events-none").removeAttr("aria-busy");
      })
      .catch(function (err) {
        $form.replaceWith('<div class="grid">' + CivicUI.errorState(err) + "</div>");
        $("[data-retry]").on("click", function () { window.location.reload(); });
      });
  } else {
    initImage(null);
  }

  $form.on("input change", "input, textarea", function () { if (this.type !== "file") CivicUI.clearFieldError(this); });

  function validate() {
    CivicUI.clearFormErrors($form);
    var ok = true;
    function fail(sel, msg) { CivicUI.showFieldError($(sel), msg); ok = false; }

    var title = $("#title").val().trim();
    if (!title) fail("#title", "Enter a title for the event.");
    else if (title.length < 3) fail("#title", "The title must be at least 3 characters.");

    if (!$("#location").val().trim()) fail("#location", "Enter where the event takes place.");

    var start = $("#starts_at").val();
    var end = $("#ends_at").val();
    if (!start) fail("#starts_at", "Choose when the event starts.");
    if (!end) fail("#ends_at", "Choose when the event ends.");
    if (start && end && new Date(end) <= new Date(start)) fail("#ends_at", "The end must be after the start.");
    // Only new events: an existing event that already started can still be edited.
    if (!editing && start && new Date(start) < new Date()) fail("#starts_at", "New events must start in the future.");

    if (imageField && !imageField.isValid()) { ok = false; }

    if (!ok) $form.find("[aria-invalid=true]").first().trigger("focus");
    return ok;
  }

  $form.on("submit", function (e) {
    e.preventDefault();
    if (!validate()) return;

    var data = new FormData();
    data.append("title", $("#title").val().trim());
    data.append("description", $("#description").val().trim());
    data.append("location", $("#location").val().trim());
    data.append("starts_at", U.localInputToIso($("#starts_at").val()));
    data.append("ends_at", U.localInputToIso($("#ends_at").val()));
    var file = imageField.getFile();
    // The key must be "image" to match uploadEventImage.single('image').
    if (file) data.append("image", file);

    CivicUI.setButtonLoading($submit, true, file ? "Uploading…" : "Saving…");

    CivicApi.upload(editing ? "PUT" : "POST", editing ? "/events/" + encodeURIComponent(id) : "/events", data, file ? imageField.setProgress : null)
      .then(function (body) {
        var saved = body.data || {};
        CivicAuth.setFlash("success", editing ? "Event updated." : "Event created. Residents have been notified.");
        window.location.href = "../event.html?id=" + encodeURIComponent(saved.id || id);
      })
      .catch(function (err) {
        CivicUI.setButtonLoading($submit, false);

        if (err.errors && err.errors.length) {
          err.errors.forEach(function (fe) { if (fe.field && $("#" + fe.field).length) CivicUI.showFieldError($("#" + fe.field), fe.message); });
        }
        CivicUI.showFormAlert($form, err.message);
        $form.find("[data-form-alert]").attr("tabindex", "-1").trigger("focus");
      });
  });
});
