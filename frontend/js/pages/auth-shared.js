window.CivicAuthPages = (function () {
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function isValidEmail(value) {
    return EMAIL_PATTERN.test(String(value).trim());
  }

  function initLogo() {
    $("#auth-logo").html(
      // The logo alone isn't an obvious way back, so give visitors a clear text link.
      '<a href="' + window.CivicUtils.url("index.html") + '" class="mb-6 flex w-fit items-center gap-1.5 rounded-md text-sm font-semibold text-muted-foreground hover:text-primary">' +
        '<span aria-hidden="true">&larr;</span> Back to home' +
      "</a>" +
      '<a href="' + window.CivicUtils.url("index.html") + '" class="inline-block" tabindex="-1">' +
        '<img src="' + window.CivicUtils.url("assets/images/logo.png") + '" alt="CivicEvents – home" width="200" height="40" class="h-10 w-auto" />' +
      "</a>"
    );
  }

  function initPasswordToggles() {
    $("[data-toggle-password]").each(function () {
      var $btn = $(this);
      $btn.html(window.CivicUI.icon("eye", "h-5 w-5"));

      $btn.on("click", function () {
        var $input = $("#" + $btn.attr("data-toggle-password"));
        var showing = $input.attr("type") === "text";
        $input.attr("type", showing ? "password" : "text");
        $btn
          .attr("aria-pressed", String(!showing))
          .attr("aria-label", showing ? "Show password" : "Hide password")
          .html(window.CivicUI.icon(showing ? "eye" : "eyeOff", "h-5 w-5"));
      });
    });
  }

  return {
    isValidEmail: isValidEmail,
    initLogo: initLogo,
    initPasswordToggles: initPasswordToggles,
  };
})();
