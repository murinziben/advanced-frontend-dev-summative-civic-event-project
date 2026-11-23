window.CivicApi = (function () {
  // One error shape for every page, preferring the backend's own message (e.g. "Email already in use").
  function normaliseError(xhr) {
    var body = xhr.responseJSON || {};
    var status = xhr.status;

    // Status 0 means the request never reached the server (backend stopped or offline).
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
      message: body.message || fallback[status] || fallback[500],
      errors: Array.isArray(body.errors) ? body.errors : [],
    };
  }

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

    if (opts.auth && token) {
      ajaxSettings.headers.Authorization = "Bearer " + token;
    }

    // The browser must add the multipart boundary itself, so Content-Type is deliberately left unset.
    if (opts.formData) {
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

          // A 401 on an authenticated call means the token is no longer valid, so the user is signed out.
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
    upload: function (method, path, formData, onProgress) {
      return request({ method: method, path: path, formData: formData, onProgress: onProgress });
    },
  };
})();
