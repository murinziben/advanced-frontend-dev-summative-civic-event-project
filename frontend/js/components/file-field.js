window.CivicFileField = (function () {
  var U = window.CivicUtils;
  var esc = U.escapeHtml;

  function init(o) {
    var $input = $(o.input);
    var $preview = $(o.preview);
    var rules = window.CivicConfig.UPLOADS[o.kind];
    var objectUrl = null;
    var valid = true;
    var renamed = null;

    // WhatsApp and some recorders save MP3 audio as ".mpeg"; the backend only checks the
    // extension, so the same bytes are sent under the name it accepts.
    function normalise(file) {
      var dot = file.name.lastIndexOf(".");
      var ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
      var target = (rules.aliases || {})[ext];
      if (!target) return file;
      return new File([file], file.name.slice(0, dot) + target, { type: "audio/mpeg", lastModified: file.lastModified });
    }

    $input.attr("accept", rules.extensions.concat(Object.keys(rules.aliases || {})).join(","));

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
      renamed = null;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = null;
      valid = true;
      window.CivicUI.clearFieldError($input);
      if (o.existingUrl) showPreview(o.existingUrl, "", 0, true);
      else $preview.empty();
    }

    $input.on("change", function () {
      window.CivicUI.clearFieldError($input);
      renamed = null;
      var file = this.files && this.files[0];
      if (!file) return reset();
      var fixed = normalise(file);
      if (fixed !== file) { renamed = fixed; file = fixed; }

      // Checking before upload avoids sending a large file the server would reject anyway.
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
      getFile: function () { return renamed || ($input.get(0).files || [])[0] || null; },
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
