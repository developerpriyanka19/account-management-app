import {
  DATABASE_URL_ENV_KEYS,
  databaseUrlEnvKeysPresent,
  resolveDatabaseUrl,
} from "@/lib/database-url";
import { getPrisma } from "@/lib/prisma";

/** Quick DB check — open /api/health on Vercel to verify DATABASE_URL. */
export async function GET() {
  const resolved = resolveDatabaseUrl();
  if (!resolved) {
    return Response.json(
      {
        ok: false,
        error: "DATABASE_URL is not set",
        hint: "Vercel → Settings → Environment Variables → add DATABASE_URL (Neon pooled URL) → check Production → Redeploy",
        checkedEnvKeys: [...DATABASE_URL_ENV_KEYS],
        presentEnvKeys: databaseUrlEnvKeysPresent(),
      },
      { status: 500 },
    );
  }

  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return Response.json({ ok: true, database: "connected" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database connection failed";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
