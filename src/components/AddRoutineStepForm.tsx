"use client";

import { useMemo, useState, useTransition } from "react";
import { addRoutineStepAction } from "@/actions/routine";
import { useRouter } from "next/navigation";

type ProductOption = { id: string; name: string; category: string };

export function AddRoutineStepForm({
  period,
  products,
  moisturizerCount,
}: {
  period: "AM" | "PM";
  products: ProductOption[];
  moisturizerCount: number;
}) {
  const router = useRouter();
  const [productId, setProductId] = useState("");
  const [label, setLabel] = useState("");
  const [confirmMultiple, setConfirmMultiple] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  );
  const isMoisturizer = selected?.category === "moisturizer";
  const needsConfirm = isMoisturizer && moisturizerCount > 1;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData();
    fd.set("period", period);
    if (productId) fd.set("productId", productId);
    if (label.trim()) fd.set("label", label.trim());
    if (confirmMultiple) fd.set("confirmReplaceMultiple", "on");

    startTransition(async () => {
      const result = await addRoutineStepAction(fd);
      if (result && "ok" in result && !result.ok) {
        setMessage(result.error);
        return;
      }
      if (result && result.ok && result.mode === "replaced") {
        setMessage(`Replaced the ${period} moisturizer slot.`);
      }
      setProductId("");
      setLabel("");
      setConfirmMultiple(false);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <select
          className="field"
          name="productId"
          value={productId}
          onChange={(e) => {
            setProductId(e.target.value);
            setMessage(null);
            setConfirmMultiple(false);
          }}
        >
          <option value="">Shelf product…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.category === "moisturizer" ? " (moisturizer)" : ""}
            </option>
          ))}
        </select>
        <input
          className="field"
          name="label"
          placeholder="Or free-text step"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving…" : isMoisturizer && moisturizerCount > 0 ? "Replace / add" : "Add step"}
        </button>
      </div>
      {isMoisturizer ? (
        <p className="text-xs text-[var(--ink-soft)]">
          Moisturizers replace the primary moisturizer slot in {period}
          {moisturizerCount > 1
            ? ` (${moisturizerCount} moisturizer steps found — confirm to collapse extras).`
            : moisturizerCount === 1
              ? " (existing moisturizer will be replaced)."
              : " (none yet — will insert a new step)."}
        </p>
      ) : null}
      {needsConfirm ? (
        <label className="chip cursor-pointer text-xs">
          <input
            type="checkbox"
            className="mr-1"
            checked={confirmMultiple}
            onChange={(e) => setConfirmMultiple(e.target.checked)}
          />
          Confirm: replace primary & remove extra moisturizer steps in {period}
        </label>
      ) : null}
      {message ? <p className="text-xs text-[var(--warn)]">{message}</p> : null}
    </form>
  );
}
