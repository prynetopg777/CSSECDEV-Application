import type { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "../db.js";
import { writeAuditLog } from "../lib/audit.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required." });
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: "Authentication required." });
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return res.status(403).json({ error: "Account is temporarily locked." });
  }
  (req as Request & { user: typeof user }).user = user;
  next();
}

export function requireRoles(...allowed: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const u = (req as Request & { user?: { id: string; role: Role } }).user;
    if (!u) {
      return res.status(401).json({ error: "Authentication required." });
    }
    if (!allowed.includes(u.role)) {
      await writeAuditLog(req, "ACCESS_DENIED", `Role ${u.role} denied for route`, {
        userId: u.id,
        metadata: { allowedRoles: allowed },
      });
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    next();
  };
}
