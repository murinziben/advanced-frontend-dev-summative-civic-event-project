CivicApp.start(function () {
  var U = CivicUtils;
  var esc = U.escapeHtml;
  CivicAdminLayout.init();

  var me = CivicAuth.getUser();
  var users = [];
  var page = 1;
  var PER_PAGE = 12;
  var $body = $("#users-body");

  function filtered() {
    var q = $("#search").val().trim().toLowerCase();
    var role = $("#role").val();
    var status = $("#status").val();
    return users.filter(function (u) {
      if (role && u.role !== role) return false;
      if (status === "active" && !U.toBool(u.is_active)) return false;
      if (status === "disabled" && U.toBool(u.is_active)) return false;
      return !q || (u.full_name + " " + u.email).toLowerCase().indexOf(q) !== -1;
    });
  }

  function roleBadge(role) {
    return role === "admin"
      ? '<span class="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">Admin</span>'
      : '<span class="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">User</span>';
  }

  // No role control anywhere on this page: the assessment forbids changing roles from the UI.
  function statusSwitch(u) {
    var active = U.toBool(u.is_active);
    // Admins can't disable themselves, so they can't lock themselves out.
    var self = u.id === me.id;
    return (
      '<button type="button" role="switch" aria-checked="' + active + '" data-toggle="' + esc(u.id) + '"' + (self ? ' disabled title="You can\'t disable your own account"' : "") +
        ' class="inline-flex items-center gap-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50" aria-label="Account active: ' + esc(u.full_name) + '">' +
        '<span class="relative inline-flex h-6 w-11 shrink-0 rounded-full transition ' + (active ? "bg-success" : "bg-input") + '">' +
          '<span class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ' + (active ? "left-[1.375rem]" : "left-0.5") + '"></span>' +
        "</span>" +
        '<span class="' + (active ? "text-success" : "text-muted-foreground") + '">' + (active ? "Active" : "Disabled") + "</span>" +
      "</button>"
    );
  }

  function render() {
    var list = filtered();
    $("#users-count").text(list.length + (list.length === 1 ? " user" : " users"));
    if (!list.length) {
      $body.html(CivicAdminLayout.tableMessage(5, CivicUI.emptyState("No users found", "Try another name, email or filter.")));
      $("#users-pagination").empty();
      return;
    }
    if (page > CivicPagination.totalPages(list.length, PER_PAGE)) page = 1;

    $body.html(
      CivicPagination.slice(list, page, PER_PAGE).map(function (u) {
        return (
          '<tr class="border-b border-border last:border-0 hover:bg-muted/40">' +
            '<td class="px-4 py-3"><div class="flex items-center gap-3">' +
              '<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary" aria-hidden="true">' + esc(U.initials(u.full_name)) + "</span>" +
              '<div class="min-w-0"><p class="font-semibold">' + esc(u.full_name) + (u.id === me.id ? ' <span class="text-xs font-normal text-muted-foreground">(you)</span>' : "") + "</p>" +
              '<p class="truncate text-xs text-muted-foreground">' + esc(u.email) + "</p></div>" +
            "</div></td>" +
            '<td class="px-4 py-3">' + roleBadge(u.role) + "</td>" +
            '<td class="px-4 py-3">' + statusSwitch(u) + "</td>" +
            '<td class="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">' + esc(U.formatDate(u.created_at)) + "</td>" +
            '<td class="px-4 py-3 text-right"><button type="button" data-view="' + esc(u.id) + '" class="rounded-lg border border-input px-2.5 py-1.5 text-xs font-semibold hover:bg-muted">View<span class="sr-only"> ' + esc(u.full_name) + "</span></button></td>" +
          "</tr>"
        );
      }).join("")
    );

    CivicPagination.render("#users-pagination", {
      page: page, totalItems: list.length, perPage: PER_PAGE,
      onChange: function (p) { page = p; render(); },
    });
  }

  function load() {
    $body.html(CivicAdminLayout.tableSkeleton(5, 6));
    CivicApi.get("/users?limit=1000")
      .then(function (res) {
        users = res.data || [];
        render();
      })
      .catch(function (err) {
        $body.html(CivicAdminLayout.tableMessage(5, CivicUI.errorState(err)));
        $body.find("[data-retry]").on("click", load);
      });
  }

  $body.on("click", "[data-view]", function () {
    var id = $(this).attr("data-view");
    var d = CivicUI.dialog({ title: "User details", html: '<div class="skeleton h-24 w-full"></div><span class="sr-only" role="status">Loading…</span>' });
    CivicApi.get("/users/" + encodeURIComponent(id))
      .then(function (body) {
        var u = body.data;
        var row = function (label, value) { return '<div class="grid grid-cols-3 gap-2 py-2"><dt class="text-sm text-muted-foreground">' + label + '</dt><dd class="col-span-2 text-sm font-medium">' + value + "</dd></div>"; };
        d.$body.html(
          '<div class="flex items-center gap-3"><span class="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground" aria-hidden="true">' + esc(U.initials(u.full_name)) + "</span>" +
          '<div><p class="font-bold">' + esc(u.full_name) + '</p><p class="text-sm text-muted-foreground">' + esc(u.email) + "</p></div></div>" +
          '<dl class="mt-4 divide-y divide-border border-y border-border">' +
            row("Role", roleBadge(u.role)) +
            row("Status", U.toBool(u.is_active) ? '<span class="text-success">Active</span>' : '<span class="text-destructive">Disabled</span>') +
            row("Joined", esc(U.formatDateTime(u.created_at))) +
            row("Last updated", esc(U.formatDateTime(u.updated_at))) +
            row("User ID", '<code class="break-all text-xs">' + esc(u.id) + "</code>") +
          "</dl>" +
          '<p class="mt-4 text-xs text-muted-foreground">Roles can\'t be changed from the dashboard. This is a city policy to protect accounts.</p>'
        );
      })
      .catch(function (err) { d.$body.html('<p class="text-sm text-destructive" role="alert">' + esc(err.message) + "</p>"); });
  });

  $body.on("click", "[data-toggle]", function () {
    var id = $(this).attr("data-toggle");
    var u = users.filter(function (x) { return x.id === id; })[0];
    if (!u || u.id === me.id) return;
    var enable = !U.toBool(u.is_active);

    var ask = enable
      ? Promise.resolve(true)
      : CivicUI.confirm({ title: "Disable " + u.full_name + "?", message: "Their account will be marked as disabled. You can enable it again at any time.", confirmText: "Disable account", danger: true });

    ask.then(function (ok) {
      if (!ok) return;
      u.is_active = enable;
      render();
      CivicApi.patch("/users/" + encodeURIComponent(id) + (enable ? "/enable" : "/disable"))
        .then(function () { CivicUI.toast("success", u.full_name + "'s account is now " + (enable ? "active." : "disabled.")); })
        .catch(function (err) {
          u.is_active = !enable;
          CivicUI.toast("error", "Couldn't update the account: " + err.message);
        })
        .finally(function () {
          render();
          $body.find('[data-toggle="' + id + '"]').trigger("focus");
        });
    });
  });

  $("#search").on("input", U.debounce(function () { page = 1; render(); }, 200));
  $("#role, #status").on("change", function () { page = 1; render(); });
  load();
});
