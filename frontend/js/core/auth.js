/*
 * CivicAuth – the "global auth context" required by the brief.
 * ---------------------------------------------------------------
 * WHAT: one place that remembers who is logged in: { id, full_name, email, role }
 *       and their token.
 *
 * WHY sessionStorage?
 *   - After login the backend gives us a JWT token (a signed "digital pass").
 *   - We must send it with every protected request, so we need to keep it
 *     somewhere between page loads.
 *   - sessionStorage is cleared when the browser tab is closed, which is the
 *     safer default (brief: "If session-only: use sessionStorage").
 *   - If the user ticks "Remember me" we use localStorage instead, which
 *     survives closing the browser. Trade-off: anyone using the same computer
 *     later could still be logged in, and any script on the page can read it.
 *
 * We NEVER store the password – only the token and basic user info.
 */
window.CivicAuth = (function () {
  var TOKEN_KEY = "civic_token";
  var USER_KEY = "civic_user";
  var FLASH_KEY = "civic_flash";

  /** Returns whichever storage currently holds the token. */
  function activeStorage() {
    if (localStorage.getItem(TOKEN_KEY)) return localStorage;
    return sessionStorage;
  }

  /**
   * decodeToken – reads the middle part of a JWT.
   * A JWT looks like  header.payload.signature  (each part base64url-encoded).
   * The payload contains { id, role, exp }. "exp" is the expiry time in seconds.
   * We only READ it to know when it expires; the server still verifies it.
   */
  function decodeToken(token) {
    try {
      var payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      while (payload.length % 4) payload += "=";
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  }

  function isExpired(token) {
    var payload = decodeToken(token);
    if (!payload || !payload.exp) return false; // can't tell → let the server decide
    return payload.exp * 1000 <= Date.now();
  }

  /** Called after a successful login. */
  function saveSession(token, user, remember) {
    clearSession();
    var store = remember ? localStorage : sessionStorage;
    store.setItem(TOKEN_KEY, token);
    store.setItem(
      USER_KEY,
      JSON.stringify({ id: user.id, full_name: user.full_name, email: user.email, role: user.role })
    );
  }

  /** Updates the saved user (e.g. after the profile name/email changes). */
  function updateUser(changes) {
    var store = activeStorage();
    var current = getUser() || {};
    var next = Object.assign({}, current, {
      full_name: changes.full_name !== undefined ? changes.full_name : current.full_name,
      email: changes.email !== undefined ? changes.email : current.email,
    });
    store.setItem(USER_KEY, JSON.stringify(next));
    $(document).trigger("civic:user-updated", [next]);
  }

  function clearSession() {
    [localStorage, sessionStorage].forEach(function (store) {
      store.removeItem(TOKEN_KEY);
      store.removeItem(USER_KEY);
    });
  }

  /**
   * getToken – returns the token, or null.
   * If the token has expired we sign the user out straight away
   * (brief: "Expired tokens should sign the user out and show message").
   */
  function getToken() {
    var token = activeStorage().getItem(TOKEN_KEY);
    if (!token) return null;
    if (isExpired(token)) {
      expireSession();
      return null;
    }
    return token;
  }

  function getUser() {
    try {
      return JSON.parse(activeStorage().getItem(USER_KEY));
    } catch (e) {
      return null;
    }
  }

  function isLoggedIn() {
    return !!getToken() && !!getUser();
  }

  /**
   * isAdmin – how the frontend knows someone is an admin.
   * The role comes from the login response (data.user.role) and is saved above.
   * IMPORTANT: this only changes what we SHOW. A user could edit sessionStorage
   * and fake "admin", but every admin API route is protected on the server by
   * authorize(['admin']) in backend/src/middlewares/auth.middleware.js,
   * so they would just get 403 Forbidden.
   */
  function isAdmin() {
    var user = getUser();
    return !!user && user.role === "admin";
  }

  /** Where each role lands after logging in. */
  function homeFor(user) {
    return user && user.role === "admin" ? "admin/dashboard.html" : "dashboard.html";
  }

  /* ---------- One-time "flash" messages that survive a redirect ---------- */
  function setFlash(type, message) {
    sessionStorage.setItem(FLASH_KEY, JSON.stringify({ type: type, message: message }));
  }
  function takeFlash() {
    var raw = sessionStorage.getItem(FLASH_KEY);
    sessionStorage.removeItem(FLASH_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /** Sends the user to the login page and remembers where they were. */
  function redirectToLogin() {
    var here = window.location.pathname.split("/frontend/").pop() + window.location.search;
    var target = window.CivicUtils.url("login.html");
    // Don't loop back to login/signup after logging in.
    if (!/login\.html|signup\.html/.test(here)) {
      target += "?next=" + encodeURIComponent(window.location.href);
    }
    window.location.href = target;
  }

  /** Token expired or rejected by the server (401). */
  function expireSession() {
    clearSession();
    setFlash("warning", "Your session has expired. Please sign in again.");
    redirectToLogin();
  }

  /** User clicked "Sign out". */
  function logout() {
    clearSession();
    setFlash("success", "You have been signed out.");
    window.location.href = window.CivicUtils.url("login.html");
  }

  return {
    saveSession: saveSession,
    updateUser: updateUser,
    clearSession: clearSession,
    getToken: getToken,
    getUser: getUser,
    isLoggedIn: isLoggedIn,
    isAdmin: isAdmin,
    homeFor: homeFor,
    setFlash: setFlash,
    takeFlash: takeFlash,
    redirectToLogin: redirectToLogin,
    expireSession: expireSession,
    logout: logout,
  };
})();
