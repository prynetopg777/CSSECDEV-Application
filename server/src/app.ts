import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import session from "express-session";
import Database from "better-sqlite3";
import sqliteStoreFactory from "better-sqlite3-session-store";
import { SESSION_SECRET, IS_PRODUCTION, SESSION_SQLITE_FILE_PATH } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { adminUsersRouter } from "./routes/adminUsers.js";
import { adminLogsRouter } from "./routes/adminLogs.js";
import { productsRouter } from "./routes/products.js";
import { ordersRouter } from "./routes/orders.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SQLiteStore = sqliteStoreFactory(session);

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: IS_PRODUCTION
        ? false
        : ["http://localhost:5173", "http://127.0.0.1:5173"],
      credentials: true,
    })
  );
  app.use(express.json({ limit: "512kb" }));

  const sessionDb = new Database(SESSION_SQLITE_FILE_PATH);
  app.use(
    session({
      store: new SQLiteStore({
        client: sessionDb,
        expired: {
          clear: true,
          intervalMs: 15 * 60 * 1000,
        },
      }),
      name: "sid",
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: IS_PRODUCTION ? "strict" : "lax",
        secure: IS_PRODUCTION,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/admin/users", adminUsersRouter);
  app.use("/api/admin/logs", adminLogsRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/orders", ordersRouter);

  if (IS_PRODUCTION) {
    const clientDist = path.join(__dirname, "../../client/dist");
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  app.use(errorHandler);
  return app;
}
