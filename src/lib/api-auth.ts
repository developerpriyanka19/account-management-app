import { cookies } from "next/headers";
import {
  APP_SESSION_COOKIE,
  appSessionSecret,
  verifyAppSession,
} from "@/lib/app-session";

export async function requireApiSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(APP_SESSION_COOKIE)?.value ?? "";
  if (!token) return null;
  return verifyAppSession(appSessionSecret(), token);
}
