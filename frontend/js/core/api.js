/*
 * CivicApi – the ONE place that talks to the backend.
 * ---------------------------------------------------------------
 * WHAT IS AN API REQUEST?
 *   The browser sends a message to the server, e.g. "GET /api/events",
 *   and the server answers with data (JSON). The page then shows that data.
 *
 * WHAT IS AJAX?
 *   AJAX lets JavaScript send that request in the background, without
 *   reloading the page. jQuery gives us $.ajax() to do this.
 *
 * WHY ONE FILE?
 *   Every request needs the same things: the base URL, the
 *   "Authorization: Bearer <token>" header, error handling, and
 *   special handling for file uploads. Writing that once here avoids
 *   copying it into every page.
 *
 * Every function returns a Promise:
 *   CivicApi.get("/events")
 *     .then(function (body) { ... body.data ... })
 *     .catch(function (err) { ... err.message ... });
 *
 * Errors are always normalised to: { status, message, errors, isNetworkError }
 */
window.CivicApi = (function () {
  /** Turns a failed jqXHR into a friendly error object. */
  function normaliseError(xhr) {
    var body = xhr.responseJSON || {};
    var status = xhr.status;

    // status 0 = the request never reached the server (backend off, no internet, CORS)
    if (status === 0) {
      return {
        status: 0,
        isNetworkError: true,
        message:
          "We can't reach the CivicEvents server. Check your connection, or make sure the backend is running at " +
          window.CivicConfig.API_ORIGIN + ".",
        errors: [],
      };
    }

    var fallback = {
      400: "Some information is missing or invalid. Please check the form.",
      401: "Please sign in to continue.",
      403: "You don't have permission to do this. If you think this is a mistake, contact a city administrator.",
      404: "We couldn't find what you were looking for.",
      409: "This conflicts with existing data.",
      413: "The file is too large.",
      500: "Something went wrong on the server. Please try again in a moment.",
    };

    return {
      status: status,
      isNetworkError: false,
      // Prefer the backend's own message (e.g. "Email already in use").
      message: body.message || fallback[status] || fallback[500],
      errors: Array.isArray(body.errors) ? body.errors : [],
    };
  }

  /**
   * request – the core function. All shortcuts below call it.
   * options:
   *   method   "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
   *   path     e.g. "/events" (added to CivicConfig.API_BASE_URL)
   *   data     plain object → sent as JSON
   *   formData FormData object → sent as multipart/form-data (file uploads)
   *   auth     send the token? (default true)
   *   onProgress function(percent) for upload progress bars
   */
  function request(options) {
    var opts = Object.assign({ method: "GET", auth: true }, options);
    var token = window.CivicAuth.getToken();

    var ajaxSettings = {
      url: window.CivicConfig.API_BASE_URL + opts.path,
      method: opts.method,
      dataType: "json",
      headers: {},
      timeout: 60000,
    };

    // Attach "Authorization: Bearer <token>" to protected requests.
    if (opts.auth && token) {
      ajaxSettings.headers.Authorization = "Bearer " + token;
    }

    if (opts.formData) {
      // FILE UPLOADS: let the browser build the multipart body.
      // We must NOT set Content-Type ourselves – the browser adds the
      // special "boundary" value that separates each field.
      ajaxSettings.data = opts.formData;
      ajaxSettings.processData = false;
      ajaxSettings.contentType = false;

      if (typeof opts.onProgress === "function") {
        ajaxSettings.xhr = function () {
          var xhr = new window.XMLHttpRequest();
          xhr.upload.addEventListener("progress", function (e) {
            if (e.lengthComputable) opts.onProgress(Math.round((e.loaded / e.total) * 100));
          });
          return xhr;
        };
      }
    } else if (opts.data !== undefined) {
      ajaxSettings.data = JSON.stringify(opts.data);
      ajaxSettings.contentType = "application/json";
    }

    return new Promise(function (resolve, reject) {
      $.ajax(ajaxSettings)
        .done(function (body) {
          resolve(body || {});
        })
        .fail(function (xhr) {
          var error = normaliseError(xhr);

          // 401 on a protected request = token missing, expired or invalid.
          // Sign the user out and send them to the login page.
          if (error.status === 401 && opts.auth && token) {
            window.CivicAuth.expireSession();
          }

          reject(error);
        });
    });
  }

  return {
    request: request,
    get: function (path) {
      return request({ method: "GET", path: path });
    },
    post: function (path, data, extra) {
      return request(Object.assign({ method: "POST", path: path, data: data }, extra));
    },
    put: function (path, data) {
      return request({ method: "PUT", path: path, data: data });
    },
    patch: function (path, data) {
      return request({ method: "PATCH", path: path, data: data });
    },
    del: function (path) {
      return request({ method: "DELETE", path: path });
    },
    /** Multipart upload: method is "POST" or "PUT". */
    upload: function (method, path, formData, onProgress) {
      return request({ method: method, path: path, formData: formData, onProgress: onProgress });
    },
  };
})();
