window.CivicSlideshow = (function () {
  var esc = function (v) { return window.CivicUtils.escapeHtml(v); };
  var INTERVAL_MS = 4000;

  // Local photos are stored relative to the frontend root, and admin pages live one folder deeper.
  function srcOf(slide) {
    return /^https?:/.test(slide.src) ? slide.src : window.CivicUtils.url(slide.src);
  }

  var PAUSE_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="h-3.5 w-3.5"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  var PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="h-3.5 w-3.5"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z"/></svg>';

  /**
   * CivicSlideshow.init(container, slides, options)
   *   options.overlay  HTML drawn above the photos (gradient) so text stays readable
   *   options.controls CSS classes positioning the caption/dots/pause bar
   *   options.dark     true when the controls sit on a dark photo
   */
  function init(container, slides, options) {
    var o = Object.assign({ overlay: "", controls: "bottom-4 right-4", dark: true, label: "Photos of Rwanda" }, options);
    var $root = $(container);
    if (!$root.length || !slides || !slides.length) return;

    var current = 0;
    var timer = null;
    // Respect the user's "reduce motion" setting: start paused instead of animating.
    var userPaused = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var hovering = false;

    var layers = slides.map(function (s, i) {
      return (
        '<div data-slide="' + i + '" role="img" aria-label="' + esc(s.caption) + '"' + (i === 0 ? "" : ' aria-hidden="true"') +
        ' class="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ' + (i === 0 ? "opacity-100" : "opacity-0") + '"' +
        (i === 0 ? ' style="background-image:url(\'' + srcOf(s) + '\')"' : "") +
        "></div>"
      );
    }).join("");

    var bar = o.dark ? "bg-black/35 text-white ring-1 ring-white/15" : "bg-white/85 text-foreground ring-1 ring-border";
    var dotOn = o.dark ? "w-5 bg-white" : "w-5 bg-primary";
    var dotOff = o.dark ? "w-2 bg-white/45" : "w-2 bg-primary/30";
    var hoverBtn = o.dark ? "hover:bg-white/20" : "hover:bg-primary-soft";
    var dots = slides.map(function (s, i) {
      return '<button type="button" data-go="' + i + '" class="h-2 rounded-full transition-all ' + (i === 0 ? dotOn : dotOff) + '"' +
        ' aria-label="Show photo ' + (i + 1) + ": " + esc(s.caption) + '"' + (i === 0 ? ' aria-current="true"' : "") + "></button>";
    }).join("");

    $root.addClass("overflow-hidden").attr({ role: "region", "aria-roledescription": "carousel", "aria-label": o.label }).html(
      layers + o.overlay +
      '<div class="absolute z-20 flex max-w-[calc(100%-2rem)] items-center gap-3 rounded-full px-3 py-1.5 text-xs backdrop-blur ' + bar + " " + o.controls + '">' +
        '<span data-caption class="hidden truncate font-medium sm:inline">' + esc(slides[0].caption) + "</span>" +
        '<span class="flex items-center gap-1.5">' + dots + "</span>" +
        '<button type="button" data-toggle class="flex h-6 w-6 items-center justify-center rounded-full ' + hoverBtn + '" aria-label="Pause slideshow">' + PAUSE_ICON + "</button>" +
      "</div>"
    );

    var $slides = $root.find("[data-slide]");

    // Load each photo only when it's about to be shown, so the page doesn't download every image up front.
    function ensureLoaded(i) {
      var $s = $slides.eq(i);
      if (!$s.attr("style")) $s.css("background-image", "url('" + srcOf(slides[i]) + "')");
    }

    function show(i) {
      current = (i + slides.length) % slides.length;
      ensureLoaded(current);
      ensureLoaded((current + 1) % slides.length);
      $slides.each(function (k) {
        var active = k === current;
        $(this).toggleClass("opacity-100", active).toggleClass("opacity-0", !active).attr("aria-hidden", active ? null : "true");
      });
      $root.find("[data-go]").each(function (k) {
        var active = k === current;
        $(this).removeClass(dotOn + " " + dotOff).addClass(active ? dotOn : dotOff).attr("aria-current", active ? "true" : null);
      });
      $root.find("[data-caption]").text(slides[current].caption);
    }

    function schedule() {
      clearInterval(timer);
      if (!userPaused && !hovering && !document.hidden && slides.length > 1) {
        timer = setInterval(function () { show(current + 1); }, INTERVAL_MS);
      }
    }

    function setPaused(paused) {
      userPaused = paused;
      $root.find("[data-toggle]").html(paused ? PLAY_ICON : PAUSE_ICON).attr("aria-label", paused ? "Play slideshow" : "Pause slideshow");
      schedule();
    }

    $root.on("click", "[data-go]", function () {
      show(Number($(this).attr("data-go")));
      schedule();
    });
    $root.on("click", "[data-toggle]", function () { setPaused(!userPaused); });
    // Auto-advance stops while the user is looking at or keyboard-navigating the slideshow (WCAG 2.2.2).
    $root.on("mouseenter focusin", function () { hovering = true; schedule(); });
    $root.on("mouseleave focusout", function (e) {
      if (e.type === "focusout" && $root.has(e.relatedTarget).length) return;
      hovering = false;
      schedule();
    });
    $(document).on("visibilitychange", schedule);

    setPaused(userPaused);
    ensureLoaded(1 % slides.length);
  }

  return { init: init };
})();
