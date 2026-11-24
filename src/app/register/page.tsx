import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { registerAction } from "@/actions/auth";
import { BrandMark } from "@/components/BrandMark";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/home");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <BrandMark size="md" subtitle="Free MVP — email + password. No paywall." />
      <AuthForm action={registerAction} mode="register" />
      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[var(--brand)]">
          Sign in
        </Link>
      </p>
    </main>
  );
}
