window.CivicApp = (function () {
  function start(pageInit) {
    $(function () {
      // The guard runs before anything else so protected data is never requested or briefly shown.
      if (!window.CivicGuards.run()) return;

      window.CivicLayout.init();

      window.CivicGuards.applyVisibility();

      window.CivicUI.showFlash();

      if (typeof pageInit === "function") pageInit();
    });
  }

  return { start: start };
})();
