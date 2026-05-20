/** Env keys tried in order (Neon / Vercel integrations use different names). */
export const DATABASE_URL_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "NEON_DATABASE_URL",
] as const;

function normalizeDatabaseUrl(raw: string): string {
  if (
    raw.includes("localhost") ||
    raw.includes("127.0.0.1") ||
    raw.includes("db.example.com") ||
    raw.includes("user:pass@")
  ) {
    throw new Error(
      "DATABASE_URL is still a placeholder. Set your real Neon connection string in Vercel Environment Variables.",
    );
  }

  if (raw.includes("neon.tech")) {
    // Avoid noisy pg warning in Next dev overlay and keep strict TLS semantics.
    if (/[?&]sslmode=require([&#]|$)/.test(raw)) {
      return raw.replace(/sslmode=require/g, "sslmode=verify-full");
    }
    if (!/[?&]sslmode=/.test(raw)) {
      return raw.includes("?")
        ? `${raw}&sslmode=verify-full`
        : `${raw}?sslmode=verify-full`;
    }
  }

  return raw;
}

/** First non-empty database URL from known env var names. */
export function resolveDatabaseUrl(): string | null {
  for (const key of DATABASE_URL_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (value) {
      return normalizeDatabaseUrl(value);
    }
  }
  return null;
}

/** Which env keys are set (names only — for /api/health debugging). */
export function databaseUrlEnvKeysPresent(): string[] {
  return DATABASE_URL_ENV_KEYS.filter((key) => Boolean(process.env[key]?.trim()));
}

/** Normalize DATABASE_URL for Neon / Vercel serverless. */
export function getDatabaseUrl(): string {
  const url = resolveDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. In Vercel → Project → Settings → Environment Variables, add DATABASE_URL with your Neon pooled URL, enable Production, then Redeploy.",
    );
  }
  return url;
}
