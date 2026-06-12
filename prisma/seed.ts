import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const username = process.env.SUPER_ADMIN_USERNAME;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME ?? "Platform Owner";

  if (!email || !username || !password) {
    throw new Error(
      "Missing env vars. Set SUPER_ADMIN_EMAIL, SUPER_ADMIN_USERNAME and SUPER_ADMIN_PASSWORD before seeding.",
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN", OR: [{ email }, { username }] },
  });

  if (existing) {
    console.log(`✓ Super Admin already exists: ${existing.email}`);
    return;
  }

  const superAdmin = await prisma.user.create({
    data: {
      name,
      username,
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      companyId: null,
      emailVerified: new Date(),
    },
  });

  console.log("✓ First Super Admin created:");
  console.log(`  email:    ${superAdmin.email}`);
  console.log(`  username: ${superAdmin.username}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
