import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { parseJsonArray } from "@/lib/dates";
import type { CoachContext } from "@/lib/ai";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user;
}

export async function getProfile(userId: string) {
  return prisma.profile.findUnique({ where: { userId } });
}

export async function requireOnboarded() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (!profile?.onboardingDone || !profile.disclaimerAck) {
    redirect("/onboarding");
  }
  return { user, profile };
}

export async function buildCoachContext(userId: string): Promise<CoachContext> {
  const [profile, products, steps, journal] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.product.findMany({
      where: { userId, archived: false, active: true },
      orderBy: { name: "asc" },
      take: 40,
    }),
    prisma.routineStep.findMany({
      where: { userId },
      include: { product: true },
      orderBy: [{ period: "asc" }, { order: "asc" }],
    }),
    prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 7,
    }),
  ]);

  const routine = { AM: [] as string[], PM: [] as string[] };
  for (const step of steps) {
    const label = step.product?.name ?? step.label ?? "Step";
    if (step.period === "AM") routine.AM.push(label);
    if (step.period === "PM") routine.PM.push(label);
  }

  return {
    profile: {
      skinType: profile?.skinType ?? null,
      concerns: parseJsonArray(profile?.concerns),
      allergies: parseJsonArray(profile?.allergies),
      pregnantNursing: profile?.pregnantNursing ?? false,
      pregnantNote: profile?.pregnantNote ?? null,
      usesRetinoid: profile?.usesRetinoid ?? false,
      retinoidNote: profile?.retinoidNote ?? null,
      climate: profile?.climate ?? null,
      city: profile?.city ?? null,
      goals: parseJsonArray(profile?.goals),
      goalsNote: profile?.goalsNote ?? null,
    },
    shelf: products.map((p) => ({
      name: p.name,
      brand: p.brand,
      category: p.category,
      ingredients: p.ingredients,
    })),
    routine,
    journal: journal.map((j) => ({
      date: j.date,
      tags: parseJsonArray(j.tags),
      notes: j.notes,
    })),
  };
}
