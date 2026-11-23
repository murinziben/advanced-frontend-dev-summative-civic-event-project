window.CivicCache = (function () {
  var PREFIX = "civic_cache_";
  // Lists like promos rarely change, so a short cache avoids refetching on every visit; admin changes call invalidate() so nobody sees stale data.
  var DEFAULT_TTL_MS = 2 * 60 * 1000;

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
    }
  }

  function invalidate(prefix) {
    Object.keys(sessionStorage).forEach(function (k) {
      if (k.indexOf(PREFIX + prefix) === 0) sessionStorage.removeItem(k);
    });
  }

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
