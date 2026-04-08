import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAuth, requireRoles } from "../middleware/authorize.js";
import { validateBody } from "../middleware/validate.js";
import { writeAuditLog } from "../lib/audit.js";

export const productsRouter = Router();

const productBody = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  price: z.number().min(0).max(1_000_000),
  stock: z.number().int().min(0).max(1_000_000_000),
});

productsRouter.get("/", requireAuth, requireRoles(Role.PRODUCT_MANAGER, Role.ADMIN), async (_req, res) => {
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  res.json({ products });
});

productsRouter.post(
  "/",
  requireAuth,
  requireRoles(Role.PRODUCT_MANAGER),
  validateBody(productBody),
  async (req, res) => {
    const body = req.body as z.infer<typeof productBody>;
    const p = await prisma.product.create({ data: body });
    await writeAuditLog(req, "SYSTEM", `Product created: ${p.name}`, {
      userId: req.session.userId!,
      metadata: { productId: p.id },
    });
    res.status(201).json({ product: p });
  }
);

productsRouter.patch(
  "/:id",
  requireAuth,
  requireRoles(Role.PRODUCT_MANAGER),
  validateBody(productBody.partial()),
  async (req, res) => {
    const body = req.body as z.infer<ReturnType<typeof productBody.partial>>;
    try {
      const p = await prisma.product.update({
        where: { id: req.params.id },
        data: body,
      });
      await writeAuditLog(req, "SYSTEM", `Product updated: ${p.id}`, {
        userId: req.session.userId!,
      });
      res.json({ product: p });
    } catch {
      res.status(404).json({ error: "Not found." });
    }
  }
);

productsRouter.delete("/:id", requireAuth, requireRoles(Role.PRODUCT_MANAGER), async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    await writeAuditLog(req, "SYSTEM", `Product deleted: ${req.params.id}`, {
      userId: req.session.userId!,
    });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Not found." });
  }
});
