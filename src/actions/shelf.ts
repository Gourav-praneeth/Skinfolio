"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { normalizeOptionalDate } from "@/lib/product-dates";
import {
  planMoisturizerReplace,
  type MoisturizerStep,
} from "@/lib/moisturizer-replace";

function parseDates(formData: FormData) {
  return {
    openedDate: normalizeOptionalDate(String(formData.get("openedDate") || "")),
    expiryDate: normalizeOptionalDate(String(formData.get("expiryDate") || "")),
  };
}

export async function addProductAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Product name is required.");

  const category = String(formData.get("category") || "other");
  const { openedDate, expiryDate } = parseDates(formData);

  const product = await prisma.product.create({
    data: {
      userId: user.id,
      name,
      brand: String(formData.get("brand") || "") || null,
      category,
      ingredients: String(formData.get("ingredients") || "") || null,
      notes: String(formData.get("notes") || "") || null,
      openedDate,
      expiryDate,
    },
  });

  // Optional: place moisturizer into AM/PM with replace semantics
  if (category === "moisturizer") {
    const periods = String(formData.get("placeIn") || "")
      .split(",")
      .map((p) => p.trim().toUpperCase())
      .filter((p): p is "AM" | "PM" => p === "AM" || p === "PM");
    const confirmMultiple = formData.get("confirmReplaceMultiple") === "on";

    for (const period of periods) {
      await placeMoisturizerInPeriod(user.id, product.id, period, confirmMultiple);
    }
  }

  revalidatePath("/routine");
  revalidatePath("/home");
  revalidatePath("/product-check");
}

export async function updateProductDatesAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const { openedDate, expiryDate } = parseDates(formData);

  await prisma.product.updateMany({
    where: { id, userId: user.id },
    data: { openedDate, expiryDate },
  });

  revalidatePath("/routine");
}

export async function archiveProductAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.product.updateMany({
    where: { id, userId: user.id },
    data: { archived: true, active: false },
  });
  revalidatePath("/routine");
}

export async function addProductFromCheckAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim() || "Checked product";
  const { openedDate, expiryDate } = parseDates(formData);
  await prisma.product.create({
    data: {
      userId: user.id,
      name,
      brand: String(formData.get("brand") || "") || null,
      category: String(formData.get("category") || "other"),
      ingredients: String(formData.get("ingredients") || "") || null,
      notes: "Added from product check",
      openedDate,
      expiryDate,
    },
  });
  revalidatePath("/routine");
  revalidatePath("/product-check");
}

async function placeMoisturizerInPeriod(
  userId: string,
  productId: string,
  period: "AM" | "PM",
  confirmMultiple: boolean,
) {
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
    return;
  }

  if (plan.requiresConfirmation) {
    // Still replace the primary slot; leave extras until user confirms
    await prisma.routineStep.updateMany({
      where: { id: plan.targetStepId, userId },
      data: { productId, label: null },
    });
    return { needsConfirmation: true as const, period, extraIds: plan.extraMoisturizerStepIds };
  }

  await prisma.routineStep.updateMany({
    where: { id: plan.targetStepId, userId },
    data: { productId, label: null },
  });

  if (plan.extraMoisturizerStepIds.length) {
    await prisma.routineStep.deleteMany({
      where: { userId, id: { in: plan.extraMoisturizerStepIds } },
    });
    // Reindex remaining
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
}
