import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../db.js";
import {
  LOCKOUT_MS,
  MAX_LOGIN_ATTEMPTS,
  PASSWORD_MIN_AGE_MS,
} from "../config.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { requireAuth } from "../middleware/authorize.js";
import { writeAuditLog } from "../lib/audit.js";
import { validatePasswordComplexity } from "../lib/passwordPolicy.js";
import {
  hashPassword,
  recordPasswordHistory,
  verifyPassword,
  wasPasswordUsedBefore,
} from "../lib/passwordService.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(500),
});

const registerSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(500),
  securityQuestion: z.string().min(20).max(500),
  securityAnswer: z.string().min(10).max(500),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(500),
  newPassword: z.string().min(1).max(500),
});

const resetPasswordSchema = z.object({
  email: z.string().email().max(320),
  securityAnswer: z.string().min(1).max(500),
  newPassword: z.string().min(1).max(500),
});

const securityQuestionSchema = z.object({
  email: z.string().email().max(320),
});

authRouter.post("/login", validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const generic = { error: "Invalid username and/or password." };

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    await writeAuditLog(req, "AUTH_FAILURE", "Login failed — unknown email", {
      metadata: { email: email.toLowerCase() },
    });
    return res.status(401).json(generic);
  }

  if (user.lockedUntil) {
    if (user.lockedUntil > new Date()) {
      await writeAuditLog(req, "AUTH_FAILURE", "Login blocked — account locked", { userId: user.id });
      return res.status(401).json(generic);
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { lockedUntil: null, failedLoginAttempts: 0 },
    });
  }

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) {
    const attempts = user.failedLoginAttempts + 1;
    const lockedUntil =
      attempts >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil,
        lastFailedLoginAt: new Date(),
      },
    });
    await writeAuditLog(req, "AUTH_FAILURE", "Login failed — bad password", {
      userId: user.id,
      metadata: lockedUntil ? { lockedUntil: lockedUntil.toISOString() } : { attempts },
    });
    return res.status(401).json(generic);
  }

  const prevSuccess = user.lastSuccessfulLoginAt;
  const prevFailed = user.lastFailedLoginAt;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastSuccessfulLoginAt: new Date(),
    },
  });

  req.session.userId = user.id;
  await writeAuditLog(req, "AUTH_SUCCESS", "Login success", { userId: user.id });

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    lastSuccessfulLoginAt: prevSuccess?.toISOString() ?? null,
    lastFailedLoginAt: prevFailed?.toISOString() ?? null,
  });
});

authRouter.post("/logout", async (req, res) => {
  const uid = req.session.userId;
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Something went wrong." });
    }
    res.clearCookie("sid", { path: "/" });
    res.json({ ok: true });
    if (uid) {
      void writeAuditLog(req, "AUTH_SUCCESS", "Logout", { userId: uid });
    }
  });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const u = (req as typeof req & { user: { id: string; email: string; role: Role } }).user;
  res.json({
    user: { id: u.id, email: u.email, role: u.role },
  });
});

authRouter.post("/register", validateBody(registerSchema), async (req, res) => {
  const body = req.body as z.infer<typeof registerSchema>;
  const email = body.email.toLowerCase();
  const pwdErr = validatePasswordComplexity(body.password);
  if (pwdErr) {
    await writeAuditLog(req, "VALIDATION_FAILURE", "Register password policy", {
      metadata: { reason: "password_policy" },
    });
    return res.status(400).json({ error: pwdErr });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    await writeAuditLog(req, "VALIDATION_FAILURE", "Register duplicate email", { metadata: { email } });
    return res.status(400).json({ error: "Invalid input." });
  }

  const passwordHash = await hashPassword(body.password);
  const securityAnswerHash = await hashPassword(body.securityAnswer.trim());

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: Role.CUSTOMER,
      securityQuestion: body.securityQuestion.trim(),
      securityAnswerHash,
      passwordChangedAt: new Date(),
    },
  });

  await writeAuditLog(req, "AUTH_SUCCESS", "Customer registered", { metadata: { email } });
  res.status(201).json({ ok: true });
});

authRouter.post("/password", requireAuth, validateBody(changePasswordSchema), async (req, res) => {
  const body = req.body as z.infer<typeof changePasswordSchema>;
  const u = (req as typeof req & { user: { id: string; passwordHash: string; passwordChangedAt: Date } }).user;

  const ok = await verifyPassword(u.passwordHash, body.currentPassword);
  if (!ok) {
    await writeAuditLog(req, "AUTH_FAILURE", "Password change — bad current password", {
      userId: u.id,
    });
    return res.status(401).json({ error: "Invalid username and/or password." });
  }

  const age = Date.now() - new Date(u.passwordChangedAt).getTime();
  if (age < PASSWORD_MIN_AGE_MS) {
    await writeAuditLog(req, "VALIDATION_FAILURE", "Password change — too soon", { userId: u.id });
    return res.status(400).json({
      error: "Password can only be changed after it has been in use for at least one day.",
    });
  }

  const pwdErr = validatePasswordComplexity(body.newPassword);
  if (pwdErr) {
    await writeAuditLog(req, "VALIDATION_FAILURE", "Password change — policy", { userId: u.id });
    return res.status(400).json({ error: pwdErr });
  }

  if (await wasPasswordUsedBefore(u.id, body.newPassword)) {
    await writeAuditLog(req, "VALIDATION_FAILURE", "Password change — reuse", { userId: u.id });
    return res.status(400).json({ error: "Cannot reuse a previous password." });
  }

  const newHash = await hashPassword(body.newPassword);
  await recordPasswordHistory(u.id, u.passwordHash);
  await prisma.user.update({
    where: { id: u.id },
    data: { passwordHash: newHash, passwordChangedAt: new Date() },
  });

  await writeAuditLog(req, "PASSWORD_CHANGE", "Password changed", { userId: u.id });
  res.json({ ok: true });
});

authRouter.get(
  "/security-question",
  validateQuery(securityQuestionSchema),
  async (req, res) => {
    const query = (req as typeof req & { validatedQuery: z.infer<typeof securityQuestionSchema> }).validatedQuery;
    const email = query.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.securityQuestion) {
      await writeAuditLog(req, "AUTH_FAILURE", "Security question lookup failed", {
        metadata: { email },
      });
      return res.status(400).json({ error: "Invalid input." });
    }
    res.json({ securityQuestion: user.securityQuestion });
  }
);

authRouter.post("/reset-password", validateBody(resetPasswordSchema), async (req, res) => {
  const body = req.body as z.infer<typeof resetPasswordSchema>;
  const email = body.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  const generic = { error: "Invalid username and/or password." };

  if (!user || !user.securityAnswerHash) {
    await writeAuditLog(req, "AUTH_FAILURE", "Reset — unknown or no recovery", { metadata: { email } });
    return res.status(400).json(generic);
  }

  const answerOk = await verifyPassword(user.securityAnswerHash, body.securityAnswer.trim());
  if (!answerOk) {
    await writeAuditLog(req, "AUTH_FAILURE", "Reset — bad security answer", { userId: user.id });
    return res.status(400).json(generic);
  }

  const pwdErr = validatePasswordComplexity(body.newPassword);
  if (pwdErr) {
    await writeAuditLog(req, "VALIDATION_FAILURE", "Reset — password policy", { userId: user.id });
    return res.status(400).json({ error: pwdErr });
  }

  if (await wasPasswordUsedBefore(user.id, body.newPassword)) {
    await writeAuditLog(req, "VALIDATION_FAILURE", "Reset — reuse", { userId: user.id });
    return res.status(400).json({ error: "Cannot reuse a previous password." });
  }

  const newHash = await hashPassword(body.newPassword);
  await recordPasswordHistory(user.id, user.passwordHash);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      passwordChangedAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await writeAuditLog(req, "PASSWORD_CHANGE", "Password reset via security answer", {
    userId: user.id,
  });
  res.json({ ok: true });
});
