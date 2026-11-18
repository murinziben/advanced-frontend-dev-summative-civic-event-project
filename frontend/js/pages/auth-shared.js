/*
 * Helpers shared by login.html and signup.html.
 * ---------------------------------------------------------------
 *  - draws the logo
 *  - "show / hide password" eye buttons
 *  - a simple email format check
 */
window.CivicAuthPages = (function () {
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function isValidEmail(value) {
    return EMAIL_PATTERN.test(String(value).trim());
  }

  function initLogo() {
    $("#auth-logo").html(window.CivicLayout.logoHtml());
  }

  /** Any button with data-toggle-password="inputId" becomes an eye toggle. */
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
