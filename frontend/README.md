# CivicEvents – Frontend (UI Implementation)

Accessible, responsive frontend for **CivicEvents – Accessible City Events & Services Portal**.
Built with **HTML5, Tailwind CSS and jQuery only** (plus Chart.js for the admin charts).
Design system: **Royal Blue + White** (`#2563EB` primary, `#172554` navy, `#F5F7FF` background), **Inter** font, Lucide-style outline icons.
It consumes the provided Node.js/Express + PostgreSQL backend in `../backend`.

**Demo video (5–7 min):** [Watch on Google Drive](https://drive.google.com/file/d/17rn7pLDZOiHt_KDF4X1eJl3PXAm3RLBj/view?usp=sharing)

---

## 1. Features

| Area | Residents (role `user`) | Administrators (role `admin`) |
|---|---|---|
| Auth | Sign up (strength meter, strong-password rules), sign in, sign out, "Remember me" | Same |
| Events | Browse published events, search, filter by date / location / upcoming-past, pagination, event details, map link, register, cancel | Create / edit / delete events with image upload + preview, see registrants, see all ratings + average |
| My events | Upcoming / Past / Cancelled tabs, cancel, rate after attending | – |
| Feedback | One rating (1–5 stars) + comment per event, edit own rating | View every rating and the average |
| Announcements | Audio player (play/pause, seek, current time/duration, volume), fallback text | Upload audio, publish/unpublish (optimistic switch), edit title, replace recording, delete (from the list or the edit page) |
| Promos | Video with **English captions on by default**, transcript, lazy-loaded thumbnails | Upload video + caption text, publish/unpublish, edit, delete |
| Notifications | Bell with unread count, drawer with latest items, inbox with details and links to the related event/announcement/promo, mark read/unread | Delete notifications (inbox + admin page) |
| Profile | View details, update name and email (confirmation + conflict message), role/status read-only | Same |
| Dashboard | Personal stats (registrations, feedback, unread) | Welcome banner, 6 clickable stat cards, New Users per Month line chart, Platform Activity bars, Recent Activity and Recent Users – all from the database, with table views |
| Admin shell | – | White sidebar (collapsible on desktop, drawer on mobile), top bar with breadcrumb, event search, notification bell and profile menu |
| Users | – | Search/filter users, view details, enable/disable accounts (cannot change roles, cannot disable yourself) |

UX: toasts, confirmation dialogs, skeleton loaders, empty states, error states with **Try again**, loading
buttons, upload progress bars, client-side validation, file type/size checks before upload, 2-minute caching
of promos/announcements (cleared whenever an admin changes them).

---

## 2. Backend setup (Windows – what we used)

> Full original instructions: `../backend/README.md`. These are the exact steps that worked, with fixes.

1. **Install** Node.js LTS and PostgreSQL 17 (keep *Command Line Tools* and *pgAdmin* ticked; remember the `postgres` password).
2. **PowerShell fixes** (only needed once):
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   [Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path","User") + ";C:\Program Files\PostgreSQL\17\bin", "User")
   ```
3. **Create the database** (the quotes are required because of the hyphens):
   ```powershell
   psql -U postgres
   CREATE DATABASE "civic-events-db";
   \q
   ```
4. **Configure `backend/.env`** (the backend reads `DB_PASS`, not `DB_PASSWORD`):
   ```
   DB_USER=postgres
   DB_PASS=your_postgres_password      # wrap in "double quotes" if it starts/ends with spaces
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=civic-events-db
   JWT_SECRET=a_long_random_string     # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
5. **Run the migration** (creates the 7 tables):
   ```powershell
   psql -U postgres -d civic-events-db -f backend/migrations/001_create_tables.sql
   ```
6. **Start the API**:
   ```powershell
   cd backend
   npm install
   npm run dev        # → "listening on port 4000" and "Connected to PostgreSQL"
   ```
   Check: open `http://localhost:4000/health` → `{"ok":true}`.
7. **Create the first admin** (there is no seed file; the signup page always creates normal users):
   ```powershell
   Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/auth/signup" -ContentType "application/json" `
     -Body '{"full_name":"City Admin","email":"admin@civicevents.test","password":"Admin@2026","role":"admin"}'
   ```
   (Or Postman: import `backend/CivicEvents+ API.postman_collection.json`, set `base_url` to `http://localhost:4000`, run *Auth → Register User*.)

---

## 3. Run the frontend

1. Keep the backend running.
2. In VS Code install the **Live Server** extension → right-click `frontend/index.html` → **Open with Live Server**
   (e.g. `http://127.0.0.1:5500/frontend/index.html`).
3. Create a resident account with **Create account**, and sign in with the admin account from step 7.

### API base URL

The backend address is set in **one place**, `js/config.js`:

```js
API_ORIGIN: "http://localhost:4000",   // → API base URL http://localhost:4000/api
```

Change it if the backend runs elsewhere. The backend enables CORS for every origin, so nothing else is needed.
No secrets are stored in the frontend. Uploaded files are served by the backend at `http://localhost:4000/uploads/...`.

---

## 4. Project structure

```
frontend/
├── index.html                 home (hero, feature cards, upcoming events, latest announcements)
├── login.html, signup.html    authentication
├── dashboard.html             resident dashboard
├── events.html, event.html    event list + detail (registration, feedback, admin registrants)
├── my-registrations.html      my events (upcoming / past / cancelled)
├── announcements.html, announcement.html
├── promos.html, promo.html
├── notifications.html, profile.html, forbidden.html (403)
├── admin/                     admin-only pages (data-guard="admin")
│   ├── dashboard.html  events.html  event-form.html
│   ├── announcements.html  announcement-form.html
│   ├── promos.html  promo-form.html
│   └── users.html  notifications.html
├── css/styles.css             design tokens (Royal Blue system, RGB values) + base/accessibility styles
├── assets/images/             hero-park-festival.jpg, auth-volunteers.jpg (optional photos)
└── js/
    ├── config.js              API base URL, upload limits, contact details
    ├── tailwind.config.js     maps design tokens to Tailwind classes (bg-primary, …)
    ├── core/                  foundation used by every page
    │   ├── api.js             jQuery AJAX wrapper: Bearer token, JSON, FormData uploads, errors, 401 handling
    │   ├── auth.js            global auth context: token + { id, full_name, email, role }
    │   ├── guards.js          ROLE-BASED ACCESS GUARDS (explained at the top of the file)
    │   ├── ui.js              toasts, confirm/dialog, loaders, form errors, empty/error states, icons
    │   ├── layout.js          header (nav, global search, bell drawer, profile menu) + footer
    │   ├── cache.js           short-lived list cache with invalidation
    │   ├── notify-store.js    read/unread tracking for notifications
    │   ├── utils.js           formatting, escaping (XSS-safe), file validation
    │   └── app.js             page start-up order
    ├── components/            cards, pagination, media (audio player + captions), file-field, admin-layout (sidebar, drawer, breadcrumb)
    └── pages/                 one script per page
```

---

## 5. Where role-based guards are implemented

| Layer | File | What it does |
|---|---|---|
| Page guard | `js/core/guards.js` → `run()` | Each `<body>` declares `data-guard="public \| guest \| auth \| admin"`. Visitors are sent to login; users opening `/admin/*` are sent to `forbidden.html`; signed-in users skip login/signup |
| Element guard | `js/core/guards.js` → `applyVisibility()` | Elements with `data-show-for="admin \| user \| auth \| guest"` are removed from the page for other roles |
| Role check | `js/core/auth.js` → `isAdmin()` | Reads `role` saved from the login response |
| Navigation | `js/core/layout.js` → `navLinks()`; `js/components/admin-layout.js` | Admins see *Dashboard* + admin sidebar; residents see *My Events* |
| Buttons in lists | `js/pages/event.js`, `announcement.js`, `promo.js`, `notifications.js`, `js/components/cards.js` | Edit / Delete / Publish / Registrants are only rendered when `CivicAuth.isAdmin()` |
| Login redirect | `js/pages/login.js` | A resident can't be redirected into an `/admin/` page via `?next=` |
| **Real security** | `backend/src/middlewares/auth.middleware.js` | `authenticate` + `authorize(['admin'])` reject requests with 401/403 – the frontend guards are for UX only |

Admins cannot change roles anywhere in the UI, and the signup page never sends a `role` field.

---

## 6. Token storage & errors

- After login the JWT and `{ id, full_name, email, role }` are saved in **sessionStorage** (cleared when the tab
  closes). **Remember me** uses **localStorage** instead – convenient, but anyone using the same computer stays
  signed in and any script on the page could read it. Passwords are never stored.
- The backend token lasts **1 hour**. An expired token (checked from its `exp` claim) or any **401** signs the
  user out and shows "Your session has expired".
- **403** shows "You don't have permission… contact a city administrator"; normal users who open admin pages see
  `forbidden.html`.
- Network failures show "We can't reach the CivicEvents server…" with a **Try again** button.

---

## 7. API endpoints used

| Feature | Method & endpoint | Auth |
|---|---|---|
| Sign up / sign in | `POST /api/auth/signup`, `POST /api/auth/login` | – |
| Profile | `GET`, `PATCH /api/users/profile/me` | user |
| Users | `GET /api/users`, `GET /api/users/:id`, `PATCH /api/users/:id/enable`, `PATCH /api/users/:id/disable` | admin |
| Events | `GET /api/events`, `GET /api/events/:id` | user |
| Events (manage) | `POST /api/events`, `PUT /api/events/:id` (multipart, file key `image`), `DELETE /api/events/:id` | admin |
| Registrations | `POST /api/event-registrations/register`, `POST /api/event-registrations/cancel`, `GET /api/event-registrations/my-registrations` | user |
| Registrants | `GET /api/event-registrations/event/:event_id/attendees` | admin |
| Feedback | `POST /api/event-feedback`, `PUT /api/event-feedback/:id`, `GET /api/event-feedback/my-feedback` | user |
| Feedback (all) | `GET /api/event-feedback/event/:event_id` | admin |
| Announcements | `GET /api/announcements`, `GET /api/announcements/:id` | user |
| Announcements (manage) | `POST` (multipart, key `audio`), `PUT /:id`, `PATCH /:id/publish`, `PATCH /:id/unpublish`, `DELETE /:id` | admin |
| Promos | `GET /api/promos`, `GET /api/promos/:id` | user |
| Promos (manage) | `POST` (multipart, key `video` + `caption_text`), `PUT /:id`, `PATCH /:id/publish`, `PATCH /:id/unpublish`, `DELETE /:id` | admin |
| Notifications | `GET /api/notifications`, `GET /api/notifications/:id`; `DELETE /api/notifications/:id` (admin) | user / admin |
| Dashboards | `GET /api/dashboard/me`, `GET /api/dashboard/admin` (admin) | user / admin |

---

## 8. Backend limitations found (and how the UI handles them)

The backend was used **as provided** (no backend code was changed). These mismatches with the brief were found
by reading the routes/controllers:

| # | Limitation in the provided backend | Frontend behaviour |
|---|---|---|
| 1 | **No service-request feature** (only an unused `SERVICE_TYPES` list in `src/utils/serviceTypes.js`; no routes or table) although the rubric mentions service requests | Not implemented – nothing to call. Reported here |
| 2 | **No route to create a custom broadcast notification** (`notifications.controller.create` is not routed) | Admin Notifications page explains that broadcasts are sent automatically when events/announcements/promos are created or published, with shortcuts to those forms |
| 3 | **No "mark as read" endpoint** | Read/unread is stored per user in this browser (`js/core/notify-store.js`) |
| 4 | **Events ignore `published`** on create/update and have no publish endpoint | Status shown; residents only see `published = true`; no toggle offered |
| 5 | **Event feedback list is admin-only** | Residents see and edit their own rating; admins see all ratings and the average |
| 6 | **Cancelled registrations can't be re-registered** (`ON CONFLICT DO NOTHING` → 409) | Clear message after cancelling + warning in the cancel dialog |
| 7 | **Disabled accounts can still sign in** (no `is_active` check) | Status is shown and toggled; limitation noted on the Users page |
| 8 | **Signup accepts a `role` field** | The signup page never sends it |
| 9 | **Deleting an event that has registrations fails** (foreign key without cascade) | Friendly error: "can't be deleted because people have registered" |
| 10 | Announcement **PUT ignores a new audio file**; no transcript/duration/category fields | Edit form changes title/status in place. Replacing the recording uploads it as a new announcement (POST) and deletes the old one only after the upload succeeds. Duration is read from the audio file; a "no transcript provided" note is shown |
| 11 | Promos store **caption text, not a caption file** | A WebVTT captions track is generated in the browser from `caption_text` and shown by default |
| 12 | List endpoints return unpublished items too | Filtered out for residents |
| 13 | Docs: README says `DB_PASSWORD` (code uses `DB_PASS`), `CREATE DATABASE civic-events-db` needs quotes, `db:seed` file is missing, Postman `base_url` uses port 5000 | Corrected in section 2 above |

---

## 9. Accessibility

- Semantic landmarks (`header`, `nav`, `main`, `aside`, `footer`), one `h1` per page, skip link.
- Every input has a `<label>`; errors use `aria-invalid` + `aria-describedby`; form alerts use `role="alert"`.
- Visible focus ring on everything; dialogs trap focus, close with **Esc** and return focus.
- Toasts and live counts use `aria-live`; skeletons announce "Loading…".
- Custom audio player: labelled buttons, slider with `aria-valuetext`, fallback download link.
- Videos: native controls, captions on by default, full transcript below.
- Star rating = radio group (keyboard arrows); switches use `role="switch"` + `aria-checked`; tabs use `role="tablist"`.
- Charts have `role="img"` descriptions and a **View as table** alternative.
- Colours come from the design tokens in `css/styles.css` (change them there to re-theme every page); text meets AA contrast; `prefers-reduced-motion` is respected.
- Admin sidebar drawer: opened by the menu button, closes with Esc / ✕ / tapping outside, and returns focus.
- Mobile-first layouts; header collapses into a menu; admin sidebar becomes scrollable tabs.

---

## 10. Image credits

The home page hero and the admin dashboard banner are **slideshows of places in Rwanda** (auto-advance every 4 s,
pause button, dots, pauses on hover/focus, and starts paused for users who prefer reduced motion).
The photo list lives in `js/config.js` (`PHOTOS`, `HERO_SLIDES`, `BANNER_SLIDES`).

| Photo | Photographer | Licence |
|---|---|---|
| Amahoro National Stadium, Kigali | Baraka official | [Wikimedia Commons, CC0](https://commons.wikimedia.org/wiki/File:Ikibuga_cy%27umupira_cya_sitade_amahoro.jpg) |
| Kigali skyline at sunset | Jean Claude Akarikumutima | Unsplash License |
| Nyandungu Eco-Park, Kigali (aerial) | Protais Benjamin MUGENZI | Unsplash License |
| Green hills and wetlands of Kigali | Protais Benjamin MUGENZI | Unsplash License |
| Rice fields in rural Rwanda | Mad Knoxx Deluxe | Unsplash License |
| Sunrise over the Rwandan countryside | maxime niyomwungeri | Unsplash License |
| Amahoro Stadium at night, Sober Gen run on Car Free Day, Car Free Day workout, Sober Chou youth, Youth Special Umuganda (`assets/images/slides/`, also the sign-in and sign-up panels) | Shared on Rwandan public social media (Amahoro photo: @faustinnk) | Used for this non-commercial student demo only; not licensed for reuse |

Logo, icon and favicon: `assets/images/logo.png`, `logo-icon.png`, `favicon.png`.

## 11. Testing checklist

Test with **two accounts**: the admin (section 2, step 7) and a resident created on the signup page.

| # | Test | Expected |
|---|---|---|
| 1 | Sign up with a weak password | Strength meter + rule list update; form blocks submit |
| 2 | Sign up properly | Redirect to Sign in with a success toast, email pre-filled |
| 3 | Sign up again with the same email | "An account with this email already exists" |
| 4 | Sign in with a wrong password | "The email or password is incorrect" |
| 5 | Sign in as resident | Lands on **My dashboard** |
| 6 | Resident opens `admin/dashboard.html` | **403** page |
| 7 | Open `events.html` while signed out | Redirect to Sign in → back to Events after login |
| 8 | Admin: create an event with an image | Preview before upload, progress bar, redirect to the event page, image shows |
| 9 | Admin: try an image > 2 MB or a .pdf | Error before uploading |
| 10 | Events page: search, date, location, Show filters, pagination | List updates; URL keeps the filters |
| 11 | Resident: register → cancel | Status changes, toasts, *My events* tabs update |
| 12 | Resident: rate an event (1–5 + comment) → edit it | Saved; second new rating is impossible |
| 13 | Admin: event page → Registrants + feedback average | Lists the resident and rating |
| 14 | Admin: delete an event with registrations | Friendly "can't be deleted" message |
| 15 | Admin: upload an announcement (mp3) | Toast; notification appears in the bell |
| 16 | Announcement page: play, seek, time/duration, keyboard (Tab/Space) | Works |
| 17 | Admin: toggle Published on announcements/promos | Switch flips at once; residents' lists update |
| 18 | Admin: upload a promo (mp4 ≤ 8 MB + caption text) | Promo plays with captions on; CC button toggles; transcript shown |
| 19 | Bell: unread count, drawer, mark all read, open a notification | Count changes; links open the related item |
| 20 | Admin: delete a notification | Removed (comes back if the server fails) |
| 21 | Profile: change name / change email to an existing one | Header updates / "already used" error |
| 22 | Admin users: search, view, disable/enable, own row disabled | Works; no role control anywhere |
| 23 | Admin dashboard: numbers + charts, Refresh after creating content | Values update |
| 24 | Stop the backend and reload a list | "Connection problem" + **Try again** |
| 25 | Wait 1 hour (or delete the token in DevTools) and click something | Signed out with "session expired" |
| 26 | Resize to phone width | Menu button, stacked cards, scrollable admin tabs |
| 27 | Keyboard only (Tab / Shift+Tab / Enter / Esc) through a page | Every control reachable with a visible focus ring |

---

## 12. Demo video plan (5–7 minutes)

**Watch the demo video:** [https://drive.google.com/file/d/17rn7pLDZOiHt_KDF4X1eJl3PXAm3RLBj/view?usp=sharing](https://drive.google.com/file/d/17rn7pLDZOiHt_KDF4X1eJl3PXAm3RLBj/view?usp=sharing)

1. **Setup (1 min):** `.env`, migration in psql (`\dt`), `npm run dev` showing *Connected to PostgreSQL*, `js/config.js` base URL.
2. **Resident (2 min):** signup with strength meter → login → events search/filter → event → register → My events → cancel → rate → announcement audio → promo with captions → notifications → profile email conflict.
3. **Admin (2.5 min):** login → dashboard charts → create event with image → registrants & feedback → upload announcement & promo, toggle publish → users enable/disable (no role change) → delete notification.
4. **Guards & errors (1 min):** resident opening an admin URL → 403; `guards.js` comments; backend stopped → retry state.
