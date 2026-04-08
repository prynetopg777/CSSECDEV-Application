import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAuth, requireRoles } from "../middleware/authorize.js";
import { validateBody } from "../middleware/validate.js";
import { writeAuditLog } from "../lib/audit.js";

export const ordersRouter = Router();

const orderBody = z.object({
  productName: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(1_000_000),
  notes: z.string().max(2000).optional().default(""),
});

ordersRouter.get("/", requireAuth, async (req, res) => {
  const u = (req as typeof req & { user: { id: string; role: Role } }).user;

  if (u.role === Role.CUSTOMER) {
    const orders = await prisma.order.findMany({
      where: { userId: u.id },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ orders });
  }

  if (u.role === Role.PRODUCT_MANAGER || u.role === Role.ADMIN) {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true, id: true } } },
    });
    return res.json({ orders });
  }

  return res.status(403).json({ error: "You do not have permission to perform this action." });
});

ordersRouter.post("/", requireAuth, requireRoles(Role.CUSTOMER), validateBody(orderBody), async (req, res) => {
  const body = req.body as z.infer<typeof orderBody>;
  const u = (req as typeof req & { user: { id: string } }).user;

  const order = await prisma.order.create({
    data: {
      userId: u.id,
      productName: body.productName,
      quantity: body.quantity,
      notes: body.notes ?? "",
    },
  });

  await writeAuditLog(req, "SYSTEM", `Order created: ${order.id}`, {
    userId: u.id,
    metadata: { orderId: order.id },
  });

  res.status(201).json({ order });
});

ordersRouter.patch(
  "/:id",
  requireAuth,
  validateBody(orderBody.partial()),
  async (req, res) => {
    const body = req.body as z.infer<ReturnType<typeof orderBody.partial>>;
    const u = (req as typeof req & { user: { id: string; role: Role } }).user;

    const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Not found." });
    }

    if (u.role === Role.CUSTOMER) {
      if (existing.userId !== u.id) {
        await writeAuditLog(req, "ACCESS_DENIED", "Customer tried to edit foreign order", {
          userId: u.id,
          metadata: { orderId: req.params.id },
        });
        return res.status(403).json({ error: "You do not have permission to perform this action." });
      }
    } else if (u.role === Role.PRODUCT_MANAGER) {
      /* PM can edit any order */
    } else if (u.role === Role.ADMIN) {
      await writeAuditLog(req, "ACCESS_DENIED", "Admin cannot modify orders", { userId: u.id });
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: body,
    });

    await writeAuditLog(req, "SYSTEM", `Order updated: ${order.id}`, { userId: u.id });
    res.json({ order });
  }
);

ordersRouter.delete("/:id", requireAuth, async (req, res) => {
  const u = (req as typeof req & { user: { id: string; role: Role } }).user;
  const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    return res.status(404).json({ error: "Not found." });
  }

  if (u.role === Role.CUSTOMER) {
    if (existing.userId !== u.id) {
      await writeAuditLog(req, "ACCESS_DENIED", "Customer tried to delete foreign order", {
        userId: u.id,
      });
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
  } else if (u.role === Role.PRODUCT_MANAGER) {
    /* ok */
  } else {
    await writeAuditLog(req, "ACCESS_DENIED", "Admin cannot delete orders", { userId: u.id });
    return res.status(403).json({ error: "You do not have permission to perform this action." });
  }

  await prisma.order.delete({ where: { id: req.params.id } });
  await writeAuditLog(req, "SYSTEM", `Order deleted: ${req.params.id}`, { userId: u.id });
  res.json({ ok: true });
});
