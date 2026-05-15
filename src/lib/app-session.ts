/** httpOnly cookie name for static-login gate */
export const APP_SESSION_COOKIE = "am_session";

/** HMAC secret — set `APP_SESSION_SECRET` on Vercel (any long random string). */
export function appSessionSecret(): string {
  return (
    process.env.APP_SESSION_SECRET ??
    "dev-insecure-app-session-change-with-APP_SESSION_SECRET"
  );
}

type SessionPayload = { exp: number; u: string };

function bytesToBase64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a[i]! ^ b[i]!;
  return x === 0;
}

export async function signAppSession(
  secret: string,
  username: string,
  maxAgeSec: number,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec;
  const payload: SessionPayload = { exp, u: username };
  const json = JSON.stringify(payload);
  const jsonBytes = new TextEncoder().encode(json);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const payloadBuf = new Uint8Array(jsonBytes);
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, payloadBuf),
  );
  return `${bytesToBase64url(jsonBytes)}.${bytesToBase64url(sig)}`;
}

/** Returns username if valid, otherwise `null`. */
export async function verifyAppSession(
  secret: string,
  cookieValue: string,
): Promise<string | null> {
  const dot = cookieValue.indexOf(".");
  if (dot === -1) return null;
  let jsonBytes: Uint8Array;
  let sigBytes: Uint8Array;
  try {
    jsonBytes = base64urlToBytes(cookieValue.slice(0, dot));
    sigBytes = base64urlToBytes(cookieValue.slice(dot + 1));
  } catch {
    return null;
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(jsonBytes)) as SessionPayload;
  } catch {
    return null;
  }
  if (typeof payload.exp !== "number" || typeof payload.u !== "string") {
    return null;
  }
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const payloadBuf = new Uint8Array(jsonBytes);
  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, payloadBuf),
  );
  if (!timingSafeEqualBytes(expected, sigBytes)) return null;
  return payload.u;
}
