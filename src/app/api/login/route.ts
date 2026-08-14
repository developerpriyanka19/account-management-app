import { NextResponse } from "next/server";
import {
  APP_SESSION_COOKIE,
  appSessionSecret,
  signAppSession,
} from "@/lib/app-session";

const MAX_AGE_SEC = 60 * 60 * 24 * 7;

function staticUser(): string {
  return process.env.APP_LOGIN_USER ?? "admin";
}

function staticPassword(): string {
  return process.env.APP_LOGIN_PASSWORD ?? "admin123";
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const username = String(o.username ?? "").trim();
  const password = String(o.password ?? "");

  if (
    username !== staticUser() ||
    password !== staticPassword()
  ) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 },
    );
  }

  const secret = appSessionSecret();
  const token = await signAppSession(secret, username, MAX_AGE_SEC);
  const secure = process.env.NODE_ENV === "production";

  const res = NextResponse.json({ ok: true });
  res.cookies.set(APP_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
  return res;
}
