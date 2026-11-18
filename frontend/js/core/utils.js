/*
 * CivicUtils – small helper functions used everywhere.
 * ---------------------------------------------------------------
 * Nothing here talks to the server. These are pure helpers for
 * formatting dates, escaping text, building links, etc.
 */
window.CivicUtils = (function () {
  /**
   * escapeHtml – makes text safe to put inside HTML.
   * WHY: data from the API (titles, comments) could contain "<script>".
   * If we inserted it directly we would create an XSS security hole.
   */
  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * url – builds a link that works from any folder.
   * Pages in /admin/ set <body data-root="../">, pages at the top level
   * set <body data-root="./">. So url("events.html") always points to
   * frontend/events.html.
   */
  function url(path) {
    var root = document.body ? document.body.getAttribute("data-root") || "./" : "./";
    return root + path.replace(/^\//, "");
  }

  /** Reads ?name=value from the current address bar. */
  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function toDate(value) {
    if (!value) return null;
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  /** "Sat, 5 Dec 2026" – same style as the design. */
  function formatDate(value) {
    var d = toDate(value);
    if (!d) return "Date to be confirmed";
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }

  /** "16:00" */
  function formatTime(value) {
    var d = toDate(value);
    if (!d) return "";
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  /** "16:00 – 21:00" */
  function formatTimeRange(start, end) {
    var s = formatTime(start);
    var e = formatTime(end);
    if (s && e) return s + " – " + e;
    return s || e || "Time to be confirmed";
  }

  /** "Sat, 5 Dec 2026 · 16:00" */
  function formatDateTime(value) {
    var d = toDate(value);
    if (!d) return "";
    return formatDate(d) + " · " + formatTime(d);
  }

  /** "3 hours ago", "2 days ago" – used for notifications. */
  function timeAgo(value) {
    var d = toDate(value);
    if (!d) return "";
    var seconds = Math.round((Date.now() - d.getTime()) / 1000);
    var units = [
      ["year", 31536000],
      ["month", 2592000],
      ["week", 604800],
      ["day", 86400],
      ["hour", 3600],
      ["minute", 60],
    ];
    for (var i = 0; i < units.length; i++) {
      var amount = Math.floor(Math.abs(seconds) / units[i][1]);
      if (amount >= 1) {
        var rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
        return rtf.format(seconds > 0 ? -amount : amount, units[i][0]);
      }
    }
    return "just now";
  }

  /** 102 seconds → "1:42" (audio/video length). */
  function formatDuration(totalSeconds) {
    if (!isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
    var s = Math.floor(totalSeconds);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = String(s % 60).padStart(2, "0");
    return h > 0 ? h + ":" + String(m).padStart(2, "0") + ":" + sec : m + ":" + sec;
  }

  /** "Jane Doe" → "JD" (avatar letters). */
  function initials(name) {
    if (!name) return "?";
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(function (part) { return part.charAt(0).toUpperCase(); })
      .join("");
  }

  /** Waits until the user stops typing before running fn (used by search boxes). */
  function debounce(fn, wait) {
    var timer;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait || 300);
    };
  }

  /** Backend sometimes returns booleans as strings ("true"). This normalises them. */
  function toBool(value) {
    return value === true || value === "true" || value === 1 || value === "1";
  }

  /** 2097152 → "2 MB" */
  function formatBytes(bytes) {
    if (!bytes) return "0 B";
    var units = ["B", "KB", "MB", "GB"];
    var i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1).replace(/\.0$/, "") + " " + units[i];
  }

  /**
   * validateFile – checks type and size BEFORE uploading.
   * kind is "image", "audio" or "video" (rules come from CivicConfig.UPLOADS).
   * Returns an error message, or "" when the file is fine.
   */
  function validateFile(file, kind) {
    var rules = window.CivicConfig.UPLOADS[kind];
    if (!file || !rules) return "";
    var name = file.name.toLowerCase();
    var ext = name.slice(name.lastIndexOf("."));
    if (rules.extensions.indexOf(ext) === -1) {
      return "This file type isn't allowed. Use " + rules.label + ".";
    }
    if (file.size > rules.maxBytes) {
      return "This file is " + formatBytes(file.size) + ". The maximum is " + formatBytes(rules.maxBytes) + ".";
    }
    return "";
  }

  /** Converts a <input type="datetime-local"> value to an ISO string the API accepts. */
  function localInputToIso(value) {
    var d = toDate(value);
    return d ? d.toISOString() : "";
  }

  /** Converts an ISO date from the API into the format a datetime-local input needs. */
  function isoToLocalInput(value) {
    var d = toDate(value);
    if (!d) return "";
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  return {
    escapeHtml: escapeHtml,
    url: url,
    getQueryParam: getQueryParam,
    formatDate: formatDate,
    formatTime: formatTime,
    formatTimeRange: formatTimeRange,
    formatDateTime: formatDateTime,
    timeAgo: timeAgo,
    formatDuration: formatDuration,
    initials: initials,
    debounce: debounce,
    toBool: toBool,
    formatBytes: formatBytes,
    validateFile: validateFile,
    localInputToIso: localInputToIso,
    isoToLocalInput: isoToLocalInput,
  };
})();
