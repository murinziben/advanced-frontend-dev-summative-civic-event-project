CivicApp.start(function () {
  var U = CivicUtils;
  var esc = U.escapeHtml;
  CivicAdminLayout.init();

  var resource = document.body.getAttribute("data-resource");
  var CONFIG = {
    announcements: { singular: "announcement", detail: "../announcement.html?id=", form: "announcement-form.html?id=" },
    promos: { singular: "promo", detail: "../promo.html?id=", form: "promo-form.html?id=" },
  }[resource];

  var items = [];
  var $body = $("#content-body");
  var page = 1;
  var PER_PAGE = 10;

  function render() {
    var q = $("#search").val().trim().toLowerCase();
    var status = $("#status").val();
    var list = items.filter(function (it) {
      var pub = U.toBool(it.published);
      if (status === "published" && !pub) return false;
      if (status === "unpublished" && pub) return false;
      return !q || [it.title, it.description].join(" ").toLowerCase().indexOf(q) !== -1;
    });
    $("#content-count").text(list.length + " " + CONFIG.singular + (list.length === 1 ? "" : "s"));

    if (!list.length) {
      $body.html(CivicAdminLayout.tableMessage(4, CivicUI.emptyState(
        items.length ? "Nothing matches your filters" : "No " + resource + " yet",
        items.length ? "Try another search or status." : "Create the first " + CONFIG.singular + ".",
        items.length ? "" : '<a href="' + CONFIG.form.replace("?id=", "") + '" class="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Create ' + CONFIG.singular + "</a>"
      )));
      $("#content-pagination").empty();
      return;
    }

    if (page > CivicPagination.totalPages(list.length, PER_PAGE)) page = 1;
    CivicPagination.render("#content-pagination", {
      page: page, totalItems: list.length, perPage: PER_PAGE,
      onChange: function (p) { page = p; render(); },
    });

    $body.html(
      CivicPagination.slice(list, page, PER_PAGE).map(function (it) {
        var pub = U.toBool(it.published);
        var extra = resource === "promos"
          ? '<p class="text-xs text-muted-foreground">' + (it.caption_text ? "Captions ✓" : "No captions") + "</p>"
          : '<p class="text-xs text-muted-foreground">Audio announcement</p>';
        return (
          '<tr class="border-b border-border last:border-0 hover:bg-muted/40" data-row="' + esc(it.id) + '">' +
            '<td class="px-4 py-3"><a href="' + CONFIG.detail + encodeURIComponent(it.id) + '" class="font-semibold hover:text-primary">' + esc(it.title) + "</a>" + extra + "</td>" +
            '<td class="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">' + esc(U.formatDate(it.created_at)) + "</td>" +
            '<td class="px-4 py-3">' +
              '<button type="button" role="switch" aria-checked="' + pub + '" data-toggle="' + esc(it.id) + '" ' +
                'class="group inline-flex items-center gap-2 text-sm font-semibold" aria-label="Published: ' + esc(it.title) + '">' +
                '<span class="relative inline-flex h-6 w-11 shrink-0 rounded-full transition ' + (pub ? "bg-primary" : "bg-input") + '">' +
                  '<span class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ' + (pub ? "left-[1.375rem]" : "left-0.5") + '"></span>' +
                "</span>" +
                '<span data-toggle-label>' + (pub ? "Published" : "Unpublished") + "</span>" +
              "</button>" +
            "</td>" +
            '<td class="px-4 py-3"><div class="flex justify-end gap-1.5">' +
              '<a href="' + CONFIG.form + encodeURIComponent(it.id) + '" class="rounded-lg border border-input px-2.5 py-1.5 text-xs font-semibold hover:bg-muted">Edit<span class="sr-only"> ' + esc(it.title) + "</span></a>" +
              '<button type="button" data-delete="' + esc(it.id) + '" class="rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive-soft">Delete<span class="sr-only"> ' + esc(it.title) + "</span></button>" +
            "</div></td>" +
          "</tr>"
        );
      }).join("")
    );
  }

  function load() {
    $body.html(CivicAdminLayout.tableSkeleton(4, 4));

    CivicApi.get("/" + resource + "?limit=100")
      .then(function (res) {
        items = res.data || [];
        render();
      })
      .catch(function (err) {
        $body.html(CivicAdminLayout.tableMessage(4, CivicUI.errorState(err)));
        $body.find("[data-retry]").on("click", load);
      });
  }

  function find(id) { return items.filter(function (x) { return x.id === id; })[0]; }

  $body.on("click", "[data-toggle]", function () {
    var $btn = $(this);
    var id = $btn.attr("data-toggle");
    var item = find(id);
    var publish = !U.toBool(item.published);

    // Optimistic update: flip at once, revert below if the server refuses.
    item.published = publish;
    render();
    $body.find('[data-toggle="' + id + '"]').prop("disabled", true).trigger("focus");

    CivicApi.patch("/" + resource + "/" + encodeURIComponent(id) + (publish ? "/publish" : "/unpublish"))
      .then(function () {
        CivicCache.invalidate(resource);
        CivicUI.toast("success", "“" + item.title + "” " + (publish ? "is now published. Residents were notified." : "is now hidden from residents."));
      })
      .catch(function (err) {
        item.published = !publish;
        CivicUI.toast("error", "Couldn't change the status: " + err.message);
      })
      .finally(function () {
        render();
        $body.find('[data-toggle="' + id + '"]').trigger("focus");
      });
  });

  $body.on("click", "[data-delete]", function () {
    var id = $(this).attr("data-delete");
    var item = find(id);
    CivicUI.confirm({
      title: "Delete this " + CONFIG.singular + "?",
      message: "“" + item.title + "” will be permanently removed. This can't be undone.",
      confirmText: "Delete",
      danger: true,
    }).then(function (ok) {
      if (!ok) return;
      // Removed straight away and restored if the delete fails.
      var backup = items.slice();
      items = items.filter(function (x) { return x.id !== id; });
      render();
      CivicApi.del("/" + resource + "/" + encodeURIComponent(id))
        .then(function () {
          CivicCache.invalidate(resource);
          CivicUI.toast("success", "“" + item.title + "” was deleted.");
        })
        .catch(function (err) {
          items = backup;
          render();
          CivicUI.toast("error", "Couldn't delete: " + err.message);
        });
    });
  });

  $("#search").on("input", U.debounce(function () { page = 1; render(); }, 200));
  $("#status").on("change", function () { page = 1; render(); });
  load();
});
