import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PORT = Number(process.env.PORT) || 3000;
export const NODE_ENV = process.env.NODE_ENV ?? "development";
export const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-only-change-me";
export const IS_PRODUCTION = NODE_ENV === "production";

/** SQLite file used by Prisma (same file as DATABASE_URL file:./dev.db) */
export const SQLITE_FILE_PATH = path.join(__dirname, "../prisma/dev.db");
/** Separate SQLite file for session store (avoid Prisma schema drift). */
export const SESSION_SQLITE_FILE_PATH = path.join(__dirname, "../prisma/sessions.db");

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;
export const PASSWORD_MIN_AGE_MS = 24 * 60 * 60 * 1000;
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_HISTORY_LIMIT = 5;
