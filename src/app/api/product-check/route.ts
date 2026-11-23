import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/dates";
import { runProductCheck } from "@/lib/product-check";
import { z } from "zod";

const schema = z.object({
  name: z.string().optional(),
  ingredients: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  const result = runProductCheck(
    {
      name: parsed.data.name,
      ingredients: parsed.data.ingredients,
    },
    {
      skinType: profile?.skinType ?? null,
      concerns: parseJsonArray(profile?.concerns),
      allergies: parseJsonArray(profile?.allergies),
      pregnantNursing: profile?.pregnantNursing ?? false,
      usesRetinoid: profile?.usesRetinoid ?? false,
      climate: profile?.climate ?? null,
    },
  );

  return NextResponse.json({ result });
}
