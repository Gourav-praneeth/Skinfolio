import { requireOnboarded } from "@/lib/session";
import { ProductCheckClient } from "@/components/ProductCheckClient";
import { DisclaimerStrip } from "@/components/Disclaimer";
import Link from "next/link";

export default async function ProductCheckPage() {
  await requireOnboarded();

  return (
    <main className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Ingredient literacy
        </p>
        <h1 className="font-display mt-1 text-3xl text-[var(--brand-deep)]">Product check</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Paste a name and/or INCI list. We compare against your allergies, pregnancy flag, and
          concerns — brand-neutral, no “buy our SKU.”
        </p>
        <Link href="/routine" className="mt-2 inline-block text-sm font-semibold text-[var(--brand)]">
          ← Back to shelf
        </Link>
      </header>
      <ProductCheckClient />
      <DisclaimerStrip />
    </main>
  );
}
