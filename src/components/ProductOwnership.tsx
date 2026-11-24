import { getProductDateStatus } from "@/lib/product-dates";
import { updateProductDatesAction } from "@/actions/shelf";

export function ProductOwnership({
  productId,
  openedDate,
  expiryDate,
  today,
}: {
  productId: string;
  openedDate: string | null;
  expiryDate: string | null;
  today?: string;
}) {
  const status = getProductDateStatus(openedDate, expiryDate, today);

  return (
    <div className="mt-2 space-y-2 text-xs text-[var(--ink-soft)]">
      <p>{status.labels.inUse}</p>
      <p className={status.expired ? "font-semibold text-[var(--bad)]" : ""}>
        {status.labels.expiry}
      </p>
      {status.labels.warning ? (
        <p className="font-semibold text-[var(--warn)]">{status.labels.warning}</p>
      ) : null}
      <form action={updateProductDatesAction} className="flex flex-wrap items-end gap-2 pt-1">
        <input type="hidden" name="id" value={productId} />
        <div>
          <label className="label" htmlFor={`opened-${productId}`}>
            Opened
          </label>
          <input
            className="field py-1.5 text-xs"
            id={`opened-${productId}`}
            name="openedDate"
            type="date"
            defaultValue={status.openedDate ?? ""}
          />
        </div>
        <div>
          <label className="label" htmlFor={`expiry-${productId}`}>
            Expiry
          </label>
          <input
            className="field py-1.5 text-xs"
            id={`expiry-${productId}`}
            name="expiryDate"
            type="date"
            defaultValue={status.expiryDate ?? ""}
          />
        </div>
        <button className="btn btn-ghost text-xs" type="submit">
          Save dates
        </button>
      </form>
    </div>
  );
}
