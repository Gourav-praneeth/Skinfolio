import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCoachContext } from "@/lib/session";
import { coachReply } from "@/lib/ai";
import { z } from "zod";

const bodySchema = z.object({
  message: z.string().min(1).max(4000),
  threadId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  let threadId = parsed.data.threadId ?? undefined;
  if (threadId) {
    const owned = await prisma.chatThread.findFirst({
      where: { id: threadId, userId },
    });
    if (!owned) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }
  } else {
    const thread = await prisma.chatThread.create({
      data: {
        userId,
        title: parsed.data.message.slice(0, 60),
      },
    });
    threadId = thread.id;
  }

  await prisma.chatMessage.create({
    data: {
      threadId,
      role: "user",
      content: parsed.data.message,
    },
  });

  const historyRows = await prisma.chatMessage.findMany({
    where: { threadId, role: { in: ["user", "assistant"] } },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const history = historyRows
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // Exclude the message we just added from history duplicate — history includes it; coachReply also appends message. Trim last if duplicate.
  const prior = history.slice(0, -1);

  const ctx = await buildCoachContext(userId);
  const { content, provider } = await coachReply(parsed.data.message, prior, ctx);

  const assistant = await prisma.chatMessage.create({
    data: {
      threadId,
      role: "assistant",
      content,
    },
  });

  await prisma.chatThread.update({
    where: { id: threadId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({
    threadId,
    message: assistant,
    provider,
  });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");
  if (!threadId) {
    const threads = await prisma.chatThread.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ threads });
  }

  const thread = await prisma.chatThread.findFirst({
    where: { id: threadId, userId: session.user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!thread) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ thread });
}
