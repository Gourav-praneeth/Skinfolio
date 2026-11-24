"use client";

import { useState, useTransition } from "react";
import { addProductFromCheckAction } from "@/actions/shelf";

type Result = {
  verdict: string;
  summary: string;
  notes: string[];
  matchedAllergies: string[];
  pregnancyFlags: string[];
  uncertainty: string[];
};

export function ProductCheckClient() {
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function check() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/product-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, ingredients }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Check failed");
          return;
        }
        setResult(data.result);
      } catch {
        setError("Network error");
      }
    });
  }

  const verdictColor =
    result?.verdict === "avoid"
      ? "var(--bad)"
      : result?.verdict === "caution"
        ? "var(--warn)"
        : result?.verdict === "uncertain"
          ? "var(--muted)"
          : "var(--ok)";

  return (
    <div className="space-y-4">
      <div className="surface space-y-3 p-5">
        <div>
          <label className="label" htmlFor="pname">
            Product name
          </label>
          <input
            id="pname"
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Brand X Retinol Serum"
          />
        </div>
        <div>
          <label className="label" htmlFor="inci">
            INCI / ingredients paste
          </label>
          <textarea
            id="inci"
            className="field min-h-32"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="Paste the ingredient list…"
          />
        </div>
        <button className="btn btn-primary" type="button" onClick={check} disabled={pending}>
          {pending ? "Checking…" : "Check vs my profile"}
        </button>
        {error ? <p className="text-sm text-[var(--bad)]">{error}</p> : null}
      </div>

      {result ? (
        <div className="surface space-y-3 p-5 animate-rise">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: verdictColor }}>
            {result.verdict.replace("_", " ")}
          </p>
          <p className="font-display text-xl text-[var(--brand-deep)]">{result.summary}</p>
          <ul className="space-y-2 text-sm text-[var(--ink-soft)]">
            {result.notes.map((n) => (
              <li key={n}>• {n}</li>
            ))}
            {result.uncertainty.map((u) => (
              <li key={u}>• Uncertainty: {u}</li>
            ))}
          </ul>
          <form action={addProductFromCheckAction} className="flex flex-wrap gap-2 pt-2">
            <input type="hidden" name="name" value={name || "Checked product"} />
            <input type="hidden" name="ingredients" value={ingredients} />
            <button className="btn btn-accent" type="submit">
              Add to shelf
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                setResult(null);
                setName("");
                setIngredients("");
              }}
            >
              Don&apos;t add
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
