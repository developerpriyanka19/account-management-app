/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Creates default admin (admin / admin123). Requires: npx prisma generate
 * Run via npm script so `.env` is loaded (`node --env-file=.env`).
 */
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

function createPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required (use: npm run create-admin)");
    process.exit(1);
  }
  const adapter = new PrismaPg({ connectionString });
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
