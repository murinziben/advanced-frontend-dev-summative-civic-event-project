/*
 * CivicUI – reusable interface pieces built with jQuery.
 * ---------------------------------------------------------------
 *  - toast()          small success/error messages in the corner
 *  - confirm()        accessible "Are you sure?" dialog (returns a Promise)
 *  - setButtonLoading() spinner + disabled state while a request runs
 *  - showFieldError() / clearFormErrors()  accessible form validation
 *  - skeletonCards() / emptyState() / errorState()  list placeholders
 *  - icon()           inline SVG icons (no icon library needed)
 */
window.CivicUI = (function () {
  var esc = function (v) { return window.CivicUtils.escapeHtml(v); };

  /* ------------------------------------------------------------------ */
  /* Icons – simple stroke icons (Lucide-style) so we don't add a library */
  /* ------------------------------------------------------------------ */
  var ICONS = {
    landmark: '<path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2 20 7H4z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    play: '<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4V8z"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    logOut: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    layout: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.39-1.61"/><path d="m2 2 20 20"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    wifiOff: '<path d="m2 2 20 20"/><path d="M8.5 16.5a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76"/><path d="M12 20h.01"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  };

  /** Returns an <svg> string. Decorative by default (aria-hidden). */
  function icon(name, classes) {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" class="' +
      (classes || "h-5 w-5") + '">' + (ICONS[name] || "") + "</svg>"
    );
  }

  /* ------------------------------------------------------------------ */
  /* Toasts                                                              */
  /* ------------------------------------------------------------------ */
  function toastRegion() {
    var $region = $("#toast-region");
    if (!$region.length) {
      // aria-live="polite" makes screen readers read new toasts aloud.
      $region = $(
        '<div id="toast-region" class="fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite" aria-atomic="false"></div>'
      );
      $("body").append($region);
    }
    return $region;
  }

  /**
   * toast("success" | "error" | "warning" | "info", "Message")
   */
  function toast(type, message, timeoutMs) {
    var styles = {
      success: { icon: "checkCircle", cls: "border-success/30", iconCls: "text-success" },
      error: { icon: "alert", cls: "border-destructive/30", iconCls: "text-destructive" },
      warning: { icon: "alert", cls: "border-warning/40", iconCls: "text-secondary" },
      info: { icon: "info", cls: "border-primary/20", iconCls: "text-primary" },
    };
    var s = styles[type] || styles.info;
    var $toast = $(
      '<div class="toast-enter flex items-start gap-3 rounded-lg border bg-card p-4 text-sm shadow-lift ' + s.cls + '" ' +
        (type === "error" ? 'role="alert"' : 'role="status"') + ">" +
        '<span class="mt-0.5 shrink-0 ' + s.iconCls + '">' + icon(s.icon) + "</span>" +
        '<p class="flex-1 text-foreground">' + esc(message) + "</p>" +
        '<button type="button" class="rounded p-0.5 text-muted-foreground hover:text-foreground" aria-label="Dismiss message">' +
        icon("x", "h-4 w-4") + "</button></div>"
    );

    function close() {
      $toast.removeClass("toast-enter").addClass("toast-leave");
      setTimeout(function () { $toast.remove(); }, 200);
    }

    $toast.find("button").on("click", close);
    toastRegion().append($toast);
    setTimeout(close, timeoutMs || (type === "error" ? 7000 : 4500));
  }

  /** Shows a message saved before a redirect (e.g. "Account created"). */
  function showFlash() {
    var flash = window.CivicAuth.takeFlash();
    if (flash) toast(flash.type, flash.message);
  }

  /* ------------------------------------------------------------------ */
  /* Confirmation dialog                                                 */
  /* ------------------------------------------------------------------ */
  /**
   * CivicUI.confirm({ title, message, confirmText, danger }) → Promise<boolean>
   * Accessible: role="dialog", focus moves into the dialog, Tab stays inside,
   * Esc cancels, and focus returns to the button that opened it.
   */
  function confirmDialog(options) {
    var o = Object.assign(
      { title: "Are you sure?", message: "", confirmText: "Confirm", cancelText: "Cancel", danger: false },
      options
    );
    var previousFocus = document.activeElement;

    return new Promise(function (resolve) {
      var confirmCls = o.danger
        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
        : "bg-primary text-primary-foreground hover:bg-primary/90";

      var $modal = $(
        '<div class="modal-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">' +
          '<div class="modal-panel w-full max-w-md rounded-xl bg-card p-6 shadow-lift" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-desc">' +
            '<h2 id="confirm-title" class="text-lg font-bold">' + esc(o.title) + "</h2>" +
            '<p id="confirm-desc" class="mt-2 text-sm text-muted-foreground">' + esc(o.message) + "</p>" +
            '<div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">' +
              '<button type="button" data-action="cancel" class="rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted">' + esc(o.cancelText) + "</button>" +
              '<button type="button" data-action="confirm" class="rounded-lg px-4 py-2.5 text-sm font-semibold ' + confirmCls + '">' + esc(o.confirmText) + "</button>" +
            "</div>" +
          "</div>" +
        "</div>"
      );

      function finish(result) {
        $(document).off("keydown.civicConfirm");
        $modal.remove();
        if (previousFocus && previousFocus.focus) previousFocus.focus();
        resolve(result);
      }

      $modal.on("click", '[data-action="cancel"]', function () { finish(false); });
      $modal.on("click", '[data-action="confirm"]', function () { finish(true); });
      $modal.on("click", function (e) { if (e.target === this) finish(false); });

      $(document).on("keydown.civicConfirm", function (e) {
        if (e.key === "Escape") finish(false);
        if (e.key === "Tab") {
          // Focus trap: keep Tab inside the two buttons.
          var $buttons = $modal.find("button");
          var first = $buttons.get(0);
          var last = $buttons.get($buttons.length - 1);
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });

      $("body").append($modal);
      $modal.find('[data-action="cancel"]').trigger("focus");
    });
  }

  /* ------------------------------------------------------------------ */
  /* Buttons & forms                                                     */
  /* ------------------------------------------------------------------ */
  /** Shows a spinner in a button and disables it while a request runs. */
  function setButtonLoading($btn, loading, loadingText) {
    $btn = $($btn);
    if (loading) {
      $btn.data("original-html", $btn.html());
      $btn.prop("disabled", true).attr("aria-busy", "true");
      $btn.html(
        '<span class="inline-flex items-center justify-center gap-2">' +
          '<span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"></span>' +
          esc(loadingText || "Please wait…") +
        "</span>"
      );
    } else {
      $btn.prop("disabled", false).removeAttr("aria-busy");
      if ($btn.data("original-html")) $btn.html($btn.data("original-html"));
    }
  }

  /**
   * Shows an error under a form field.
   * Sets aria-invalid and links the message with aria-describedby,
   * so screen readers announce the problem when the field is focused.
   */
  function showFieldError(input, message) {
    var $input = $(input);
    var id = $input.attr("id");
    var errorId = id + "-error";
    $("#" + errorId).remove();
    $input.attr("aria-invalid", "true").addClass("border-destructive");

    var describedBy = ($input.attr("aria-describedby") || "").split(" ").filter(Boolean);
    if (describedBy.indexOf(errorId) === -1) describedBy.push(errorId);
    $input.attr("aria-describedby", describedBy.join(" "));

    var $msg = $('<p class="mt-1.5 flex items-center gap-1 text-xs font-medium text-destructive"></p>')
      .attr("id", errorId)
      .html(icon("alert", "h-3.5 w-3.5 shrink-0") + "<span>" + esc(message) + "</span>");

    // Put the message after the field (or after its wrapper if it has one).
    var $anchor = $input.closest("[data-field]").length ? $input.closest("[data-field]") : $input;
    $anchor.after($msg);
  }

  function clearFieldError(input) {
    var $input = $(input);
    var errorId = $input.attr("id") + "-error";
    $("#" + errorId).remove();
    $input.removeAttr("aria-invalid").removeClass("border-destructive");
    var describedBy = ($input.attr("aria-describedby") || "").split(" ").filter(function (x) { return x && x !== errorId; });
    if (describedBy.length) $input.attr("aria-describedby", describedBy.join(" "));
    else $input.removeAttr("aria-describedby");
  }

  function clearFormErrors(form) {
    $(form).find("[aria-invalid]").each(function () { clearFieldError(this); });
    $(form).find("[data-form-alert]").addClass("hidden").empty();
  }

  /** A banner at the top of a form for errors that aren't about one field. */
  function showFormAlert(form, message) {
    var $alert = $(form).find("[data-form-alert]");
    $alert
      .removeClass("hidden")
      .html(
        '<div class="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive-soft p-3 text-sm text-destructive" role="alert">' +
          icon("alert", "mt-0.5 h-4 w-4 shrink-0") + "<span>" + esc(message) + "</span></div>"
      );
  }

  /* ------------------------------------------------------------------ */
  /* List placeholders                                                   */
  /* ------------------------------------------------------------------ */
  /** Grey shimmering cards shown while a list is loading. */
  function skeletonCards(count, withImage) {
    var html = "";
    for (var i = 0; i < (count || 3); i++) {
      html +=
        '<div class="overflow-hidden rounded-xl border border-border bg-card shadow-card" aria-hidden="true">' +
          (withImage === false ? "" : '<div class="skeleton h-44 rounded-none"></div>') +
          '<div class="space-y-3 p-5">' +
            '<div class="skeleton h-3 w-24"></div>' +
            '<div class="skeleton h-5 w-3/4"></div>' +
            '<div class="skeleton h-3 w-1/2"></div>' +
            '<div class="skeleton h-3 w-2/3"></div>' +
          "</div>" +
        "</div>";
    }
    return html + '<span class="sr-only" role="status">Loading…</span>';
  }

  /** Friendly "nothing here" message. */
  function emptyState(title, message, actionHtml) {
    return (
      '<div class="col-span-full flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">' +
        '<span class="mb-3 rounded-full bg-primary-soft p-3 text-primary">' + icon("inbox", "h-6 w-6") + "</span>" +
        '<h3 class="text-base font-bold">' + esc(title) + "</h3>" +
        '<p class="mt-1 max-w-sm text-sm text-muted-foreground">' + esc(message) + "</p>" +
        (actionHtml ? '<div class="mt-5">' + actionHtml + "</div>" : "") +
      "</div>"
    );
  }

  /**
   * Error message with a "Try again" button.
   * Usage: $list.html(CivicUI.errorState(err)); then
   *        $list.find("[data-retry]").on("click", loadAgain);
   */
  function errorState(error) {
    var offline = error && error.isNetworkError;
    return (
      '<div class="col-span-full flex flex-col items-center rounded-xl border border-destructive/20 bg-destructive-soft px-6 py-12 text-center" role="alert">' +
        '<span class="mb-3 rounded-full bg-card p-3 text-destructive">' + icon(offline ? "wifiOff" : "alert", "h-6 w-6") + "</span>" +
        '<h3 class="text-base font-bold">' + (offline ? "Connection problem" : "Something went wrong") + "</h3>" +
        '<p class="mt-1 max-w-md text-sm text-muted-foreground">' + esc((error && error.message) || "Please try again.") + "</p>" +
        '<button type="button" data-retry class="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">' +
          icon("refresh", "h-4 w-4") + "Try again</button>" +
      "</div>"
    );
  }

  return {
    icon: icon,
    toast: toast,
    showFlash: showFlash,
    confirm: confirmDialog,
    setButtonLoading: setButtonLoading,
    showFieldError: showFieldError,
    clearFieldError: clearFieldError,
    clearFormErrors: clearFormErrors,
    showFormAlert: showFormAlert,
    skeletonCards: skeletonCards,
    emptyState: emptyState,
    errorState: errorState,
  };
})();
