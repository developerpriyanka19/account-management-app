/** Normalize DATABASE_URL for Neon / Vercel serverless. */
export function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error("DATABASE_URL is not set");
  }
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

  if (raw.includes("neon.tech") && !/[?&]sslmode=/.test(raw)) {
    return raw.includes("?") ? `${raw}&sslmode=require` : `${raw}?sslmode=require`;
  }

  return raw;
}
