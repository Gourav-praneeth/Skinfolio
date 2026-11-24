import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { DisclaimerStrip } from "@/components/Disclaimer";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/home");
  }

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Full-bleed atmospheric hero plane */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(120deg, rgba(15,92,85,0.18), transparent 40%), radial-gradient(ellipse at 70% 20%, rgba(196,106,69,0.22), transparent 50%), linear-gradient(180deg, #0f5c55 0%, #1a6b63 28%, transparent 58%)",
        }}
      />
      <div
        aria-hidden
        className="animate-drift pointer-events-none absolute -right-16 top-24 h-64 w-64 rounded-full bg-[rgba(255,250,245,0.12)] blur-2xl"
      />

      <div className="relative mx-auto flex min-h-dvh max-w-3xl flex-col justify-between px-5 pb-8 pt-10 sm:px-8">
        <header className="text-[var(--surface-solid)]">
          <BrandMark
            size="lg"
            tone="light"
            subtitle="A coach + journal that knows your skin profile, routine, and constraints — answers with uncertainty, keeps you consistent."
          />
          <div className="mt-8 flex flex-wrap gap-3 animate-rise-delay">
            <Link href="/register" className="btn btn-accent">
              Start free
            </Link>
            <Link
              href="/login"
              className="btn border border-white/35 bg-white/10 text-white backdrop-blur"
            >
              Sign in
            </Link>
          </div>
        </header>

        <section className="mt-16 space-y-4 text-[var(--ink)]">
          <div className="surface p-5 animate-rise">
            <h2 className="font-display text-2xl text-[var(--brand-deep)]">What Skinfolio is</h2>
            <ul className="mt-3 space-y-2 text-sm text-[var(--ink-soft)]">
              <li>• Profile + constraints the coach actually uses</li>
              <li>• Shelf and AM/PM checklist — habit over hype</li>
              <li>• Progress journal (notes + optional photos)</li>
              <li>• Paste INCI / name for a brand-neutral product check</li>
            </ul>
          </div>
          <div className="surface p-5">
            <h2 className="font-display text-2xl text-[var(--brand-deep)]">What it is not</h2>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Not a diagnose-from-selfie camera. Not a product storefront. No paywalls in this MVP.
            </p>
          </div>
          <DisclaimerStrip />
        </section>
      </div>
    </main>
  );
}
