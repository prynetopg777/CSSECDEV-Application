# Secure Web Development Checklist Mapping

This document maps each checklist item from `specss.md` to the current implementation in this repository.

## 1.0 Pre-demo Requirements

### 1.1 Accounts (at least 1 per user type)

- **1.1.1 Website Administrator**: Seeded in `server/prisma/seed.ts` as `admin@demo.local`.
- **1.1.2 Product Manager**: Seeded in `server/prisma/seed.ts` as `pm@demo.local`.
- **1.1.3 Customer**: Seeded in `server/prisma/seed.ts` as `customer@demo.local`.

## 2.0 Demo Requirements

### 2.1 Authentication

- **2.1.1 Require authentication for all non-public pages/resources**
  - Backend: `requireAuth` in `server/src/middleware/authorize.ts` applied to protected APIs.
  - Frontend: `ProtectedRoute` in `client/src/components/ProtectedRoute.tsx`.
  - Public routes are limited to login/register/reset in `client/src/App.tsx` and auth endpoints in `server/src/routes/auth.ts`.

- **2.1.2 Authentication controls fail securely**
  - Missing/invalid session returns 401 in `server/src/middleware/authorize.ts`.
  - Denied actions return 403 with generic messages in authz middleware and routes.

- **2.1.3 Strong one-way salted password hashes only**
  - Argon2 hashing in `server/src/lib/passwordService.ts`.
  - Password and security answers stored as hashes in DB.

- **2.1.4 Generic auth failure response**
  - Login/reset return `Invalid username and/or password.` in `server/src/routes/auth.ts`.

- **2.1.5 Password complexity**
  - Enforced in `server/src/lib/passwordPolicy.ts` (upper, lower, digit, special).

- **2.1.6 Password length**
  - `PASSWORD_MIN_LENGTH = 12` in `server/src/config.ts`, enforced via password policy.

- **2.1.7 Password entry obscured on screen**
  - Password fields use `type="password"` in:
    - `client/src/pages/Login.tsx`
    - `client/src/pages/Register.tsx`
    - `client/src/pages/Password.tsx`
    - `client/src/pages/ResetPassword.tsx`

- **2.1.8 Account disabling after failed login attempts**
  - `MAX_LOGIN_ATTEMPTS = 5` and `LOCKOUT_MS` in `server/src/config.ts`.
  - Lockout logic in `server/src/routes/auth.ts`.

- **2.1.9 Password reset questions support random answers**
  - Registration requires security question + answer in `server/src/routes/auth.ts`.
  - Answers are hashed; UI guidance is shown in `client/src/pages/Register.tsx`.

- **2.1.10 Prevent password reuse**
  - Previous hashes tracked in `PasswordHistory` model and checked by `wasPasswordUsedBefore` in `server/src/lib/passwordService.ts`.
  - Enforced in password change/reset routes in `server/src/routes/auth.ts`.

- **2.1.11 Password must be at least 1 day old before change**
  - `PASSWORD_MIN_AGE_MS` in `server/src/config.ts`.
  - Enforced in `POST /api/auth/password` in `server/src/routes/auth.ts`.

- **2.1.12 Report last successful/unsuccessful account use on next login**
  - Backend returns previous `lastSuccessfulLoginAt` and `lastFailedLoginAt` in login response (`server/src/routes/auth.ts`).
  - Frontend displays it on dashboard via `sessionStorage` (`client/src/pages/Login.tsx`, `client/src/pages/Home.tsx`).

- **2.1.13 Re-authenticate before critical operations (password change)**
  - `POST /api/auth/password` requires current password verification in `server/src/routes/auth.ts`.

### 2.2 Authorization / Access Control

- **2.2.1 Single site-wide component for authorization checks**
  - Centralized in `server/src/middleware/authorize.ts` (`requireAuth`, `requireRoles`).

- **2.2.2 Access controls fail securely**
  - Unauthorized/forbidden requests return 401/403; no fallback allow behavior.

- **2.2.3 Enforce business logic flows**
  - Customer can only mutate own orders in `server/src/routes/orders.ts`.
  - Product manager can manage products in `server/src/routes/products.ts`.
  - Only admin can manage users and view logs in `server/src/routes/adminUsers.ts` and `server/src/routes/adminLogs.ts`.

### 2.3 Data Validation

- **2.3.1 Validation failures reject input**
  - Zod validation middleware in `server/src/middleware/validate.ts` returns 400 on invalid input.

- **2.3.2 Validate data range**
  - Numeric ranges enforced with Zod in:
    - `server/src/routes/products.ts` (price, stock)
    - `server/src/routes/orders.ts` (quantity)

- **2.3.3 Validate data length**
  - String length constraints in auth/product/order schemas (e.g. email, question, notes) in route files.

### 2.4 Error Handling and Logging

- **2.4.1 Error handlers do not expose debug/stack info**
  - Central error handler in `server/src/middleware/errorHandler.ts`.
  - In production, returns generic `Something went wrong.`.

- **2.4.2 Generic error messages and custom error pages**
  - Generic API messages returned across auth/validation/authorization paths.
  - Frontend custom page for unknown routes: `client/src/pages/NotFound.tsx`.

- **2.4.3 Logging supports success and failure security events**
  - `writeAuditLog` utility in `server/src/lib/audit.ts`.
  - Success/failure events logged in auth/admin/order/product flows.

- **2.4.4 Restrict log access to website administrators**
  - `adminLogsRouter` is protected by `requireAuth + requireRoles(Role.ADMIN)` in `server/src/routes/adminLogs.ts`.
  - Frontend admin logs page in `client/src/pages/AdminLogs.tsx`.

- **2.4.5 Log all input validation failures**
  - Validation middleware logs `VALIDATION_FAILURE` in `server/src/middleware/validate.ts`.

- **2.4.6 Log all authentication attempts (especially failures)**
  - Login success/failure and reset failures logged in `server/src/routes/auth.ts`.

- **2.4.7 Log all access control failures**
  - `requireRoles` logs `ACCESS_DENIED` in `server/src/middleware/authorize.ts`.
  - Additional access-denied business-rule cases logged in `server/src/routes/orders.ts` and `server/src/routes/adminUsers.ts`.

## Notes / Assumptions for Demo

- Seeded demo accounts are created by running `npm run db:seed`.
- API port should match Vite proxy target during dev (`client/src/vite.config.ts` vs `server/.env` `PORT`).
- Session store DB is separated from Prisma app DB (`server/prisma/sessions.db`) to avoid migration drift.
