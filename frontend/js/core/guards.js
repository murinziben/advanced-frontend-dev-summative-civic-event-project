/*
 * ROLE-BASED ACCESS GUARDS (UI only – the backend's authenticate + authorize(['admin']) is the real protection).
 * Page guard:    <body data-guard="public | guest | auth | admin">
 * Element guard: data-show-for="admin | user | auth | guest"
 */
window.CivicGuards = (function () {
  function currentRule() {
    return (document.body && document.body.getAttribute("data-guard")) || "public";
  }

  function run() {
    var rule = currentRule();
    var loggedIn = window.CivicAuth.isLoggedIn();
    var user = window.CivicAuth.getUser();

    if (rule === "guest" && loggedIn) {
      window.location.replace(window.CivicUtils.url(window.CivicAuth.homeFor(user)));
      return false;
    }

    if ((rule === "auth" || rule === "admin") && !loggedIn) {
      window.CivicAuth.setFlash("info", "Please sign in to continue.");
      window.CivicAuth.redirectToLogin();
      return false;
    }

    // ADMIN GUARD: normal users are sent away so they never see controls that would only fail with 403.
    if (rule === "admin" && !window.CivicAuth.isAdmin()) {
      window.location.replace(window.CivicUtils.url("forbidden.html"));
      return false;
    }

    return true;
  }

  // Elements are removed, not hidden, so they're also out of the keyboard and screen-reader order.
  function applyVisibility(root) {
    var $root = $(root || document);
    var loggedIn = window.CivicAuth.isLoggedIn();
    var role = loggedIn ? window.CivicAuth.getUser().role : null;

    $root.find("[data-show-for]").each(function () {
      var rule = this.getAttribute("data-show-for");
      var allowed =
        (rule === "admin" && role === "admin") ||
        (rule === "user" && role === "user") ||
        (rule === "auth" && loggedIn) ||
        (rule === "guest" && !loggedIn);
      if (!allowed) $(this).remove();
    });
  }

  return { run: run, applyVisibility: applyVisibility };
})();
