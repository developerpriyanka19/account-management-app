import { NextResponse } from "next/server";
import { APP_SESSION_COOKIE } from "@/lib/app-session";

export async function POST() {
  const secure = process.env.NODE_ENV === "production";
  const res = NextResponse.json({ ok: true });
  res.cookies.set(APP_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });
  return res;
}
