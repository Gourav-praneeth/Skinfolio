import Link from "next/link";
import { DISCLAIMER_FULL } from "@/lib/constants";
import { BrandMark } from "@/components/BrandMark";

export default function DisclaimerPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <BrandMark size="sm" />
      <h1 className="font-display mt-6 text-3xl text-[var(--brand-deep)]">Medical disclaimer</h1>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-soft)]">
        {DISCLAIMER_FULL}
      </p>
      <Link href="/" className="btn btn-primary mt-8 inline-flex">
        Back
      </Link>
    </main>
  );
}
