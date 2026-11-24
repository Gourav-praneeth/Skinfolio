"use client";

import { useActionState } from "react";
import type { ActionState } from "@/actions/auth";

export function AuthForm({
  action,
  mode,
  callbackUrl,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  mode: "login" | "register";
  callbackUrl?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="surface mt-6 space-y-4 p-5">
      {mode === "register" ? (
        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input className="field" id="name" name="name" required autoComplete="name" />
        </div>
      ) : null}
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          className="field"
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          className="field"
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </div>
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
      {state.error ? (
        <p className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--bad)]">
          {state.error}
        </p>
      ) : null}
      <button className="btn btn-primary w-full" type="submit" disabled={pending}>
        {pending ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
