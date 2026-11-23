"use client";

import { useEffect, useRef, useState, useTransition } from "react";

type Msg = { id: string; role: string; content: string };

const SUGGESTIONS = [
  "Is my PM too strong?",
  "Can I add SPF to AM?",
  "What should I skip if my barrier feels irritated?",
];

export function ChatClient({
  initialThreadId,
  initialMessages,
}: {
  initialThreadId?: string | null;
  initialMessages?: Msg[];
}) {
  const [threadId, setThreadId] = useState<string | null>(initialThreadId ?? null);
  const [messages, setMessages] = useState<Msg[]>(initialMessages ?? []);
  const [input, setInput] = useState("");
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  function send(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    setError(null);
    setInput("");
    const optimistic: Msg = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: message,
    };
    setMessages((m) => [...m, optimistic]);

    startTransition(async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, threadId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Chat failed");
          return;
        }
        setThreadId(data.threadId);
        setProvider(data.provider);
        setMessages((m) => [
          ...m.filter((x) => x.id !== optimistic.id),
          { id: `u-${Date.now()}`, role: "user", content: message },
          data.message,
        ]);
      } catch {
        setError("Network error — try again.");
      }
    });
  }

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="flex-1 space-y-3 pb-4">
        {messages.length === 0 ? (
          <div className="surface p-5 animate-rise">
            <p className="font-display text-xl text-[var(--brand-deep)]">Ask your coach</p>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Answers use your profile, shelf, routine, and recent journal — with uncertainty and
              safety gates. Not a diagnosis.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === "user"
                ? "ml-auto bg-[var(--brand)] text-[#f4fffb]"
                : "surface text-[var(--ink)]"
            }`}
          >
            {m.content}
          </div>
        ))}
        {pending ? (
          <div className="surface animate-pulse-soft w-fit px-4 py-3 text-sm text-[var(--muted)]">
            Thinking…
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      {provider ? (
        <p className="mb-2 text-xs text-[var(--muted)]">
          Provider: {provider === "openai" ? "OpenAI" : "Offline fallback"}
        </p>
      ) : null}
      {error ? <p className="mb-2 text-sm text-[var(--bad)]">{error}</p> : null}

      <form
        className="sticky bottom-20 z-10 flex gap-2 md:bottom-4"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your routine, product, or flare…"
          disabled={pending}
        />
        <button className="btn btn-primary shrink-0" type="submit" disabled={pending}>
          Send
        </button>
      </form>
    </div>
  );
}
