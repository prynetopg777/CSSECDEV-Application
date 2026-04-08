import type { Request } from "express";
import { prisma } from "../db.js";

export type AuditEventType =
  | "AUTH_SUCCESS"
  | "AUTH_FAILURE"
  | "ACCESS_DENIED"
  | "VALIDATION_FAILURE"
  | "PASSWORD_CHANGE"
  | "USER_CREATED"
  | "USER_ROLE_CHANGED"
  | "USER_DELETED"
  | "SYSTEM";

function clientMeta(req: Request) {
  const ip = req.ip ?? req.socket.remoteAddress ?? undefined;
  const userAgent = typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined;
  return { ip, userAgent };
}

export async function writeAuditLog(
  req: Request,
  eventType: AuditEventType,
  message: string,
  options: { userId?: string | null; metadata?: Record<string, unknown> } = {}
) {
  const { ip, userAgent } = clientMeta(req);
  try {
    await prisma.auditLog.create({
      data: {
        userId: options.userId ?? null,
        eventType,
        message,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
      },
    });
  } catch (e) {
    console.error("audit log write failed", e);
  }
}
