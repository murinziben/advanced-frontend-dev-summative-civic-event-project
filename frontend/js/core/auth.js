window.CivicAuth = (function () {
  var TOKEN_KEY = "civic_token";
  var USER_KEY = "civic_user";
  var FLASH_KEY = "civic_flash";

  function activeStorage() {
    if (localStorage.getItem(TOKEN_KEY)) return localStorage;
    return sessionStorage;
  }

  // Reading exp lets us sign out before the server rejects the token; the server still verifies the signature.
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
    if (!payload || !payload.exp) return false;
    return payload.exp * 1000 <= Date.now();
  }

  // sessionStorage by default so the session ends with the tab; localStorage only when the user opts in with "Remember me". The password is never stored.
  function saveSession(token, user, remember) {
    clearSession();
    var store = remember ? localStorage : sessionStorage;
    store.setItem(TOKEN_KEY, token);
    store.setItem(
      USER_KEY,
      JSON.stringify({ id: user.id, full_name: user.full_name, email: user.email, role: user.role })
    );
  }

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

  // ROLE GUARD (UI only): the role comes from the login response. A user editing storage gains nothing, because the backend checks every admin route with authorize(['admin']).
  function isAdmin() {
    var user = getUser();
    return !!user && user.role === "admin";
  }

  function homeFor(user) {
    return user && user.role === "admin" ? "admin/dashboard.html" : "dashboard.html";
  }

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

  function redirectToLogin() {
    var here = window.location.pathname.split("/frontend/").pop() + window.location.search;
    var target = window.CivicUtils.url("login.html");

    // Remember the page so the user returns to it after signing in, but never loop back to login/signup.
    if (!/login\.html|signup\.html/.test(here)) {
      target += "?next=" + encodeURIComponent(window.location.href);
    }
    window.location.href = target;
  }

  function expireSession() {
    clearSession();
    setFlash("warning", "Your session has expired. Please sign in again.");
    redirectToLogin();
  }

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
