"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function addProductAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Product name is required.");

  await prisma.product.create({
    data: {
      userId: user.id,
      name,
      brand: String(formData.get("brand") || "") || null,
      category: String(formData.get("category") || "other"),
      ingredients: String(formData.get("ingredients") || "") || null,
      notes: String(formData.get("notes") || "") || null,
    },
  });

  revalidatePath("/routine");
  revalidatePath("/home");
  revalidatePath("/product-check");
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
  await prisma.product.create({
    data: {
      userId: user.id,
      name,
      brand: String(formData.get("brand") || "") || null,
      category: String(formData.get("category") || "other"),
      ingredients: String(formData.get("ingredients") || "") || null,
      notes: "Added from product check",
    },
  });
  revalidatePath("/routine");
  revalidatePath("/product-check");
}
