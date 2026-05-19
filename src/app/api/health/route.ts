import { getPrisma } from "@/lib/prisma";

/** Quick DB check — open /api/health on Vercel to verify DATABASE_URL. */
export async function GET() {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return Response.json({ ok: true, database: "connected" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database connection failed";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
