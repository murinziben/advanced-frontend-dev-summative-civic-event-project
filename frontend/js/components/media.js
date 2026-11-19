/*
 * CivicMedia – accessible audio player + captions for videos.
 * ---------------------------------------------------------------
 * 1. audioPlayer(): a friendly player for announcements.
 *    - Uses the real HTML5 <audio> element underneath (with fallback text).
 *    - Big Play/Pause button, a seek slider, "current time / duration",
 *      mute button and volume slider – all reachable with the keyboard
 *      and labelled for screen readers.
 *
 * 2. attachCaptions(): the backend stores promo captions as plain text
 *    (`caption_text`), not as a captions FILE. The HTML5 <track> element
 *    needs a WebVTT file, so we BUILD one in the browser:
 *      - split the text into short lines,
 *      - spread them across the video's duration,
 *      - turn that into a WebVTT "file" in memory (a Blob URL),
 *      - add <track kind="captions" srclang="en" label="English" default>.
 *    Captions are switched on by default; viewers can turn them off with
 *    the CC button in the video controls.
 */
window.CivicMedia = (function () {
  var U = window.CivicUtils;
  var esc = U.escapeHtml;
  var icon = function (n, c) { return window.CivicUI.icon(n, c); };
  var playerCount = 0;

  var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="h-5 w-5"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z"/></svg>';
  var PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="h-5 w-5"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
  var VOLUME = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" class="h-5 w-5"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';
  var MUTED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" class="h-5 w-5"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m22 9-6 6M16 9l6 6"/></svg>';

  /**
   * audioPlayer($container, { src, title, compact, onDuration })
   * compact: smaller version for list cards (no volume slider).
   */
  function audioPlayer($container, o) {
    playerCount++;
    var id = "audio-" + playerCount;
    var $c = $($container);

    $c.html(
      '<div class="rounded-xl border border-border bg-muted/60 p-3" data-player>' +
        // The real audio element. preload="metadata" loads only the length, not the whole file.
        '<audio id="' + id + '" preload="metadata" src="' + esc(o.src) + '">' +
          'Your browser can\'t play this audio. <a href="' + esc(o.src) + '" download>Download the audio file</a>.' +
        "</audio>" +
        '<div class="flex items-center gap-3">' +
          '<button type="button" data-play class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90" aria-label="Play ' + esc(o.title) + '">' + PLAY + "</button>" +
          '<div class="flex min-w-0 flex-1 items-center gap-3">' +
            '<label for="' + id + '-seek" class="sr-only">Seek in ' + esc(o.title) + "</label>" +
            '<input id="' + id + '-seek" data-seek type="range" min="0" max="0" step="0.1" value="0" class="h-1.5 w-full cursor-pointer accent-primary" aria-valuetext="0:00" />' +
            '<span data-time class="shrink-0 font-mono text-xs tabular-nums text-muted-foreground" aria-hidden="true">0:00 / --:--</span>' +
          "</div>" +
          (o.compact ? "" :
            '<button type="button" data-mute class="hidden shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-foreground sm:block" aria-label="Mute" aria-pressed="false">' + VOLUME + "</button>" +
            '<label for="' + id + '-vol" class="sr-only">Volume</label>' +
            '<input id="' + id + '-vol" data-volume type="range" min="0" max="1" step="0.05" value="1" class="hidden h-1.5 w-20 cursor-pointer accent-primary sm:block" />') +
        "</div>" +
        '<p data-status class="sr-only" aria-live="polite"></p>' +
        '<p data-error class="mt-2 hidden text-xs text-destructive" role="alert"></p>' +
      "</div>"
    );

    var audio = $c.find("audio").get(0);
    var $play = $c.find("[data-play]");
    var $seek = $c.find("[data-seek]");
    var $time = $c.find("[data-time]");
    var $status = $c.find("[data-status]");
    var seeking = false;

    function updateTime() {
      var dur = isFinite(audio.duration) ? audio.duration : 0;
      $time.text(U.formatDuration(audio.currentTime) + " / " + (dur ? U.formatDuration(dur) : "--:--"));
      if (!seeking) $seek.val(audio.currentTime);
      $seek.attr("aria-valuetext", U.formatDuration(audio.currentTime) + " of " + U.formatDuration(dur));
    }

    $(audio).on("loadedmetadata", function () {
      $seek.attr("max", isFinite(audio.duration) ? audio.duration : 0);
      updateTime();
      if (o.onDuration && isFinite(audio.duration)) o.onDuration(audio.duration);
    });
    $(audio).on("timeupdate", updateTime);
    $(audio).on("play", function () {
      // Only one player plays at a time.
      $("audio").not(audio).each(function () { this.pause(); });
      $play.html(PAUSE).attr("aria-label", "Pause " + o.title);
      $status.text("Playing");
    });
    $(audio).on("pause ended", function () {
      $play.html(PLAY).attr("aria-label", "Play " + o.title);
      $status.text(audio.ended ? "Finished" : "Paused");
    });
    $(audio).on("error", function () {
      $play.prop("disabled", true).addClass("opacity-50");
      $c.find("[data-error]").removeClass("hidden")
        .html('This audio couldn\'t be loaded. <a class="underline" href="' + esc(o.src) + '" download>Try downloading it</a>.');
    });

    $play.on("click", function () {
      if (audio.paused) {
        audio.play().catch(function () { /* handled by the error event */ });
      } else {
        audio.pause();
      }
    });

    $seek.on("input", function () { seeking = true; $time.text(U.formatDuration(this.value) + " / " + U.formatDuration(audio.duration || 0)); });
    $seek.on("change", function () { audio.currentTime = Number(this.value); seeking = false; });

    $c.find("[data-mute]").on("click", function () {
      audio.muted = !audio.muted;
      $(this).html(audio.muted ? MUTED : VOLUME).attr("aria-pressed", String(audio.muted)).attr("aria-label", audio.muted ? "Unmute" : "Mute");
    });
    $c.find("[data-volume]").on("input", function () { audio.volume = Number(this.value); });

    return audio;
  }

  /* ---------------------------- Captions ---------------------------- */

  function vttTime(seconds) {
    var ms = Math.max(0, Math.round(seconds * 1000));
    var h = Math.floor(ms / 3600000);
    var m = Math.floor((ms % 3600000) / 60000);
    var s = Math.floor((ms % 60000) / 1000);
    var r = ms % 1000;
    var p = function (n, l) { return String(n).padStart(l || 2, "0"); };
    return p(h) + ":" + p(m) + ":" + p(s) + "." + p(r, 3);
  }

  /** Splits caption text into short lines (max ~12 words each). */
  function splitCaption(text) {
    var sentences = String(text).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/);
    var lines = [];
    sentences.forEach(function (sentence) {
      var words = sentence.split(" ");
      for (var i = 0; i < words.length; i += 12) lines.push(words.slice(i, i + 12).join(" "));
    });
    return lines.filter(Boolean);
  }

  /**
   * Builds a WebVTT document. Each line gets screen time in proportion to
   * its number of words, so the captions span the whole video.
   */
  function buildVtt(text, duration) {
    var lines = splitCaption(text);
    var totalWords = lines.reduce(function (n, l) { return n + l.split(" ").length; }, 0) || 1;
    var t = 0;
    var vtt = "WEBVTT\n\n";
    lines.forEach(function (line, i) {
      var share = (line.split(" ").length / totalWords) * duration;
      vtt += (i + 1) + "\n" + vttTime(t) + " --> " + vttTime(t + share) + "\n" + line.replace(/-->/g, "→") + "\n\n";
      t += share;
    });
    return vtt;
  }

  /** Adds an English captions track (switched on) to a <video>. */
  function attachCaptions(video, captionText) {
    if (!captionText || !String(captionText).trim()) return;

    function add() {
      // If the length is unknown, estimate ~2.5 words per second of speech.
      var words = String(captionText).split(/\s+/).length;
      var duration = isFinite(video.duration) && video.duration > 0 ? video.duration : Math.max(5, words / 2.5);
      var blob = new Blob([buildVtt(captionText, duration)], { type: "text/vtt" });

      $(video).find("track").remove();
      var track = document.createElement("track");
      track.kind = "captions";
      track.label = "English";
      track.srclang = "en";
      track.src = URL.createObjectURL(blob);
      track.default = true;
      video.appendChild(track);
      // Make sure captions are visible by default.
      track.addEventListener("load", function () { if (video.textTracks[0]) video.textTracks[0].mode = "showing"; });
      if (video.textTracks[0]) video.textTracks[0].mode = "showing";
    }

    if (video.readyState >= 1) add();
    else $(video).one("loadedmetadata", add);
  }

  return { audioPlayer: audioPlayer, attachCaptions: attachCaptions, buildVtt: buildVtt };
})();
