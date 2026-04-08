import argon2 from "argon2";
import { prisma } from "../db.js";
import { PASSWORD_HISTORY_LIMIT } from "../config.js";

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

export async function wasPasswordUsedBefore(userId: string, plain: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      passwordHistory: { orderBy: { createdAt: "desc" }, take: PASSWORD_HISTORY_LIMIT },
    },
  });
  if (!user) return true;
  if (await verifyPassword(user.passwordHash, plain)) return true;
  for (const h of user.passwordHistory) {
    if (await verifyPassword(h.hash, plain)) return true;
  }
  return false;
}

export async function recordPasswordHistory(userId: string, previousHash: string) {
  await prisma.passwordHistory.create({
    data: { userId, hash: previousHash },
  });
  const rows = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (rows.length > PASSWORD_HISTORY_LIMIT) {
    const drop = rows.slice(0, rows.length - PASSWORD_HISTORY_LIMIT);
    await prisma.passwordHistory.deleteMany({
      where: { id: { in: drop.map((r) => r.id) } },
    });
  }
}
