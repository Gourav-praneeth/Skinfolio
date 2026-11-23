import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readFile } from "fs/promises";
import { resolveJournalPhotoPath } from "@/lib/storage";
import path from "path";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rel = searchParams.get("path");
  if (!rel) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  // Enforce ownership: path must start with this user's id
  if (!rel.startsWith(`${session.user.id}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const full = resolveJournalPhotoPath(rel);
    const data = await readFile(full);
    const ext = path.extname(full).toLowerCase();
    const type =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".gif"
            ? "image/gif"
            : "image/jpeg";
    return new NextResponse(data, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
