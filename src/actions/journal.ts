"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { todayKey, toJsonArray } from "@/lib/dates";
import { saveJournalPhoto } from "@/lib/storage";

export async function createJournalEntryAction(formData: FormData) {
  const user = await requireUser();
  const date = String(formData.get("date") || todayKey());
  const notes = String(formData.get("notes") || "").trim() || null;
  const tags = formData
    .getAll("tags")
    .map(String)
    .map((t) => t.trim())
    .filter(Boolean);

  let photoPath: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try {
      const saved = await saveJournalPhoto(user.id, photo);
      photoPath = saved.relativePath;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Photo upload failed");
    }
  }

  await prisma.journalEntry.create({
    data: {
      userId: user.id,
      date,
      notes,
      tags: toJsonArray(tags),
      photoPath,
    },
  });

  revalidatePath("/journal");
  revalidatePath("/home");
  revalidatePath("/chat");
}

export async function deleteJournalEntryAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.journalEntry.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/journal");
}
