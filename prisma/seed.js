/* eslint-disable */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL || "jerrym2292@gmail.com").toLowerCase();
  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (adminPassword) {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          role: "ADMIN",
        },
      });
      console.log(`Created ADMIN user: ${adminEmail}`);
    }
  } else {
    console.log(
      "ADMIN_BOOTSTRAP_PASSWORD not set; skipping admin user creation."
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
