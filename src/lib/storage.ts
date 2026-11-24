import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/**
 * Journal photo storage stub.
 *
 * Local/dev: files land under /uploads/journal/<userId>/ and are served via
 * /api/journal/photo. This is NOT production-safe multi-tenant object storage.
 *
 * For production, wire a private bucket (Vercel Blob, S3, R2) with per-account
 * ACLs and signed URLs — see README.
 */
const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "journal");

export async function saveJournalPhoto(
  userId: string,
  file: File,
): Promise<{ relativePath: string }> {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, or GIF images are allowed.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Photo must be under 5MB.");
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";

  const dir = path.join(UPLOAD_ROOT, userId);
  await mkdir(dir, { recursive: true });
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const full = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(full, buffer);

  return { relativePath: `${userId}/${filename}` };
}

export function resolveJournalPhotoPath(relativePath: string): string {
  // Prevent path traversal
  const safe = relativePath.replace(/\.\./g, "").replace(/^\/+/, "");
  return path.join(UPLOAD_ROOT, safe);
}
