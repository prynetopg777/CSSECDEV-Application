import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAuth, requireRoles } from "../middleware/authorize.js";
import { validateQuery } from "../middleware/validate.js";

export const adminLogsRouter = Router();

adminLogsRouter.use(requireAuth, requireRoles(Role.ADMIN));

const logsQuerySchema = z.object({
  eventType: z.string().max(64).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

adminLogsRouter.get("/", validateQuery(logsQuerySchema), async (req, res) => {
  const q = (req as typeof req & { validatedQuery: z.infer<typeof logsQuerySchema> }).validatedQuery;
  const limit = q.limit ?? 100;

  const where: {
    eventType?: string;
    createdAt?: { gte?: Date; lte?: Date };
  } = {};

  if (q.eventType) where.eventType = q.eventType;
  if (q.from || q.to) {
    where.createdAt = {};
    if (q.from) where.createdAt.gte = new Date(q.from);
    if (q.to) where.createdAt.lte = new Date(q.to);
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  res.json({ logs });
});
