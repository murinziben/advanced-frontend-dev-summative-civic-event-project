/*
 * CivicEvents – frontend configuration
 * ---------------------------------------------------------------
 * The ONLY place where the backend address is written.
 * If your backend runs on another port or server, change API_ORIGIN here.
 *
 * No secrets belong in this file: everything in the frontend can be read
 * by anyone who opens the browser's developer tools.
 */
window.CivicConfig = Object.freeze({
  APP_NAME: "CivicEvents",

  // Where the Express backend runs (see backend/README.md → `npm run dev`).
  API_ORIGIN: "http://localhost:4000",

  // All API routes start with /api (see backend/app.js → app.use('/api', routes)).
  get API_BASE_URL() {
    return this.API_ORIGIN + "/api";
  },

  // How many cards to show per page on list pages.
  PAGE_SIZE: 9,

  // Upload rules copied from backend/src/middlewares/upload.middleware.js,
  // so we can warn the user BEFORE uploading a file the server will reject.
  UPLOADS: {
    image: { maxBytes: 2 * 1024 * 1024, extensions: [".jpg", ".jpeg", ".png", ".gif"], label: "JPG, PNG or GIF, up to 2 MB" },
    audio: { maxBytes: 5 * 1024 * 1024, extensions: [".mp3", ".wav", ".m4a", ".ogg"], label: "MP3, WAV, M4A or OGG, up to 5 MB" },
    video: { maxBytes: 8 * 1024 * 1024, extensions: [".mp4", ".mov", ".avi", ".mkv"], label: "MP4, MOV, AVI or MKV, up to 8 MB" },
  },

  // Contact details shown in the footer and on the "forbidden" page.
  CONTACT: {
    address: "City Hall, 1 Civic Square",
    phone: "+250 788 000 000",
    email: "hello@greenhill.gov",
  },
});
