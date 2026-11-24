"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { toJsonArray } from "@/lib/dates";

function multi(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function saveOnboardingAction(formData: FormData) {
  const user = await requireUser();
  const disclaimer = formData.get("disclaimerAck") === "on";
  if (!disclaimer) {
    throw new Error("Please acknowledge the medical disclaimer.");
  }

  const allergiesRaw = String(formData.get("allergies") ?? "");
  const allergies = allergiesRaw
    .split(/[,;\n]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      skinType: String(formData.get("skinType") || "unsure"),
      concerns: toJsonArray(multi(formData, "concerns")),
      allergies: toJsonArray(allergies),
      pregnantNursing: formData.get("pregnantNursing") === "on",
      pregnantNote: String(formData.get("pregnantNote") || "") || null,
      usesRetinoid: formData.get("usesRetinoid") === "on",
      retinoidNote: String(formData.get("retinoidNote") || "") || null,
      climate: String(formData.get("climate") || "") || null,
      city: String(formData.get("city") || "") || null,
      goals: toJsonArray(multi(formData, "goals")),
      goalsNote: String(formData.get("goalsNote") || "") || null,
      disclaimerAck: true,
      onboardingDone: true,
    },
    update: {
      skinType: String(formData.get("skinType") || "unsure"),
      concerns: toJsonArray(multi(formData, "concerns")),
      allergies: toJsonArray(allergies),
      pregnantNursing: formData.get("pregnantNursing") === "on",
      pregnantNote: String(formData.get("pregnantNote") || "") || null,
      usesRetinoid: formData.get("usesRetinoid") === "on",
      retinoidNote: String(formData.get("retinoidNote") || "") || null,
      climate: String(formData.get("climate") || "") || null,
      city: String(formData.get("city") || "") || null,
      goals: toJsonArray(multi(formData, "goals")),
      goalsNote: String(formData.get("goalsNote") || "") || null,
      disclaimerAck: true,
      onboardingDone: true,
    },
  });

  revalidatePath("/home");
  revalidatePath("/profile");
  redirect("/home");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const allergiesRaw = String(formData.get("allergies") ?? "");
  const allergies = allergiesRaw
    .split(/[,;\n]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      skinType: String(formData.get("skinType") || "unsure"),
      concerns: toJsonArray(multi(formData, "concerns")),
      allergies: toJsonArray(allergies),
      pregnantNursing: formData.get("pregnantNursing") === "on",
      pregnantNote: String(formData.get("pregnantNote") || "") || null,
      usesRetinoid: formData.get("usesRetinoid") === "on",
      retinoidNote: String(formData.get("retinoidNote") || "") || null,
      climate: String(formData.get("climate") || "") || null,
      city: String(formData.get("city") || "") || null,
      goals: toJsonArray(multi(formData, "goals")),
      goalsNote: String(formData.get("goalsNote") || "") || null,
      disclaimerAck: true,
      onboardingDone: true,
    },
    update: {
      skinType: String(formData.get("skinType") || "unsure"),
      concerns: toJsonArray(multi(formData, "concerns")),
      allergies: toJsonArray(allergies),
      pregnantNursing: formData.get("pregnantNursing") === "on",
      pregnantNote: String(formData.get("pregnantNote") || "") || null,
      usesRetinoid: formData.get("usesRetinoid") === "on",
      retinoidNote: String(formData.get("retinoidNote") || "") || null,
      climate: String(formData.get("climate") || "") || null,
      city: String(formData.get("city") || "") || null,
      goals: toJsonArray(multi(formData, "goals")),
      goalsNote: String(formData.get("goalsNote") || "") || null,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/chat");
  redirect("/profile?saved=1");
}
