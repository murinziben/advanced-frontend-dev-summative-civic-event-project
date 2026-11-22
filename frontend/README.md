# CivicEvents – Frontend (UI Implementation)

Accessible, responsive frontend for the **CivicEvents – City Events & Services Portal**, built with
**HTML5, Tailwind CSS and jQuery** only. It talks to the provided Node.js/Express backend in `../backend`.

> This README grows phase by phase. Sections marked _(coming)_ will be completed in later phases.

## 1. Requirements

- The backend running locally (see `../backend/README.md`). By default it runs on `http://localhost:4000`.
- Any static web server for the frontend, e.g. the **Live Server** extension in VS Code.
- An internet connection (Tailwind, jQuery and the Google font load from CDNs).

## 2. Run the frontend

1. Start the backend: `cd backend && npm install && npm run dev`
2. Open the `frontend` folder in VS Code → right-click `index.html` → **Open with Live Server**
   (opens `http://127.0.0.1:5500/frontend/index.html` or similar).
   Alternative without VS Code: `cd frontend && python -m http.server 5500` → open `http://localhost:5500`.

## 3. Connect to the backend (API base URL)

The backend address lives in **one file**: `js/config.js`

```js
API_ORIGIN: "http://localhost:4000",   // API base URL = http://localhost:4000/api
```

Change it if your backend runs on another port or server. The backend enables CORS for all origins,
so no other settings are needed. No secrets are stored in the frontend.

## 4. Creating an admin account

The backend has no seed data and no admin screen for roles (by design, admins can't change roles in
the UI). Create the first admin once with Postman (collection in `../backend`):

```
POST http://localhost:4000/api/auth/signup
{ "full_name": "City Admin", "email": "admin@gmail.com", "password": "Password123@", "role": "admin" }
```

Every account created through the CivicEvents signup page is a normal **user** (the frontend never sends `role`).

## 5. Project structure

```
frontend/
├── index.html, login.html, signup.html, dashboard.html, forbidden.html
├── admin/                 admin-only pages (data-guard="admin")
├── css/styles.css         design tokens (colours from the design) + base styles
├── assets/images/         photos used by the hero and auth pages
└── js/
    ├── config.js          API base URL and upload limits
    ├── tailwind.config.js maps design tokens to Tailwind class names
    ├── core/              shared foundation used by every page
    │   ├── utils.js       formatting, escaping, file checks
    │   ├── auth.js        token + user storage (global auth context)
    │   ├── api.js         jQuery AJAX wrapper (Bearer token, JSON, FormData, errors)
    │   ├── guards.js      ROLE-BASED ACCESS GUARDS (documented in the file)
    │   ├── ui.js          toasts, confirm dialog, loaders, empty/error states, icons
    │   ├── layout.js      shared header (nav, bell, profile menu) and footer
    │   ├── notify-store.js read/unread tracking for notifications
    │   └── app.js         page start-up order
    ├── components/        reusable card markup
    └── pages/             one script per page
```

## 6. Where role-based guards are implemented

- **`js/core/guards.js`** – full explanation at the top of the file.
  - Page guards: every page declares `data-guard="public | guest | auth | admin"` on `<body>`.
  - Element guards: `data-show-for="admin | user | auth | guest"` removes elements the user must not see.
- **`js/core/auth.js` → `isAdmin()`** – reads `role` from the login response.
- **`js/core/layout.js` → `navLinks()`** – admins see "Dashboard", users see "My Events".
- **`js/components/cards.js`** – Edit/Delete buttons are only built when `CivicAuth.isAdmin()` is true.
- Real security stays on the server: `backend/src/middlewares/auth.middleware.js` (`authenticate`, `authorize(['admin'])`).

## 7. Token storage

- After login the JWT token and `{ id, full_name, email, role }` are saved in **sessionStorage**
  (cleared when the tab closes). Ticking **"Remember me"** uses **localStorage** instead
  (stays after closing the browser – less safe on shared computers).
- The password is never stored.
- The token expires after 1 hour (backend setting). When it expires, or the server answers 401,
  the user is signed out and sees "Your session has expired".

## 8. Backend limitations found _(coming – full list in Phase 14)_
## 9. Testing checklist _(coming)_
