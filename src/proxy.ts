import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  APP_SESSION_COOKIE,
  appSessionSecret,
  verifyAppSession,
} from "@/lib/app-session";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(APP_SESSION_COOKIE)?.value ?? "";
  const user = token
    ? await verifyAppSession(appSessionSecret(), token)
    : null;

  if (pathname.startsWith("/login")) {
    if (user) {
      return NextResponse.redirect(new URL("/customers", request.url));
    }
    return NextResponse.next();
  }

  if (!user) {
    const login = new URL("/login", request.url);
    const dest = `${pathname}${request.nextUrl.search}`;
    if (dest.startsWith("/") && !dest.startsWith("//")) {
      login.searchParams.set("callbackUrl", dest);
    }
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/customers",
    "/customers/:path*",
    "/invoice",
    "/invoice/:path*",
    "/debit-note",
    "/debit-note/:path*",
  ],
};
