/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Creates default admin (admin / admin123). Requires: npx prisma generate
 */
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const bcrypt = require("bcryptjs");

function createPrisma() {
  const envUrl = process.env.DATABASE_URL;
  const url = envUrl?.startsWith("file:")
    ? envUrl
    : `file:${path.join(__dirname, "..", "dev.db")}`;
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

const prisma = createPrisma();

async function main() {
  if (!prisma.user) {
    console.error(
      "Prisma Client has no User model. Run: npx prisma generate && npx prisma migrate dev",
    );
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    create: {
      username: "admin",
      password: hashedPassword,
    },
    update: {
      password: hashedPassword,
    },
  });

  console.log("Admin user ready (username: admin, password: admin123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
