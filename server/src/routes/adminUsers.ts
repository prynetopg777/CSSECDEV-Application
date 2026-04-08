import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAuth, requireRoles } from "../middleware/authorize.js";
import { validateBody } from "../middleware/validate.js";
import { writeAuditLog } from "../lib/audit.js";
import { validatePasswordComplexity } from "../lib/passwordPolicy.js";
import { hashPassword } from "../lib/passwordService.js";

export const adminUsersRouter = Router();

adminUsersRouter.use(requireAuth, requireRoles(Role.ADMIN));

const createUserSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(500),
  role: z.enum([Role.ADMIN, Role.PRODUCT_MANAGER]),
  securityQuestion: z.string().min(20).max(500),
  securityAnswer: z.string().min(10).max(500),
});

const patchUserSchema = z.object({
  role: z.nativeEnum(Role),
});

adminUsersRouter.get("/", async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      lockedUntil: true,
      failedLoginAttempts: true,
    },
  });
  res.json({ users });
});

adminUsersRouter.post("/", validateBody(createUserSchema), async (req, res) => {
  const body = req.body as z.infer<typeof createUserSchema>;
  const email = body.email.toLowerCase();
  const pwdErr = validatePasswordComplexity(body.password);
  if (pwdErr) {
    await writeAuditLog(req, "VALIDATION_FAILURE", "Admin create user — password policy", {
      userId: req.session.userId!,
    });
    return res.status(400).json({ error: pwdErr });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return res.status(400).json({ error: "Invalid input." });
  }

  const passwordHash = await hashPassword(body.password);
  const securityAnswerHash = await hashPassword(body.securityAnswer.trim());

  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: body.role,
      securityQuestion: body.securityQuestion.trim(),
      securityAnswerHash,
      passwordChangedAt: new Date(),
    },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  await writeAuditLog(req, "USER_CREATED", `User created: ${created.email}`, {
    userId: req.session.userId!,
    metadata: { targetId: created.id, role: created.role },
  });

  res.status(201).json({ user: created });
});

adminUsersRouter.patch("/:id", validateBody(patchUserSchema), async (req, res) => {
  const { id } = req.params;
  const body = req.body as z.infer<typeof patchUserSchema>;
  const adminId = req.session.userId!;

  if (id === adminId && body.role !== Role.ADMIN) {
    await writeAuditLog(req, "ACCESS_DENIED", "Admin cannot demote self", { userId: adminId });
    return res.status(403).json({ error: "You do not have permission to perform this action." });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return res.status(404).json({ error: "Not found." });
  }

  if (target.role === Role.ADMIN && body.role !== Role.ADMIN) {
    const otherAdmins = await prisma.user.count({
      where: { role: Role.ADMIN, id: { not: id } },
    });
    if (otherAdmins < 1) {
      await writeAuditLog(req, "ACCESS_DENIED", "Cannot demote last administrator", {
        userId: adminId,
      });
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
  }

  const before = target.role;
  const updated = await prisma.user.update({
    where: { id },
    data: { role: body.role },
    select: { id: true, email: true, role: true },
  });

  await writeAuditLog(req, "USER_ROLE_CHANGED", `Role ${before} -> ${updated.role}`, {
    userId: adminId,
    metadata: { targetId: id },
  });

  res.json({ user: updated });
});

adminUsersRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const adminId = req.session.userId!;

  if (id === adminId) {
    await writeAuditLog(req, "ACCESS_DENIED", "Admin cannot delete self", { userId: adminId });
    return res.status(403).json({ error: "You do not have permission to perform this action." });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return res.status(404).json({ error: "Not found." });
  }

  if (target.role === Role.ADMIN) {
    const otherAdmins = await prisma.user.count({
      where: { role: Role.ADMIN, id: { not: id } },
    });
    if (otherAdmins < 1) {
      await writeAuditLog(req, "ACCESS_DENIED", "Cannot delete last admin", { userId: adminId });
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
  }

  await prisma.user.delete({ where: { id } });

  await writeAuditLog(req, "USER_DELETED", `User deleted: ${target.email}`, {
    userId: adminId,
    metadata: { targetId: id },
  });

  res.json({ ok: true });
});
