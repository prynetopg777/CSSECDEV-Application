import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { writeAuditLog } from "../lib/audit.js";

export function validateBody<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      await writeAuditLog(req, "VALIDATION_FAILURE", "Request body validation failed", {
        userId: req.session.userId ?? null,
        metadata: { fields: Object.keys(fields) },
      });
      return res.status(400).json({ error: "Invalid input." });
    }
    req.body = parsed.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      await writeAuditLog(req, "VALIDATION_FAILURE", "Query validation failed", {
        userId: req.session.userId ?? null,
        metadata: { issues: parsed.error.issues.map((i) => i.path.join(".")) },
      });
      return res.status(400).json({ error: "Invalid input." });
    }
    (req as Request & { validatedQuery: T }).validatedQuery = parsed.data;
    next();
  };
}
