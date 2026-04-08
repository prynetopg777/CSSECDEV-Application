import type { Request, Response, NextFunction } from "express";
import { IS_PRODUCTION } from "../config.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  if (res.headersSent) return;
  const message = IS_PRODUCTION ? "Something went wrong." : err instanceof Error ? err.message : "Error";
  res.status(500).json({ error: message });
}
