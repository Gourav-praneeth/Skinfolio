"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { todayKey } from "@/lib/dates";

export async function addRoutineStepAction(formData: FormData) {
  const user = await requireUser();
  const period = String(formData.get("period") ?? "AM");
  if (period !== "AM" && period !== "PM") throw new Error("Invalid period");

  const productId = String(formData.get("productId") || "") || null;
  const label = String(formData.get("label") || "").trim() || null;
  if (!productId && !label) throw new Error("Pick a product or enter a step label.");

  const max = await prisma.routineStep.aggregate({
    where: { userId: user.id, period },
    _max: { order: true },
  });

  await prisma.routineStep.create({
    data: {
      userId: user.id,
      period,
      order: (max._max.order ?? -1) + 1,
      productId,
      label: productId ? null : label,
    },
  });

  revalidatePath("/routine");
  revalidatePath("/home");
}

export async function removeRoutineStepAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.routineStep.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/routine");
  revalidatePath("/home");
}

export async function completeRoutineAction(formData: FormData) {
  const user = await requireUser();
  const period = String(formData.get("period") ?? "");
  const status = String(formData.get("status") ?? "done");
  const skipReason = String(formData.get("skipReason") || "") || null;
  if (period !== "AM" && period !== "PM") throw new Error("Invalid period");

  const date = todayKey();
  await prisma.routineCompletion.upsert({
    where: {
      userId_date_period: { userId: user.id, date, period },
    },
    create: {
      userId: user.id,
      date,
      period,
      status,
      skipReason: status === "skipped" ? skipReason : null,
    },
    update: {
      status,
      skipReason: status === "skipped" ? skipReason : null,
      completedAt: new Date(),
    },
  });

  revalidatePath("/routine");
  revalidatePath("/home");
}

export async function applyRoutineTemplateAction(formData: FormData) {
  const user = await requireUser();
  const template = String(formData.get("template") ?? "minimal");

  const products = await prisma.product.findMany({
    where: { userId: user.id, archived: false },
  });
  const byCat = (cat: string) => products.find((p) => p.category === cat);

  await prisma.routineStep.deleteMany({ where: { userId: user.id } });

  const am: Array<{ productId?: string; label?: string }> = [];
  const pm: Array<{ productId?: string; label?: string }> = [];

  if (template === "barrier") {
    am.push(
      { productId: byCat("cleanser")?.id, label: "Gentle cleanse" },
      { productId: byCat("moisturizer")?.id, label: "Moisturizer" },
      { productId: byCat("spf")?.id, label: "SPF" },
    );
    pm.push(
      { productId: byCat("cleanser")?.id, label: "Gentle cleanse" },
      { label: "Hydrating layer / mist (optional)" },
      { productId: byCat("moisturizer")?.id, label: "Moisturizer" },
    );
  } else if (template === "acne") {
    am.push(
      { productId: byCat("cleanser")?.id, label: "Cleanse" },
      { productId: byCat("treatment")?.id, label: "AM treatment (if any)" },
      { productId: byCat("moisturizer")?.id, label: "Moisturizer" },
      { productId: byCat("spf")?.id, label: "SPF" },
    );
    pm.push(
      { productId: byCat("cleanser")?.id, label: "Cleanse" },
      { productId: byCat("treatment")?.id, label: "PM treatment" },
      { productId: byCat("moisturizer")?.id, label: "Moisturizer" },
    );
  } else {
    am.push(
      { productId: byCat("cleanser")?.id, label: "Cleanse" },
      { productId: byCat("moisturizer")?.id, label: "Moisturizer" },
      { productId: byCat("spf")?.id, label: "SPF" },
    );
    pm.push(
      { productId: byCat("cleanser")?.id, label: "Cleanse" },
      { productId: byCat("moisturizer")?.id, label: "Moisturizer" },
    );
  }

  let order = 0;
  for (const step of am) {
    await prisma.routineStep.create({
      data: {
        userId: user.id,
        period: "AM",
        order: order++,
        productId: step.productId ?? null,
        label: step.productId ? null : step.label ?? null,
      },
    });
  }
  order = 0;
  for (const step of pm) {
    await prisma.routineStep.create({
      data: {
        userId: user.id,
        period: "PM",
        order: order++,
        productId: step.productId ?? null,
        label: step.productId ? null : step.label ?? null,
      },
    });
  }

  revalidatePath("/routine");
  revalidatePath("/home");
}
