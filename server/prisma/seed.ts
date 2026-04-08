import { PrismaClient, Role } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo#Pass12345";

async function main() {
  const hash = await argon2.hash(DEMO_PASSWORD);

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.local" },
    update: {},
    create: {
      email: "admin@demo.local",
      passwordHash: hash,
      role: Role.ADMIN,
      passwordChangedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      securityQuestion: "What is your unique recovery phrase? (use random words)",
      securityAnswerHash: await argon2.hash("correct-horse-battery-staple-7391"),
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: "pm@demo.local" },
    update: {},
    create: {
      email: "pm@demo.local",
      passwordHash: hash,
      role: Role.PRODUCT_MANAGER,
      passwordChangedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      securityQuestion: "What is your unique recovery phrase? (use random words)",
      securityAnswerHash: await argon2.hash("widget-silver-octopus-4412"),
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@demo.local" },
    update: {},
    create: {
      email: "customer@demo.local",
      passwordHash: hash,
      role: Role.CUSTOMER,
      passwordChangedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      securityQuestion: "What is your unique recovery phrase? (use random words)",
      securityAnswerHash: await argon2.hash("paper-moon-velocity-8821"),
    },
  });

  await prisma.product.upsert({
    where: { id: "seed-product-1" },
    update: {},
    create: {
      id: "seed-product-1",
      name: "Sample Product",
      description: "Demo catalog item for managers.",
      price: 19.99,
      stock: 100,
    },
  });

  await prisma.auditLog.create({
    data: {
      eventType: "SYSTEM",
      message: "Database seeded with demo users and sample product",
      metadata: JSON.stringify({ adminId: admin.id, pmId: pm.id, customerId: customer.id }),
    },
  });

  console.log("Seed OK. Demo password for all demo accounts:", DEMO_PASSWORD);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
