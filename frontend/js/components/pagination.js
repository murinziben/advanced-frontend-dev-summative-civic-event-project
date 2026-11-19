/*
 * CivicPagination – page numbers under a list.
 * ---------------------------------------------------------------
 * The events API returns ALL events at once (no server paging), so we
 * split the list into pages in the browser.
 *
 *   var page = CivicPagination.slice(items, currentPage, perPage);
 *   CivicPagination.render($container, { page, totalItems, perPage, onChange });
 */
window.CivicPagination = (function () {
  function totalPages(totalItems, perPage) {
    return Math.max(1, Math.ceil(totalItems / perPage));
  }

  function slice(items, page, perPage) {
    var start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
  }

  function render($container, o) {
    var pages = totalPages(o.totalItems, o.perPage);
    $container = $($container);
    if (pages <= 1) {
      $container.empty();
      return;
    }

    var btn = function (label, page, opts) {
      opts = opts || {};
      var current = opts.current;
      return (
        '<button type="button" data-page="' + page + '"' +
          (opts.disabled ? " disabled" : "") +
          (current ? ' aria-current="page"' : "") +
          (opts.aria ? ' aria-label="' + opts.aria + '"' : ' aria-label="Page ' + page + '"') +
          ' class="min-w-[2.5rem] rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ' +
          (current ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted") + '">' +
          label + "</button>"
      );
    };

    // Show first, last, current ±1, with "…" gaps.
    var numbers = [];
    for (var p = 1; p <= pages; p++) {
      if (p === 1 || p === pages || Math.abs(p - o.page) <= 1) numbers.push(p);
      else if (numbers[numbers.length - 1] !== "…") numbers.push("…");
    }

    var html =
      '<nav aria-label="Pagination" class="flex flex-wrap items-center justify-center gap-1.5">' +
        btn("‹ Prev", o.page - 1, { disabled: o.page === 1, aria: "Previous page" }) +
        numbers.map(function (n) {
          return n === "…" ? '<span class="px-2 text-muted-foreground" aria-hidden="true">…</span>' : btn(n, n, { current: n === o.page });
        }).join("") +
        btn("Next ›", o.page + 1, { disabled: o.page === pages, aria: "Next page" }) +
      "</nav>" +
      '<p class="mt-2 text-center text-xs text-muted-foreground">Page ' + o.page + " of " + pages + "</p>";

    $container.html(html);
    $container.find("button[data-page]").on("click", function () {
      var target = Number($(this).attr("data-page"));
      if (target >= 1 && target <= pages && target !== o.page) o.onChange(target);
    });
  }

  return { slice: slice, render: render, totalPages: totalPages };
})();
