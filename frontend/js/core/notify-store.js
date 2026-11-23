window.CivicNotifyStore = (function () {
  // The backend has no endpoint to mark notifications as read, so read state is kept per user in this browser.
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
