/*
 * =====================================================================
 *  CivicGuards – ROLE-BASED ACCESS GUARDS (frontend)
 * =====================================================================
 *  The assessment asks us to clearly document where role-based guards
 *  live. They live HERE, in two layers:
 *
 *  LAYER 1 – PAGE GUARDS (who may open a page)
 *    Every HTML page declares its rule on the <body> tag:
 *        <body data-guard="public">  anyone (home, events list…)
 *        <body data-guard="guest">   only logged-out visitors (login, signup)
 *        <body data-guard="auth">    any logged-in user (profile, my registrations)
 *        <body data-guard="admin">   admins only (everything in /admin/)
 *    CivicGuards.run() reads that attribute as soon as the page loads:
 *      - not logged in on an "auth"/"admin" page → sent to login.html
 *      - logged in as role "user" on an "admin" page → sent to forbidden.html
 *      - already logged in on a "guest" page → sent to their dashboard
 *
 *  LAYER 2 – ELEMENT GUARDS (which buttons/links appear)
 *    Any element can carry data-show-for:
 *        data-show-for="admin"  → removed unless role === "admin"
 *        data-show-for="user"   → removed unless role === "user"
 *        data-show-for="auth"   → removed unless logged in
 *        data-show-for="guest"  → removed when logged in
 *    CivicGuards.applyVisibility() removes them from the page (not just
 *    hides them), so keyboard and screen-reader users never reach them.
 *    Page scripts that build HTML with JavaScript also check
 *    CivicAuth.isAdmin() before adding Edit/Delete buttons.
 *
 *  HOW DOES THE FRONTEND KNOW SOMEONE IS AN ADMIN?
 *    The login response contains user.role ("admin" or "user").
 *    CivicAuth saves it, and CivicAuth.isAdmin() checks it.
 *
 *  IMPORTANT: these guards only improve the user experience.
 *  Real security is on the server: backend/src/middlewares/auth.middleware.js
 *  (authenticate + authorize(['admin'])) rejects anyone without a valid
 *  token or the right role, with 401 or 403.
 * =====================================================================
 */
window.CivicGuards = (function () {
  function currentRule() {
    return (document.body && document.body.getAttribute("data-guard")) || "public";
  }

  /**
   * LAYER 1 – page guard. Returns true when the page may render.
   * Call it before the page script loads any data.
   */
  function run() {
    var rule = currentRule();
    var loggedIn = window.CivicAuth.isLoggedIn();
    var user = window.CivicAuth.getUser();

    if (rule === "guest" && loggedIn) {
      // Already signed in → no need to see login/signup.
      window.location.replace(window.CivicUtils.url(window.CivicAuth.homeFor(user)));
      return false;
    }

    if ((rule === "auth" || rule === "admin") && !loggedIn) {
      // Protected page but nobody is signed in.
      window.CivicAuth.setFlash("info", "Please sign in to continue.");
      window.CivicAuth.redirectToLogin();
      return false;
    }

    if (rule === "admin" && !window.CivicAuth.isAdmin()) {
      // ADMIN GUARD: a normal user tried to open an admin page.
      window.location.replace(window.CivicUtils.url("forbidden.html"));
      return false;
    }

    return true;
  }

  /** LAYER 2 – element guard. Removes elements the current user must not see. */
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
