import Link from "next/link";
import { DISCLAIMER_SHORT } from "@/lib/constants";

export function DisclaimerStrip({ className = "" }: { className?: string }) {
  return (
    <p className={`disclaimer-strip ${className}`}>
      {DISCLAIMER_SHORT}{" "}
      <Link href="/disclaimer" className="underline underline-offset-2">
        Full notice
      </Link>
    </p>
  );
}
