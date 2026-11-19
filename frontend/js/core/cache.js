/*
 * CivicCache – a tiny short-lived cache for lists (brief §13:
 * "Cache lists where appropriate (e.g. promos) and invalidate on create/update").
 * ---------------------------------------------------------------
 * WHY: lists like promos and announcements don't change often. Keeping the
 * last response for a couple of minutes makes going back and forth between
 * pages instant and saves requests to the server.
 *
 * HOW: the response is saved in sessionStorage with a time stamp. If it is
 * older than the "time to live" (TTL) we fetch again. When an admin creates,
 * edits, publishes or deletes something, the admin page calls
 * CivicCache.invalidate("promos") so everyone sees fresh data next time.
 */
window.CivicCache = (function () {
  var PREFIX = "civic_cache_";
  var DEFAULT_TTL_MS = 2 * 60 * 1000; // 2 minutes

  function get(key) {
    try {
      var entry = JSON.parse(sessionStorage.getItem(PREFIX + key));
      if (!entry || Date.now() - entry.savedAt > (entry.ttl || DEFAULT_TTL_MS)) return null;
      return entry.value;
    } catch (e) {
      return null;
    }
  }

  function set(key, value, ttl) {
    try {
      sessionStorage.setItem(PREFIX + key, JSON.stringify({ savedAt: Date.now(), ttl: ttl || DEFAULT_TTL_MS, value: value }));
    } catch (e) {
      /* storage full or disabled – caching is optional, so ignore */
    }
  }

  /** Removes every cached entry whose key starts with `prefix`. */
  function invalidate(prefix) {
    Object.keys(sessionStorage).forEach(function (k) {
      if (k.indexOf(PREFIX + prefix) === 0) sessionStorage.removeItem(k);
    });
  }

  /**
   * cachedGet("promos", "/promos?limit=100") – returns cached data when fresh,
   * otherwise calls the API and caches the answer.
   */
  function cachedGet(key, path) {
    var hit = get(key);
    if (hit) return Promise.resolve(hit);
    return window.CivicApi.get(path).then(function (body) {
      set(key, body);
      return body;
    });
  }

  return { get: get, set: set, invalidate: invalidate, cachedGet: cachedGet };
})();
