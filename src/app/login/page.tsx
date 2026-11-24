import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { loginAction } from "@/actions/auth";
import { BrandMark } from "@/components/BrandMark";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/home");
  const { callbackUrl } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <BrandMark size="md" subtitle="Sign in to your shelf, journal, and coach." />
      <AuthForm action={loginAction} mode="login" callbackUrl={callbackUrl ?? "/home"} />
      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        New here?{" "}
        <Link href="/register" className="font-semibold text-[var(--brand)]">
          Create an account
        </Link>
      </p>
    </main>
  );
}
