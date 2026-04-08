# Secure WebApp

Full-stack web application built for **CSSECDV-style** secure development requirements (see `specss.md` in this repo). It implements **three roles**—**Administrator**, **Product Manager**, and **Customer**—with session-based authentication, centralized authorization, strict server-side validation, Argon2 password hashing, account lockout, password policy (complexity, reuse prevention, minimum age), audit logging (admin-only), and a React SPA front end.

## Tech stack

| Layer | Technology |
|--------|------------|
| API | Node.js, Express, TypeScript |
| Data | Prisma ORM, SQLite (`server/prisma/dev.db`) |
| Auth | `express-session` with SQLite-backed store (`better-sqlite3-session-store`), Argon2 |
| Validation | Zod (invalid requests are **rejected**, not “sanitized into” acceptance) |
| UI | React 18, Vite, React Router |

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+

## Quick start

### 1. Install dependencies

From the repository root:

```bash
npm install
```

### 2. Environment variables

Copy the example env file and adjust values:

```bash
copy server\.env.example server\.env
```

On macOS/Linux:

```bash
cp server/.env.example server/.env
```

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLite file (default `file:./dev.db` relative to `server/prisma/`) |
| `SESSION_SECRET` | Secret for signing session cookies—**use a long random string in production** |
| `PORT` | API port (default `3000`) |
| `NODE_ENV` | `development` or `production` |

### 3. Database: migrate and seed

From the **repository root**:

```bash
npm run db:migrate
npm run db:seed
```

- **Migrate** applies Prisma migrations (creates/updates `server/prisma/dev.db`).
- **Seed** creates demo users, a sample product, and an initial audit entry.

To apply existing migrations **without** the interactive `migrate dev` prompt (e.g. deployment), from `server/`:

```bash
cd server
npx prisma migrate deploy
npx prisma db seed
```

### 4. Run in development

From the **repository root**:

```bash
npm run dev
```

- **Frontend:** http://localhost:5173 (Vite dev server; proxies `/api` to the API)
- **API:** http://127.0.0.1:3000

Sign in through the UI. The browser stores the session cookie for `localhost` via the proxy.

### 5. Production-style build

From the **repository root**:

```bash
npm run build
```

Then start the API (serves the built SPA from `client/dist` when `NODE_ENV=production`):

```bash
cd server
set NODE_ENV=production
node dist/index.js
```

On macOS/Linux:

```bash
cd server
NODE_ENV=production node dist/index.js
```

Open the app at `http://localhost:3000` (or your configured `PORT`). Set a strong `SESSION_SECRET` and avoid running with default secrets.

## Demo accounts (after seed)

All use the same password for convenience in class demos:

| Email | Role | Password |
|-------|------|----------|
| `admin@demo.local` | Administrator | `Demo#Pass12345` |
| `pm@demo.local` | Product Manager | `Demo#Pass12345` |
| `customer@demo.local` | Customer | `Demo#Pass12345` |

Seeded accounts have a password age older than one day so **change password** can be demonstrated immediately (subject to policy).

**Password reset (demo):** seeded users share the same question text (*“What is your unique recovery phrase? (use random words)”*). The **answers** are random phrases stored only as hashes in the database; to demo reset, open `server/prisma/seed.ts` and use the plaintext answers defined there (demo use only).

## What each role can do

- **Administrator**
  - Create **Administrator** and **Product Manager** accounts (with security Q&A for recovery).
  - Change user roles; delete users (cannot delete self; cannot remove the last admin).
  - View **audit logs** with optional filters (event type, time range, limit).
  - View products and orders **read-only** (mutations are reserved for managers/customers as implemented).
- **Product Manager**
  - Full **CRUD** on **products**.
  - View and **edit/delete** all **orders** (support / fulfillment style).
- **Customer**
  - **Register** (creates `CUSTOMER` only) with password policy and security Q&A.
  - **CRUD** on **own orders** only.
- **All authenticated users**
  - **Change password** (requires current password; enforces complexity, no reuse, 24-hour minimum age).
  - **Logout**.

Public (unauthenticated) pages: login, register, password reset (security answer + new password).

## Security behavior (summary)

- **Sessions** persisted in SQLite (same DB file as the app data) via `better-sqlite3-session-store`.
- **Passwords** stored only as Argon2 hashes; optional **password history** to block reuse.
- **Login** failures use a single generic message; repeated failures trigger **temporary lockout** (see `server/src/config.ts`).
- **Authorization** is enforced in one place (`server/src/middleware/authorize.ts`) with `requireAuth` and `requireRoles`.
- **Validation** uses Zod; failures return generic client messages where appropriate and are **logged** in the audit trail (without secrets).
- **Errors** in production avoid leaking stack traces in JSON responses (`server/src/middleware/errorHandler.ts`).

## Project layout

```
WebApp/
├── client/                 # Vite + React SPA
│   ├── src/
│   │   ├── api.ts          # fetch helpers (credentials: include)
│   │   ├── App.tsx         # routes
│   │   ├── contexts/       # auth context
│   │   ├── components/     # layout, protected route
│   │   └── pages/          # login, register, admin, products, orders, etc.
│   └── dist/               # production build output
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── src/
│       ├── index.ts        # entry
│       ├── app.ts          # Express app, session, static SPA in production
│       ├── middleware/     # auth, validation, errors
│       ├── routes/         # auth, admin users/logs, products, orders
│       └── lib/            # audit, password policy, hashing helpers
├── package.json            # workspaces + dev/build/db scripts
├── specss.md               # course specification / checklist reference
└── README.md               # this file
```

## Troubleshooting

- **`EADDRINUSE` on port 3000** — Another process is using the port. Stop it or set a different `PORT` in `server/.env`.
- **401 on every API call after login** — Ensure you use the Vite dev URL (`http://localhost:5173`) so `/api` is proxied and cookies stay on the same site; or in production, use the same origin as the server that set the cookie.
- **Prisma errors after pulling changes** — Run `npm run db:migrate` (or `npx prisma migrate deploy` in `server/`) and `npx prisma generate` in `server/` if the schema changed.

## Scripts reference (root)

| Script | Description |
|--------|-------------|
| `npm run dev` | Runs API (watch) and Vite together |
| `npm run build` | Builds server `dist/` and client `dist/` |
| `npm run db:migrate` | `prisma migrate dev` in `server` |
| `npm run db:seed` | Runs Prisma seed in `server` |
