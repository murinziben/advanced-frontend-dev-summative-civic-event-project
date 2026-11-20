/*
 * My profile (profile.html)
 * ---------------------------------------------------------------
 * APIs:
 *   GET   /api/users/profile/me          { id, full_name, email, role, is_active, created_at }
 *   PATCH /api/users/profile/me          body { full_name?, email? }
 *     → 409 "Email is already in use" if another account has that email
 *     → 400 if role or is_active are sent (the backend forbids it)
 *
 * Users can change only their name and email. Role and account status
 * are shown read-only – we never send them.
 */
CivicApp.start(function () {
  var U = CivicUtils;
  var esc = U.escapeHtml;
  var profile = null;
  var $form = $("#profile-form");
  var $submit = $("#profile-submit");

  function renderSummary() {
    var active = U.toBool(profile.is_active);
    $("#profile-summary").html(
      '<div class="flex items-center gap-4">' +
        '<span class="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground" aria-hidden="true">' + esc(U.initials(profile.full_name)) + "</span>" +
        '<div class="min-w-0">' +
          '<p class="truncate text-lg font-bold">' + esc(profile.full_name) + "</p>" +
          '<p class="truncate text-sm text-muted-foreground">' + esc(profile.email) + "</p>" +
        "</div>" +
      "</div>" +
      '<dl class="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6 text-sm">' +
        '<div><dt class="text-muted-foreground">Role</dt><dd class="mt-1"><span class="rounded-full px-2.5 py-1 text-xs font-semibold ' +
          (profile.role === "admin" ? "bg-secondary-soft text-secondary-foreground" : "bg-primary-soft text-primary") + '">' + (profile.role === "admin" ? "Administrator" : "Resident") + "</span></dd></div>" +
        '<div><dt class="text-muted-foreground">Account status</dt><dd class="mt-1"><span class="inline-flex items-center gap-1.5 text-xs font-semibold ' + (active ? "text-success" : "text-destructive") + '">' +
          '<span class="h-2 w-2 rounded-full ' + (active ? "bg-success" : "bg-destructive") + '" aria-hidden="true"></span>' + (active ? "Active" : "Disabled") + "</span></dd></div>" +
        '<div class="col-span-2"><dt class="text-muted-foreground">Member since</dt><dd class="mt-1 font-medium">' + esc(U.formatDate(profile.created_at)) + "</dd></div>" +
      "</dl>" +
      '<p class="mt-6 rounded-lg bg-muted p-3 text-xs text-muted-foreground">Your role and account status are managed by the city and can\'t be changed here.</p>'
    );
  }

  function load() {
    $("#profile-summary").html('<div aria-hidden="true"><div class="skeleton h-16 w-16 rounded-full"></div><div class="skeleton mt-4 h-5 w-40"></div><div class="skeleton mt-2 h-4 w-52"></div></div>');
    $form.addClass("opacity-60 pointer-events-none");
    CivicApi.get("/users/profile/me")
      .then(function (body) {
        profile = body.data;
        $("#full_name").val(profile.full_name);
        $("#email").val(profile.email);
        renderSummary();
        $form.removeClass("opacity-60 pointer-events-none");
      })
      .catch(function (err) {
        $("#profile-summary").html('<div class="grid">' + CivicUI.errorState(err) + "</div>");
        $("#profile-summary [data-retry]").on("click", load);
      });
  }

  $form.on("input", "input", function () { CivicUI.clearFieldError(this); });

  $form.on("submit", function (e) {
    e.preventDefault();
    CivicUI.clearFormErrors($form);

    var name = $("#full_name").val().trim();
    var email = $("#email").val().trim();
    var ok = true;
    if (!name) { CivicUI.showFieldError("#full_name", "Enter your full name."); ok = false; }
    else if (name.length < 2) { CivicUI.showFieldError("#full_name", "Your name must be at least 2 characters."); ok = false; }
    if (!email) { CivicUI.showFieldError("#email", "Enter your email address."); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { CivicUI.showFieldError("#email", "Enter a valid email address, like name@example.com."); ok = false; }
    if (!ok) { $form.find("[aria-invalid=true]").first().trigger("focus"); return; }

    // Send only what changed (never role or is_active).
    var changes = {};
    if (name !== profile.full_name) changes.full_name = name;
    if (email.toLowerCase() !== String(profile.email).toLowerCase()) changes.email = email;
    if (!Object.keys(changes).length) {
      CivicUI.toast("info", "Nothing to save – your details are unchanged.");
      return;
    }

    // Changing the sign-in email deserves a confirmation.
    var confirmStep = changes.email
      ? CivicUI.confirm({
          title: "Change your email?",
          message: "From now on you'll sign in with " + email + " instead of " + profile.email + ".",
          confirmText: "Change email",
        })
      : Promise.resolve(true);

    confirmStep.then(function (go) {
      if (!go) return;
      CivicUI.setButtonLoading($submit, true, "Saving…");
      CivicApi.patch("/users/profile/me", changes)
        .then(function (body) {
          profile = body.data || Object.assign(profile, changes);
          CivicAuth.updateUser(profile); // keeps the header name/email in sync
          renderSummary();
          CivicUI.toast("success", "Your profile was updated.");
        })
        .catch(function (err) {
          if (err.status === 409) {
            CivicUI.showFieldError("#email", "This email is already used by another account. Please choose a different one.");
            $("#email").trigger("focus");
          } else {
            CivicUI.showFormAlert($form, err.message);
          }
        })
        .finally(function () { CivicUI.setButtonLoading($submit, false); });
    });
  });

  $("#reset-profile").on("click", function () {
    CivicUI.clearFormErrors($form);
    $("#full_name").val(profile.full_name);
    $("#email").val(profile.email);
  });

  load();
});
