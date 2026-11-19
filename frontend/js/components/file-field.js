/*
 * CivicFileField – file inputs with checks, preview and upload progress.
 * ---------------------------------------------------------------
 * Brief: "For file uploads: show size/type errors before uploading",
 *        "Show preview of uploaded image before submit",
 *        "Provide labels for file inputs and show clear progress indicators".
 *
 * Usage:
 *   var field = CivicFileField.init({
 *     input: "#image", kind: "image", preview: "#image-preview", existingUrl: url
 *   });
 *   field.getFile()          → the chosen File, or null
 *   field.isValid()          → false if the chosen file breaks the rules
 *   field.setProgress(42)    → updates the progress bar
 */
window.CivicFileField = (function () {
  var U = window.CivicUtils;
  var esc = U.escapeHtml;

  function init(o) {
    var $input = $(o.input);
    var $preview = $(o.preview);
    var rules = window.CivicConfig.UPLOADS[o.kind];
    var objectUrl = null;
    var valid = true;

    // Tell the browser's file picker which files to show.
    $input.attr("accept", rules.extensions.join(","));

    // Hint under the input (linked with aria-describedby).
    var hintId = $input.attr("id") + "-hint";
    if (!$("#" + hintId).length) {
      $input.after('<p id="' + hintId + '" class="mt-1.5 text-xs text-muted-foreground">' + esc(rules.label) + "</p>");
      $input.attr("aria-describedby", (($input.attr("aria-describedby") || "") + " " + hintId).trim());
    }

    function showPreview(url, name, size, isExisting) {
      var media;
      if (o.kind === "image") {
        media = '<img src="' + esc(url) + '" alt="Preview of the selected image" class="h-48 w-full rounded-lg object-cover" />';
      } else if (o.kind === "audio") {
        media = '<audio controls preload="metadata" src="' + esc(url) + '" class="w-full">Your browser can\'t preview this audio.</audio>';
      } else {
        media = '<video controls preload="metadata" src="' + esc(url) + '" class="max-h-64 w-full rounded-lg bg-black">Your browser can\'t preview this video.</video>';
      }
      $preview.html(
        '<div class="rounded-xl border border-border bg-muted/50 p-3">' + media +
          '<div class="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">' +
            '<span class="truncate">' + (isExisting ? "Current file" : esc(name) + " · " + U.formatBytes(size)) + "</span>" +
            (isExisting ? "" : '<button type="button" data-clear-file class="font-semibold text-destructive hover:underline">Remove</button>') +
          "</div>" +
          '<div data-progress class="mt-3 hidden" role="progressbar" aria-label="Upload progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
            '<div class="h-2 overflow-hidden rounded-full bg-border"><div data-progress-bar class="h-full w-0 rounded-full bg-primary transition-all"></div></div>' +
            '<p data-progress-text class="mt-1 text-xs font-semibold text-primary">Uploading… 0%</p>' +
          "</div>" +
        "</div>"
      );
      $preview.find("[data-clear-file]").on("click", function () {
        $input.val("");
        reset();
        $input.trigger("focus");
      });
    }

    function reset() {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = null;
      valid = true;
      window.CivicUI.clearFieldError($input);
      if (o.existingUrl) showPreview(o.existingUrl, "", 0, true);
      else $preview.empty();
    }

    $input.on("change", function () {
      window.CivicUI.clearFieldError($input);
      var file = this.files && this.files[0];
      if (!file) return reset();

      var error = U.validateFile(file, o.kind);
      if (error) {
        valid = false;
        window.CivicUI.showFieldError($input, error);
        $preview.empty();
        return;
      }
      valid = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(file);
      showPreview(objectUrl, file.name, file.size, false);
      if (o.onChange) o.onChange(file);
    });

    reset();

    return {
      getFile: function () { return ($input.get(0).files || [])[0] || null; },
      isValid: function () { return valid; },
      setProgress: function (percent) {
        var $p = $preview.find("[data-progress]").removeClass("hidden").attr("aria-valuenow", percent);
        $p.find("[data-progress-bar]").css("width", percent + "%");
        $p.find("[data-progress-text]").text(percent < 100 ? "Uploading… " + percent + "%" : "Processing…");
      },
    };
  }

  return { init: init };
})();
