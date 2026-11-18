/*
 * CivicApp – starts every page in the same order.
 * ---------------------------------------------------------------
 * Each page script calls:
 *
 *     CivicApp.start(function () {
 *       // page-specific code (load events, bind forms…)
 *     });
 *
 * and CivicApp makes sure these steps always happen first:
 *   1. Run the page guard (CivicGuards.run) – may redirect away.
 *   2. Draw the shared header and footer (CivicLayout.init).
 *   3. Remove elements the user's role must not see (CivicGuards.applyVisibility).
 *   4. Show any message saved before a redirect (CivicUI.showFlash).
 *   5. Run the page's own code.
 */
window.CivicApp = (function () {
  function start(pageInit) {
    $(function () {
      // 1. Guard. If it redirects, stop here so no data is loaded.
      if (!window.CivicGuards.run()) return;

      // 2. Shared layout
      window.CivicLayout.init();

      // 3. Role-based element visibility
      window.CivicGuards.applyVisibility();

      // 4. Flash message (e.g. "Account created – please sign in")
      window.CivicUI.showFlash();

      // 5. The page itself
      if (typeof pageInit === "function") pageInit();
    });
  }

  return { start: start };
})();
