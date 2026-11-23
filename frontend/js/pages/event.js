CivicApp.start(function () {
  var U = CivicUtils;
  var esc = U.escapeHtml;
  var icon = CivicUI.icon;
  var isAdmin = CivicAuth.isAdmin();
  var eventId = U.getQueryParam("id");

  var event = null;
  var registration = null;
  var myFeedback = null;

  var $root = $("#event-root");

  if (!eventId) return showNotFound();

  function load() {
    $root.html(skeleton());

    var requests = [CivicApi.get("/events/" + encodeURIComponent(eventId))];
    if (!isAdmin) {
      requests.push(CivicApi.get("/event-registrations/my-registrations").catch(function () { return { data: [] }; }));
      requests.push(CivicApi.get("/event-feedback/my-feedback").catch(function () { return { data: [] }; }));
    }

    Promise.all(requests)
      .then(function (res) {
        event = res[0].data;

        // ROLE GUARD: unpublished events are hidden from residents.
        if (!event || (!isAdmin && !U.toBool(event.published))) return showNotFound();

        if (!isAdmin) {
          registration = (res[1].data || []).filter(function (r) { return r.event_id === event.id; })[0] || null;
          myFeedback = (res[2].data || []).filter(function (f) { return f.event_id === event.id; })[0] || null;
        }

        document.title = event.title + " · CivicEvents";
        renderEvent();
        if (isAdmin) {
          loadAttendees();
          loadAllFeedback();
        } else {
          renderUserFeedback();
        }
      })
      .catch(function (err) {
        // PostgreSQL rejects a malformed id with 500, which for the user is simply "not found".
        if (err.status === 404 || (err.status === 500 && /uuid/i.test(err.message))) return showNotFound();
        $root.html('<div class="grid">' + CivicUI.errorState(err) + "</div>");
        $root.find("[data-retry]").on("click", load);
      });
  }

  function skeleton() {
    return (
      '<div class="grid gap-8 lg:grid-cols-[1fr_22rem]" aria-hidden="true">' +
        '<div><div class="skeleton h-72 rounded-xl sm:h-96"></div><div class="skeleton mt-6 h-8 w-2/3"></div><div class="skeleton mt-4 h-4 w-full"></div><div class="skeleton mt-2 h-4 w-5/6"></div></div>' +
        '<div class="skeleton h-80 rounded-xl"></div>' +
      '</div><span class="sr-only" role="status">Loading event…</span>'
    );
  }

  function showNotFound() {
    $root.html(
      '<div class="grid">' +
        CivicUI.emptyState(
          "Event not found",
          "This event doesn't exist, was removed, or isn't published yet.",
          '<a href="events.html" class="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Browse all events</a>'
        ) +
      "</div>"
    );
  }

  function renderEvent() {
    var img = CivicCards.eventImage(event);
    var timing = CivicCards.eventTiming(event);
    var mapUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(event.location || "");

    var media = img
      ? '<img src="' + esc(img) + '" alt="' + esc(event.title) + '" class="h-72 w-full rounded-xl object-cover shadow-card sm:h-96" />'
      : CivicCards.imageFallback("h-72 w-full rounded-xl sm:h-96");

    var info = function (iconName, label, value) {
      return (
        '<div class="flex gap-3">' +
          '<span class="mt-0.5 text-primary">' + icon(iconName, "h-5 w-5") + "</span>" +
          '<div><dt class="text-sm font-semibold">' + label + '</dt><dd class="text-sm text-muted-foreground">' + value + "</dd></div>" +
        "</div>"
      );
    };

    $root.html(
      '<div class="grid gap-8 lg:grid-cols-[1fr_22rem]">' +
        '<article aria-labelledby="event-title">' +
          media +
          '<div class="mt-6 flex flex-wrap items-center gap-2">' +
            '<span class="rounded-full px-2.5 py-1 text-xs font-semibold ' + timing.cls + '">' + timing.label + "</span>" +
            (!U.toBool(event.published) ? '<span class="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">Unpublished</span>' : "") +
            '<span id="rating-summary" class="text-sm text-muted-foreground"></span>' +
          "</div>" +
          '<h1 id="event-title" class="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">' + esc(event.title) + "</h1>" +
          '<div class="mt-4 max-w-prose whitespace-pre-line text-base leading-relaxed text-foreground/85">' +
            (event.description ? esc(event.description) : '<span class="text-muted-foreground">No description was provided for this event.</span>') +
          "</div>" +
          '<section id="feedback-section" class="mt-12" aria-labelledby="feedback-title"></section>' +
          (isAdmin ? '<section id="attendees" class="mt-12 scroll-mt-24" aria-labelledby="attendees-title"></section>' : "") +
        "</article>" +
        "<aside>" +
          '<div class="sticky top-24 rounded-xl border border-border bg-card p-6 shadow-card">' +
            '<h2 class="sr-only">Event details</h2>' +
            '<dl class="space-y-4">' +
              info("calendar", "Date", esc(U.formatDate(event.starts_at)) +
                (event.ends_at && U.formatDate(event.ends_at) !== U.formatDate(event.starts_at) ? " – " + esc(U.formatDate(event.ends_at)) : "")) +
              info("clock", "Time", esc(U.formatTimeRange(event.starts_at, event.ends_at))) +
              info("mapPin", "Location", esc(event.location || "To be confirmed") +
                (event.location ? '<br><a href="' + mapUrl + '" target="_blank" rel="noopener" class="font-semibold text-primary hover:underline">Open in Google Maps<span class="sr-only"> (opens in a new tab)</span></a>' : "")) +
            "</dl>" +
            '<div id="event-actions" class="mt-6 border-t border-border pt-6"></div>' +
          "</div>" +
        "</aside>" +
      "</div>"
    );

    renderActions();
  }

  function eventEnded() {
    var end = event.ends_at || event.starts_at;
    return end && new Date(end).getTime() < Date.now();
  }

  function renderActions() {
    var $a = $("#event-actions");

    // ROLE GUARD: management buttons only for admins.
    if (isAdmin) {
      $a.html(
        '<p class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin actions</p>' +
        '<div class="grid gap-2">' +
          '<a href="admin/event-form.html?id=' + encodeURIComponent(event.id) + '" class="rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90">Edit event</a>' +
          '<a href="#attendees" class="rounded-lg border border-input px-4 py-2.5 text-center text-sm font-semibold hover:bg-muted">View registrants</a>' +
          '<button type="button" id="delete-event" class="rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive-soft">Delete event</button>' +
        "</div>"
      );
      $("#delete-event").on("click", deleteEvent);
      return;
    }

    var status = registration ? registration.status : null;

    if (status === "registered") {
      $a.html(
        '<div class="mb-4 flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-2.5 text-sm font-semibold text-primary" role="status">' +
          icon("checkCircle", "h-5 w-5") + "You're registered for this event" +
        "</div>" +
        (eventEnded()
          ? '<p class="text-sm text-muted-foreground">This event has ended. We hope you enjoyed it – tell us how it went below.</p>'
          : '<button type="button" id="cancel-btn" class="w-full rounded-lg border border-destructive/30 px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive-soft">Cancel registration</button>')
      );
      $("#cancel-btn").on("click", cancelRegistration);
    } else if (status === "cancelled") {
      $a.html(
        '<div class="rounded-lg bg-muted px-3 py-3 text-sm" role="status">' +
          '<p class="font-semibold">You cancelled your registration.</p>' +
          '<p class="mt-1 text-muted-foreground">The city\'s booking system doesn\'t allow registering again for the same event online. Contact ' +
          '<a class="font-semibold text-primary hover:underline" href="mailto:' + esc(CivicConfig.CONTACT.email) + '">' + esc(CivicConfig.CONTACT.email) + "</a> if you'd like to attend.</p>" +
        "</div>"
      );
    } else if (eventEnded()) {
      $a.html('<p class="rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">Registration is closed – this event has ended.</p>');
    } else {
      $a.html(
        '<button type="button" id="register-btn" class="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90">Register for free</button>' +
        '<p class="mt-2 text-center text-xs text-muted-foreground">You\'ll find it later under My Events.</p>'
      );
      $("#register-btn").on("click", register);
    }
  }

  function register() {
    var $btn = $("#register-btn");
    CivicUI.setButtonLoading($btn, true, "Registering…");

    CivicApi.post("/event-registrations/register", { event_id: event.id })
      .then(function (body) {
        registration = body.data || { event_id: event.id, status: "registered" };
        CivicUI.toast("success", "You're registered for " + event.title + ".");
        renderActions();
        renderUserFeedback();
        $("#cancel-btn").trigger("focus");
      })
      .catch(function (err) {
        CivicUI.setButtonLoading($btn, false);
        // The backend never re-activates a cancelled registration, so 409 means a record already exists.
        if (err.status === 409) {
          registration = registration || { event_id: event.id, status: "cancelled" };
          CivicUI.toast("warning", "You already have a registration record for this event.");
          renderActions();
        } else {
          CivicUI.toast("error", err.message);
        }
      });
  }

  function cancelRegistration() {
    CivicUI.confirm({
      title: "Cancel your registration?",
      message: "You'll lose your spot at " + event.title + ". The online system doesn't let you register again for the same event after cancelling.",
      confirmText: "Cancel registration",
      cancelText: "Keep my spot",
      danger: true,
    }).then(function (ok) {
      if (!ok) return;
      var $btn = $("#cancel-btn");
      CivicUI.setButtonLoading($btn, true, "Cancelling…");
      CivicApi.post("/event-registrations/cancel", { event_id: event.id })
        .then(function (body) {
          registration = body.data || { event_id: event.id, status: "cancelled" };
          CivicUI.toast("success", "Your registration has been cancelled.");
          renderActions();
          renderUserFeedback();
        })
        .catch(function (err) {
          CivicUI.setButtonLoading($btn, false);
          CivicUI.toast("error", err.message);
        });
    });
  }

  function deleteEvent() {
    CivicUI.confirm({
      title: "Delete this event?",
      message: "“" + event.title + "” will be permanently removed. This can't be undone.",
      confirmText: "Delete event",
      danger: true,
    }).then(function (ok) {
      if (!ok) return;
      var $btn = $("#delete-event");
      CivicUI.setButtonLoading($btn, true, "Deleting…");
      CivicApi.del("/events/" + encodeURIComponent(event.id))
        .then(function () {
          CivicAuth.setFlash("success", "“" + event.title + "” was deleted.");
          window.location.href = "admin/events.html";
        })
        .catch(function (err) {
          CivicUI.setButtonLoading($btn, false);
          CivicUI.toast("error", friendlyDeleteError(err));
        });
    });
  }

  function renderUserFeedback() {
    var $s = $("#feedback-section");
    var heading = '<h2 id="feedback-title" class="text-xl font-extrabold tracking-tight">Feedback &amp; ratings</h2>';

    if (myFeedback) {
      $("#rating-summary").html(CivicCards.stars(myFeedback.rating) + ' <span class="ml-1 align-middle">Your rating</span>');
    }

    // Feedback belongs to attendees, and the event's full feedback list is admin-only in the backend.
    if (!myFeedback && (!registration || registration.status !== "registered")) {
      $s.html(
        heading +
        '<p class="mt-3 rounded-xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">' +
          "Register for this event to share your rating and comments with the city team." +
        "</p>"
      );
      return;
    }

    var editing = !!myFeedback;
    $s.html(
      heading +
      (editing
        ? '<div class="mt-4 rounded-xl border border-border bg-card p-5 shadow-card">' +
            '<p class="text-sm font-semibold">Your feedback</p>' +
            '<div class="mt-2">' + CivicCards.stars(myFeedback.rating, "h-5 w-5") + "</div>" +
            (myFeedback.comment ? '<p class="mt-2 text-sm text-foreground/85">' + esc(myFeedback.comment) + "</p>" : "") +
            '<p class="mt-2 text-xs text-muted-foreground">Submitted ' + esc(U.timeAgo(myFeedback.created_at)) + ". You can leave one rating per event, but you can change it.</p>" +
            '<button type="button" id="edit-feedback" class="mt-4 rounded-lg border border-input px-4 py-2 text-sm font-semibold hover:bg-muted">Edit my feedback</button>' +
          "</div>"
        : "") +
      feedbackForm(editing)
    );

    if (editing) {
      $("#feedback-form").addClass("hidden");
      $("#edit-feedback").on("click", function () {
        $(this).closest("div").addClass("hidden");
        $("#feedback-form").removeClass("hidden").find("input[name=rating]:checked, input[name=rating]").first().trigger("focus");
      });
    }
    bindFeedbackForm(editing);
  }

  // Radio buttons give the star rating keyboard and screen-reader support without custom key handling.
  function feedbackForm(editing) {
    var current = editing ? Number(myFeedback.rating) : 0;
    var starsHtml = "";
    for (var i = 1; i <= 5; i++) {
      starsHtml +=
        '<label class="cursor-pointer">' +
          '<input type="radio" name="rating" value="' + i + '" class="peer sr-only"' + (i === current ? " checked" : "") + " />" +
          '<span class="sr-only">' + i + (i === 1 ? " star" : " stars") + "</span>" +
          '<svg data-star="' + i + '" viewBox="0 0 24 24" class="h-8 w-8 rounded transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-ring ' +
            (i <= current ? "text-secondary" : "text-border") + '" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>' +
        "</label>";
    }
    return (
      '<form id="feedback-form" class="mt-4 rounded-xl border border-border bg-card p-5 shadow-card" novalidate>' +
        '<div data-form-alert class="hidden mb-4"></div>' +
        '<fieldset id="rating-field">' +
          '<legend class="text-sm font-semibold">' + (editing ? "Update your rating" : "Rate this event") + ' <span class="text-destructive" aria-hidden="true">*</span></legend>' +
          '<div class="mt-2 flex gap-1" data-field id="rating-stars">' + starsHtml + "</div>" +
        "</fieldset>" +
        '<label for="comment" class="mt-4 block text-sm font-semibold">Comments (optional)</label>' +
        '<textarea id="comment" name="comment" rows="4" maxlength="1000" placeholder="What did you enjoy? What could be better?" ' +
          'class="mt-1.5 w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm focus:border-ring">' + (editing ? esc(myFeedback.comment || "") : "") + "</textarea>" +
        '<div class="mt-4 flex gap-2">' +
          '<button type="submit" id="feedback-submit" class="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">' + (editing ? "Save changes" : "Submit feedback") + "</button>" +
        "</div>" +
      "</form>"
    );
  }

  function bindFeedbackForm(editing) {
    var $form = $("#feedback-form");

    function paint(value) {
      $form.find("[data-star]").each(function () {
        var n = Number($(this).attr("data-star"));
        $(this).toggleClass("text-secondary", n <= value).toggleClass("text-border", n > value);
      });
    }
    $form.on("change", "input[name=rating]", function () {
      paint(Number(this.value));
      CivicUI.clearFieldError($("#rating-stars"));
    });
    $form.find("label").on("mouseenter", function () { paint(Number($(this).find("input").val())); });
    $form.find("#rating-stars").on("mouseleave", function () { paint(Number($form.find("input[name=rating]:checked").val() || 0)); });

    $form.on("submit", function (e) {
      e.preventDefault();
      CivicUI.clearFormErrors($form);
      var rating = Number($form.find("input[name=rating]:checked").val() || 0);
      var comment = $("#comment").val().trim();

      if (rating < 1 || rating > 5) {
        CivicUI.showFieldError($("#rating-stars"), "Choose a rating from 1 to 5 stars.");
        $form.find("input[name=rating]").first().trigger("focus");
        return;
      }

      var $btn = $("#feedback-submit");
      CivicUI.setButtonLoading($btn, true, "Saving…");

      var request = editing
        ? CivicApi.put("/event-feedback/" + encodeURIComponent(myFeedback.id), { rating: rating, comment: comment })
        : CivicApi.post("/event-feedback", { event_id: event.id, rating: rating, comment: comment });

      request
        .then(function (body) {
          myFeedback = Object.assign({}, myFeedback, body.data || { rating: rating, comment: comment });
          CivicUI.toast("success", editing ? "Your feedback was updated." : "Thank you! Your feedback was submitted.");
          renderUserFeedback();
        })
        .catch(function (err) {
          CivicUI.setButtonLoading($btn, false);
          if (err.status === 409) {
            CivicUI.showFormAlert($form, "You've already rated this event. Refresh the page to edit your existing feedback.");
          } else {
            CivicUI.showFormAlert($form, err.message);
          }
        });
    });
  }

  function loadAllFeedback() {
    var $s = $("#feedback-section");
    $s.html('<h2 id="feedback-title" class="text-xl font-extrabold tracking-tight">Feedback &amp; ratings</h2><div id="feedback-list" class="mt-4 space-y-3">' + CivicUI.skeletonCards(2, false) + "</div>");

    CivicApi.get("/event-feedback/event/" + encodeURIComponent(event.id))
      .then(function (body) {
        var list = body.data || [];
        var $list = $("#feedback-list");
        if (!list.length) {
          $list.html(CivicUI.emptyState("No feedback yet", "Ratings from attendees will appear here."));
          return;
        }
        var avg = list.reduce(function (s, f) { return s + Number(f.rating || 0); }, 0) / list.length;
        $("#rating-summary").html(CivicCards.stars(avg) + ' <span class="ml-1 align-middle">' + avg.toFixed(1) + " (" + list.length + (list.length === 1 ? " review" : " reviews") + ")</span>");

        $list.html(
          '<div class="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-card">' +
            '<p class="text-4xl font-extrabold">' + avg.toFixed(1) + "</p>" +
            "<div>" + CivicCards.stars(avg, "h-5 w-5") + '<p class="mt-1 text-sm text-muted-foreground">Average from ' + list.length + (list.length === 1 ? " rating" : " ratings") + "</p></div>" +
          "</div>" +
          list.map(function (f) {
            return (
              '<article class="rounded-xl border border-border bg-card p-5 shadow-card">' +
                '<div class="flex flex-wrap items-center justify-between gap-2">' +
                  '<p class="font-semibold">' + esc(f.full_name || "Resident") + ' <span class="text-xs font-normal text-muted-foreground">· ' + esc(U.timeAgo(f.created_at)) + "</span></p>" +
                  CivicCards.stars(f.rating) +
                "</div>" +
                (f.comment ? '<p class="mt-2 text-sm text-foreground/85">' + esc(f.comment) + "</p>" : '<p class="mt-2 text-sm italic text-muted-foreground">No comment.</p>') +
              "</article>"
            );
          }).join("")
        );
      })
      .catch(function (err) {
        $("#feedback-list").html('<div class="grid">' + CivicUI.errorState(err) + "</div>").find("[data-retry]").on("click", loadAllFeedback);
      });
  }

  function loadAttendees() {
    var $s = $("#attendees");
    $s.html(
      '<h2 id="attendees-title" class="text-xl font-extrabold tracking-tight">Registrants</h2>' +
      '<div class="mt-4 overflow-x-auto rounded-xl border border-border bg-card shadow-card">' +
        '<table class="w-full text-left text-sm">' +
          '<caption class="sr-only">People registered for ' + esc(event.title) + "</caption>" +
          '<thead class="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground"><tr>' +
            '<th scope="col" class="px-4 py-3">Name</th><th scope="col" class="px-4 py-3">Email</th><th scope="col" class="px-4 py-3">Registered</th>' +
          "</tr></thead>" +
          '<tbody id="attendees-body">' + CivicAdminLayout.tableSkeleton(3, 3) + "</tbody>" +
        "</table>" +
      "</div>"
    );

    CivicApi.get("/event-registrations/event/" + encodeURIComponent(event.id) + "/attendees")
      .then(function (body) {
        var list = body.data || [];
        $("#attendees-title").text("Registrants (" + list.length + ")");
        if (!list.length) {
          $("#attendees-body").html(CivicAdminLayout.tableMessage(3, '<p class="py-6 text-center text-sm text-muted-foreground">Nobody has registered yet.</p>'));
          return;
        }
        $("#attendees-body").html(
          list.map(function (a) {
            return (
              '<tr class="border-b border-border last:border-0">' +
                '<td class="px-4 py-3 font-medium">' + esc(a.full_name) + "</td>" +
                '<td class="px-4 py-3"><a class="text-primary hover:underline" href="mailto:' + esc(a.email) + '">' + esc(a.email) + "</a></td>" +
                '<td class="px-4 py-3 text-muted-foreground">' + esc(U.formatDateTime(a.created_at)) + "</td>" +
              "</tr>"
            );
          }).join("")
        );
      })
      .catch(function (err) {
        $("#attendees-body").html(CivicAdminLayout.tableMessage(3, '<p class="py-4 text-center text-sm text-destructive" role="alert">' + esc(err.message) + "</p>"));
      });
  }

  // Registrations reference the event without ON DELETE CASCADE, so the database blocks the delete.
  function friendlyDeleteError(err) {
    if (/foreign key|violates/i.test(err.message || "")) {
      return "This event can't be deleted because people have registered for it. The backend keeps registrations linked to their event.";
    }
    return err.message;
  }

  load();
});
