/*
 * CivicNotifyStore – remembers which notifications the user has read.
 * ---------------------------------------------------------------
 * WHY THIS EXISTS: the provided backend has a `read` column in the
 * notifications table but NO endpoint to change it (there is no
 * PATCH /api/notifications/:id/read). So read/unread status can't be
 * saved on the server.
 *
 * WORKAROUND: we keep a list of read notification IDs in localStorage,
 * one list per user. It works on this browser only, and that limitation
 * is documented in the README.
 */
window.CivicNotifyStore = (function () {
  function key() {
    var user = window.CivicAuth.getUser();
    return user ? "civic_read_notifications_" + user.id : null;
  }

  function getReadIds() {
    var k = key();
    if (!k) return [];
    try {
      return JSON.parse(localStorage.getItem(k)) || [];
    } catch (e) {
      return [];
    }
  }

  function save(ids) {
    var k = key();
    if (k) localStorage.setItem(k, JSON.stringify(ids));
    $(document).trigger("civic:notifications-changed");
  }

  function isRead(notification) {
    return window.CivicUtils.toBool(notification.read) || getReadIds().indexOf(notification.id) !== -1;
  }

  function markRead(id) {
    var ids = getReadIds();
    if (ids.indexOf(id) === -1) ids.push(id);
    save(ids);
  }

  function markUnread(id) {
    save(getReadIds().filter(function (x) { return x !== id; }));
  }

  function markAllRead(notifications) {
    var ids = getReadIds();
    notifications.forEach(function (n) { if (ids.indexOf(n.id) === -1) ids.push(n.id); });
    save(ids);
  }

  function countUnread(notifications) {
    return notifications.filter(function (n) { return !isRead(n); }).length;
  }

  return {
    isRead: isRead,
    markRead: markRead,
    markUnread: markUnread,
    markAllRead: markAllRead,
    countUnread: countUnread,
  };
})();
