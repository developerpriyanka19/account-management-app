import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in",
};

type PageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

function safeCallbackUrl(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/customers";
  }
  return raw;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { callbackUrl } = await searchParams;
  const safe = safeCallbackUrl(callbackUrl);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground">
          Account management
        </h1>
        <p className="mt-1 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Sign in to manage customers
        </p>
        <div className="mt-8">
          <LoginForm callbackUrl={safe} />
        </div>
      </div>
    </div>
  );
}
