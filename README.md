# CivicEvents – Accessible City Events & Services Portal

Advanced Frontend Development summative. A responsive, accessible frontend built with **HTML5, Tailwind CSS and jQuery**
(Chart.js for admin charts) on top of the provided Node.js/Express + PostgreSQL backend.

| Folder | Contents |
|---|---|
| [`frontend/`](frontend/) | The application I built – **full documentation in [frontend/README.md](frontend/README.md)** |
| [`backend/`](backend/) | Provided API (used unchanged) – original setup guide in [backend/README.md](backend/README.md) |
| [`video-demo/`](video-demo/) | Link to the demonstration video ([watch on Google Drive](https://drive.google.com/file/d/17rn7pLDZOiHt_KDF4X1eJl3PXAm3RLBj/view?usp=sharing)) |

## Quick start

1. **Database** – install PostgreSQL, then create the database (quotes are required because of the hyphens):
   ```sql
   CREATE DATABASE "civic-events-db";
   ```
2. **Tables** – from the project folder:
   ```bash
   psql -U postgres -d civic-events-db -f backend/migrations/001_create_tables.sql
   ```
3. **Environment** – set `backend/.env` (the backend reads `DB_PASS`):
   ```
   DB_USER=postgres
   DB_PASS=your_postgres_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=civic-events-db
   JWT_SECRET=any_long_random_string
   ```
4. **API** – `cd backend`, `npm install`, `npm run dev` → `http://localhost:4000` (check `http://localhost:4000/health`).
5. **First admin** – the signup page only creates normal users, so create one admin through the API (Postman or PowerShell):
   ```
   POST http://localhost:4000/api/auth/signup
   { "full_name": "City Admin", "email": "admin@civicevents.test", "password": "Admin@2026", "role": "admin" }
   ```
6. **Frontend** – open `frontend/index.html` with the VS Code **Live Server** extension
   (e.g. `http://127.0.0.1:5500/frontend/index.html`).

**API base URL:** `http://localhost:4000/api`, set in one place – [`frontend/js/config.js`](frontend/js/config.js).

## Where to find things

- Features, project structure, token storage, API endpoints used: [frontend/README.md](frontend/README.md)
- **Role-based access guards:** [`frontend/js/core/guards.js`](frontend/js/core/guards.js) (table of every guard location in frontend/README.md §5)
- Backend limitations found (e.g. no service-request endpoints) and how the UI handles them: frontend/README.md §8
- Testing checklist: frontend/README.md §11
