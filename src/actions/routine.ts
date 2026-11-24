"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { todayKey } from "@/lib/dates";
import { moveStep, applyOrderedIds } from "@/lib/routine-order";
import {
  planMoisturizerReplace,
  type MoisturizerStep,
} from "@/lib/moisturizer-replace";

export type AddStepResult =
  | { ok: true; mode: "added" | "replaced" }
  | { ok: false; error: string; needsConfirmation?: boolean; period?: string };

export async function addRoutineStepAction(formData: FormData): Promise<AddStepResult | void> {
  const user = await requireUser();
  const period = String(formData.get("period") ?? "AM");
  if (period !== "AM" && period !== "PM") throw new Error("Invalid period");

  const productId = String(formData.get("productId") || "") || null;
  const label = String(formData.get("label") || "").trim() || null;
  const confirmMultiple = formData.get("confirmReplaceMultiple") === "on";
  if (!productId && !label) throw new Error("Pick a product or enter a step label.");

  if (productId) {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId: user.id, archived: false },
    });
    if (!product) throw new Error("Product not found.");

    if (product.category === "moisturizer") {
      const result = await replaceOrInsertMoisturizer(
        user.id,
        period,
        product.id,
        confirmMultiple,
      );
      revalidatePath("/routine");
      revalidatePath("/home");
      return result;
    }
  }

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
  return { ok: true, mode: "added" };
}

async function replaceOrInsertMoisturizer(
  userId: string,
  period: "AM" | "PM",
  productId: string,
  confirmMultiple: boolean,
): Promise<AddStepResult> {
  const steps = await prisma.routineStep.findMany({
    where: { userId, period },
    include: { product: true },
    orderBy: { order: "asc" },
  });

  const mapped: MoisturizerStep[] = steps.map((s) => ({
    id: s.id,
    order: s.order,
    productId: s.productId,
    category: s.product?.category ?? null,
    label: s.label,
  }));

  const plan = planMoisturizerReplace(mapped, { confirmMultiple });

  if (plan.action === "insert") {
    const max = steps.reduce((m, s) => Math.max(m, s.order), -1);
    await prisma.routineStep.create({
      data: {
        userId,
        period,
        order: max + 1,
        productId,
        label: null,
      },
    });
    return { ok: true, mode: "added" };
  }

  if (plan.requiresConfirmation) {
    return {
      ok: false,
      error: `Multiple moisturizers in ${period}. Confirm to replace the primary slot and remove extras.`,
      needsConfirmation: true,
      period,
    };
  }

  await prisma.routineStep.updateMany({
    where: { id: plan.targetStepId, userId },
    data: { productId, label: null },
  });

  if (plan.extraMoisturizerStepIds.length) {
    await prisma.routineStep.deleteMany({
      where: { userId, id: { in: plan.extraMoisturizerStepIds } },
    });
    const remaining = await prisma.routineStep.findMany({
      where: { userId, period },
      orderBy: { order: "asc" },
    });
    for (let i = 0; i < remaining.length; i++) {
      await prisma.routineStep.update({
        where: { id: remaining[i]!.id },
        data: { order: i },
      });
    }
  }

  return { ok: true, mode: "replaced" };
}

export async function removeRoutineStepAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.routineStep.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/routine");
  revalidatePath("/home");
}

export async function moveRoutineStepAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (direction !== "up" && direction !== "down") {
    throw new Error("Invalid direction");
  }

  const step = await prisma.routineStep.findFirst({
    where: { id, userId: user.id },
  });
  if (!step) throw new Error("Step not found");

  const siblings = await prisma.routineStep.findMany({
    where: { userId: user.id, period: step.period },
    orderBy: { order: "asc" },
  });

  const next = moveStep(
    siblings.map((s) => ({ id: s.id, order: s.order })),
    id,
    direction,
  );

  for (const s of next) {
    await prisma.routineStep.update({
      where: { id: s.id },
      data: { order: s.order },
    });
  }

  revalidatePath("/routine");
  revalidatePath("/home");
}

/** Persist an explicit order list for a period (drag-and-drop). */
export async function reorderRoutineStepsAction(formData: FormData) {
  const user = await requireUser();
  const period = String(formData.get("period") ?? "");
  if (period !== "AM" && period !== "PM") throw new Error("Invalid period");

  const orderedIds = String(formData.get("orderedIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const siblings = await prisma.routineStep.findMany({
    where: { userId: user.id, period },
    orderBy: { order: "asc" },
  });

  const next = applyOrderedIds(
    siblings.map((s) => ({ id: s.id, order: s.order })),
    orderedIds,
  );

  for (const s of next) {
    await prisma.routineStep.update({
      where: { id: s.id },
      data: { order: s.order },
    });
  }

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
