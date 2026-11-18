/*
 * Login page
 * ---------------------------------------------------------------
 * API: POST /api/auth/login   body { email, password }
 * Success (200): data = { token, user: { id, full_name, email, role } }
 * Failure (401): { message: "Invalid credentials" }
 *
 * Flow:
 *   1. Check the fields in the browser first (fast feedback).
 *   2. Send the request with CivicApi (auth: false – we don't have a token yet).
 *   3. Save token + user with CivicAuth.saveSession().
 *   4. Redirect: back to the page they wanted (?next=) or to their dashboard.
 */
CivicApp.start(function () {
  var $form = $("#login-form");
  var $email = $("#email");
  var $password = $("#password");
  var $submit = $("#login-submit");

  CivicAuthPages.initLogo();
  CivicAuthPages.initPasswordToggles();

  // Pre-fill the email after signup (signup.html redirects with ?email=)
  var prefill = CivicUtils.getQueryParam("email");
  if (prefill) {
    $email.val(prefill);
    $password.trigger("focus");
  }

  // Clear a field's error as soon as the user edits it.
  $form.on("input", "input", function () {
    CivicUI.clearFieldError(this);
  });

  /** Returns true when the form is OK to send. */
  function validate() {
    CivicUI.clearFormErrors($form);
    var ok = true;

    if (!$email.val().trim()) {
      CivicUI.showFieldError($email, "Enter your email address.");
      ok = false;
    } else if (!CivicAuthPages.isValidEmail($email.val())) {
      CivicUI.showFieldError($email, "Enter a valid email address, like name@example.com.");
      ok = false;
    }

    if (!$password.val()) {
      CivicUI.showFieldError($password, "Enter your password.");
      ok = false;
    }

    if (!ok) $form.find("[aria-invalid=true]").first().trigger("focus");
    return ok;
  }

  /**
   * Only follow ?next= if it points to THIS website.
   * (Otherwise someone could send a link that redirects users to a fake site.)
   */
  function safeNextUrl() {
    var next = CivicUtils.getQueryParam("next");
    if (!next) return null;
    try {
      var target = new URL(next, window.location.href);
      return target.origin === window.location.origin ? target.href : null;
    } catch (e) {
      return null;
    }
  }

  $form.on("submit", function (e) {
    e.preventDefault();
    if (!validate()) return;

    CivicUI.setButtonLoading($submit, true, "Signing in…");

    CivicApi.request({
      method: "POST",
      path: "/auth/login",
      data: { email: $email.val().trim(), password: $password.val() },
      auth: false,
    })
      .then(function (body) {
        var data = body.data || {};
        if (!data.token || !data.user) {
          throw { message: "The server sent an unexpected response. Please try again." };
        }

        // Save token + user (sessionStorage, or localStorage if "Remember me").
        CivicAuth.saveSession(data.token, data.user, $("#remember").is(":checked"));
        CivicAuth.setFlash("success", "Welcome back, " + data.user.full_name.split(" ")[0] + "!");

        var next = safeNextUrl();
        // A normal user must not be sent to an admin page via ?next=.
        if (next && next.indexOf("/admin/") !== -1 && data.user.role !== "admin") next = null;

        window.location.href = next || CivicUtils.url(CivicAuth.homeFor(data.user));
      })
      .catch(function (err) {
        CivicUI.setButtonLoading($submit, false);
        $password.val("");

        if (err.status === 401) {
          CivicUI.showFormAlert($form, "The email or password is incorrect. Please try again.");
        } else {
          CivicUI.showFormAlert($form, err.message || "Sign in failed. Please try again.");
        }
        $form.find("[data-form-alert]").attr("tabindex", "-1").trigger("focus");
      });
  });
});
