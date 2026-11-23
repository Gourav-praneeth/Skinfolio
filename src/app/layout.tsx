import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Skinfolio — personal skincare coach + journal",
  description:
    "Brand-neutral guidance grounded in your profile, shelf, and constraints. Habit tracking without diagnose-from-selfie theater or paywalls.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jakarta.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
