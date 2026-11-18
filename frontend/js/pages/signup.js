/*
 * Signup page
 * ---------------------------------------------------------------
 * API: POST /api/auth/signup   body { full_name, email, password }
 * Success (201): data = { id, full_name, email, role }
 * Failure: 400 (weak password / missing field), 409 (email already used)
 *
 * The backend enforces the SAME password rule we check here
 * (backend/src/controllers/auth.controller.js → PASSWORD_REGEX):
 * min 8 chars, uppercase, lowercase, number and special character.
 *
 * SECURITY NOTE: the backend also accepts a "role" field on signup.
 * We deliberately NEVER send it, so every new account is a normal "user".
 */
CivicApp.start(function () {
  var $form = $("#signup-form");
  var $name = $("#full_name");
  var $email = $("#email");
  var $password = $("#password");
  var $confirm = $("#confirm_password");
  var $terms = $("#terms");
  var $submit = $("#signup-submit");

  CivicAuthPages.initLogo();
  CivicAuthPages.initPasswordToggles();

  /* ---------------- Password strength meter ---------------- */
  var RULES = {
    length: function (p) { return p.length >= 8; },
    lower: function (p) { return /[a-z]/.test(p); },
    upper: function (p) { return /[A-Z]/.test(p); },
    number: function (p) { return /\d/.test(p); },
    special: function (p) { return /[\W_]/.test(p); },
  };

  /** Returns which rules pass, plus a 0–4 score for the bar. */
  function checkPassword(password) {
    var passed = {};
    var count = 0;
    Object.keys(RULES).forEach(function (rule) {
      passed[rule] = RULES[rule](password);
      if (passed[rule]) count++;
    });
    var score = 0;
    if (password.length > 0) score = 1;          // something typed
    if (count >= 3) score = 2;                    // fair
    if (count === 5) score = 3;                   // meets the policy
    if (count === 5 && password.length >= 12) score = 4; // strong
    return { passed: passed, allPassed: count === 5, score: score };
  }

  var LEVELS = [
    { label: "—", color: "" },
    { label: "Weak", color: "bg-destructive" },
    { label: "Fair", color: "bg-warning" },
    { label: "Good", color: "bg-success" },
    { label: "Strong", color: "bg-primary" },
  ];

  function updateMeter() {
    var result = checkPassword($password.val());
    var level = LEVELS[result.score];

    $(".strength-bar").each(function (i) {
      $(this)
        .removeClass("bg-muted bg-destructive bg-warning bg-success bg-primary")
        .addClass(i < result.score ? level.color : "bg-muted");
    });
    $("#password-strength-text").text("Password strength: " + level.label);

    Object.keys(result.passed).forEach(function (rule) {
      var ok = result.passed[rule];
      var $li = $('#password-rules [data-rule="' + rule + '"]');
      $li.toggleClass("text-success font-medium", ok).toggleClass("text-muted-foreground", !ok);
      $li.find(".rule-icon").html(
        ok
          ? CivicUI.icon("check", "h-3.5 w-3.5") + '<span class="sr-only">Done: </span>'
          : '<span class="inline-block h-1.5 w-1.5 rounded-full bg-current mx-1" aria-hidden="true"></span><span class="sr-only">Not yet: </span>'
      );
    });
    return result;
  }

  $password.on("input", updateMeter);
  updateMeter();

  $form.on("input change", "input", function () {
    CivicUI.clearFieldError(this);
  });

  /* ---------------- Validation ---------------- */
  function validate() {
    CivicUI.clearFormErrors($form);
    var ok = true;
    function fail($field, msg) {
      CivicUI.showFieldError($field, msg);
      ok = false;
    }

    var name = $name.val().trim();
    if (!name) fail($name, "Enter your full name.");
    else if (name.length < 2) fail($name, "Your name must be at least 2 characters.");

    var email = $email.val().trim();
    if (!email) fail($email, "Enter your email address.");
    else if (!CivicAuthPages.isValidEmail(email)) fail($email, "Enter a valid email address, like name@example.com.");

    var pw = checkPassword($password.val());
    if (!$password.val()) fail($password, "Create a password.");
    else if (!pw.allPassed) fail($password, "Your password doesn't meet all the rules listed below.");

    if (!$confirm.val()) fail($confirm, "Type your password again.");
    else if ($confirm.val() !== $password.val()) fail($confirm, "The passwords don't match.");

    if (!$terms.is(":checked")) fail($terms, "Please accept the Terms of Use to continue.");

    if (!ok) $form.find("[aria-invalid=true]").first().trigger("focus");
    return ok;
  }

  /* ---------------- Submit ---------------- */
  $form.on("submit", function (e) {
    e.preventDefault();
    if (!validate()) return;

    CivicUI.setButtonLoading($submit, true, "Creating account…");
    var email = $email.val().trim();

    CivicApi.request({
      method: "POST",
      path: "/auth/signup",
      // Only these three fields – never "role" (see note at the top).
      data: { full_name: $name.val().trim(), email: email, password: $password.val() },
      auth: false,
    })
      .then(function () {
        // Brief: "On success redirect to login page with success toast."
        CivicAuth.setFlash("success", "Your account has been created. Please sign in.");
        window.location.href = CivicUtils.url("login.html?email=" + encodeURIComponent(email));
      })
      .catch(function (err) {
        CivicUI.setButtonLoading($submit, false);

        if (err.status === 409) {
          CivicUI.showFieldError($email, "An account with this email already exists. Try signing in instead.");
          $email.trigger("focus");
        } else if (err.status === 400 && /password/i.test(err.message)) {
          CivicUI.showFieldError($password, err.message);
          $password.trigger("focus");
        } else {
          CivicUI.showFormAlert($form, err.message || "We couldn't create your account. Please try again.");
          $form.find("[data-form-alert]").attr("tabindex", "-1").trigger("focus");
        }
      });
  });
});
