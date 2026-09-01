# CivCo BTP

Multi-tenant ERP for construction (BTP) companies. The platform isolates each entity (tenant), exposes a public marketing site with lead capture, and provides a Superadmin console for provisioning, homepage CMS, and demo access.

| Layer | Stack |
|---|---|
| API | Laravel 13 (PHP 8.3+), Sanctum session cookies |
| SPA | React 19, Vite 8, Tailwind CSS 4 |
| Data | MySQL / MariaDB (SQLite supported locally) |
| Optional services | Document renderer (`:8081`), notification dispatcher (`:8082`) |

```
civco-btp-main/
├── backend/          Laravel API (copy .env.example → .env here)
├── frontend/         React SPA (dev server proxies /api to Laravel)
├── services/         Optional document & notification microservices
└── infra/            Docker Compose for those services
```

---

## Project overview

**Multi-entity management.** Platform Superadmins create tenants (subdomain, branding, SMTP, admins). Each company works in its own data scope: users cannot read another tenant’s records.

**BTP operations.** Projects and site map, clients, quotes, delivery forms, invoices, expenses, tasks, tickets, contracts/amendments, document templates, and a client portal for signatures and follow-up.

**Per-entity SMTP.** Tenant mail host, port, credentials, and from-address are stored on the entity and applied when sending branded mail (`TenantMailConfigurator`). Application-wide defaults stay in `.env`.

**Stealth keybind.** Authenticated users can configure a keyboard shortcut on their profile to toggle stealth mode (sensitive client data hidden in the UI).

**Public lead form.** The homepage **Demander une démo** form posts to `POST /api/v1/demo/requests`. Superadmins review leads at `/super-admin/demo-requests`.

**Superadmin CMS.** `/super-admin/homepage` edits hero copy and background, feature cards, and partner logos for the public landing marquee.

---

## System requirements

- PHP **8.3+** (extensions: `bcmath`, `ctype`, `curl`, `fileinfo`, `json`, `mbstring`, `openssl`, `pdo`, `pdo_mysql` or `pdo_sqlite`, `tokenizer`, `xml`, `zip`)
- Composer 2
- Node.js **20+** and npm
- MySQL 8 / MariaDB 10.11+ (or SQLite for local only)
- Optional: Docker, for document/notification services

---

## Installation & environment setup

### 1. Clone and install dependencies

```bash
git clone <repository-url> civco-btp-main
cd civco-btp-main

cd backend
composer install

cd ../frontend
npm install
```

### 2. Environment files

Laravel reads **`backend/.env`**. From the repository root:

```bash
cp .env.example backend/.env
# or:  cp backend/.env.example backend/.env
```

Frontend (optional; leave `VITE_API_URL` empty so Vite proxies `/api`):

```bash
cp frontend/.env.example frontend/.env
```

Generate the application key:

```bash
cd backend
php artisan key:generate
```

### 3. Database

Create an empty MySQL/MariaDB schema matching `DB_DATABASE`, then:

```bash
cd backend
php artisan migrate --seed
php artisan storage:link
```

`migrate --seed` runs permissions, roles, the platform Superadmin (from `SUPERADMIN_*`), and demo tenants.

For SQLite instead of MySQL, set in `backend/.env`:

```env
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
```

Then create the file (`touch database/database.sqlite` on Unix, or an empty file on Windows) before migrating.

### 4. Run locally

Terminal 1 — API:

```bash
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

Terminal 2 — queue (notifications, mail jobs):

```bash
cd backend
php artisan queue:listen --tries=1
```

Terminal 3 — SPA:

```bash
cd frontend
npm run dev
```

Open **http://127.0.0.1:5173/**. The Vite server proxies `/api`, `/sanctum`, and `/storage` to port 8000.

---

## Database migrations & seeding

```bash
cd backend
php artisan migrate              # schema only
php artisan migrate --seed       # schema + seeders
php artisan db:seed              # seeders only (existing database)
```

Seed order includes `PermissionSeeder`, `RoleSeeder`, `PlatformSuperAdminSeeder`, then multi-tenant demo data.

Use a **unique** `SUPERADMIN_EMAIL`. If it matches a seeded tenant login (for example `admin@civco.ma` on CivCo), the tenant user is stored under a different address so the unique email constraint is kept.

---

## Superadmin credentials

Set these in `backend/.env` **before** the first seed:

```env
SUPERADMIN_NAME="Super Admin"
SUPERADMIN_EMAIL=admin@civco.ma
SUPERADMIN_PASSWORD=ChangeThisPassword123!
```

The seeder hashes the password and assigns the platform Superadmin role (full permission set, `tenant_id` null).

Reset the live Superadmin from the terminal (masked password prompt):

```bash
cd backend
php artisan app:reset-superadmin
```

After seeding, typical local logins (tenant demo data) still use `password` unless you changed them:

| Account | Email | Notes |
|---|---|---|
| Platform Superadmin | value of `SUPERADMIN_EMAIL` | Password from `.env` or `app:reset-superadmin` |
| CivCo admin | `admin@civco.ma` | Tenant administrator (`password`) when that email was free |

Superadmin UI: `/super-admin/overview`, homepage CMS, demo codes, demo requests.

---

## Production deployment & caching

1. Set `APP_ENV=production`, `APP_DEBUG=false`, a real `APP_KEY`, HTTPS `APP_URL`, and production `DB_*` / `MAIL_*`.
2. Build the SPA and serve `frontend/dist` behind the same origin as the API (or set `VITE_API_URL` at build time).
3. Point the web root at `backend/public`, run `php artisan storage:link`, and configure the queue worker (`queue:work`).
4. Enable tenant subdomains when ready: `TENANCY_SUBDOMAIN_ROUTING=true` and `TENANCY_BASE_DOMAIN`.
5. Cache config, routes, and views **on the server** after `.env` is final:

```bash
cd backend
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

To pick up `.env` changes, clear first:

```bash
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

Do not commit `.env`, `vendor/`, `node_modules/`, SQLite files, or uploaded files under `storage/` / `public/storage`.

---

## Optional microservices

Leave `DOCUMENT_RENDERER_URL` and `NOTIFICATION_DISPATCHER_URL` empty to render documents and send notifications inside the monolith.

To run the split services:

```bash
cd infra
docker compose up --build
```

Then set the URLs and shared secrets in `backend/.env` (see `infra/docker-compose.yml`).

---

## Tests

```bash
cd backend
php artisan test
```
