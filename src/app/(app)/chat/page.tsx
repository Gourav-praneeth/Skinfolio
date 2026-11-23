import { requireOnboarded } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ChatClient } from "@/components/ChatClient";
import { DisclaimerStrip } from "@/components/Disclaimer";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string }>;
}) {
  const { user } = await requireOnboarded();
  const { thread: threadParam } = await searchParams;

  let threadId: string | null = threadParam ?? null;
  let messages: Array<{ id: string; role: string; content: string }> = [];

  if (threadId) {
    const thread = await prisma.chatThread.findFirst({
      where: { id: threadId, userId: user.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (thread) {
      messages = thread.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      }));
    } else {
      threadId = null;
    }
  }

  return (
    <main className="space-y-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          AI coach
        </p>
        <h1 className="font-display mt-1 text-3xl text-[var(--brand-deep)]">Chat</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Server-side only. Uses your profile, shelf, routine, and recent journal. Works offline
          without an API key; richer with <code>OPENAI_API_KEY</code>.
        </p>
      </header>
      <ChatClient initialThreadId={threadId} initialMessages={messages} />
      <DisclaimerStrip />
    </main>
  );
}
