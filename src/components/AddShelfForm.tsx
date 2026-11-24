"use client";

import { useState } from "react";
import { addProductAction } from "@/actions/shelf";

export function AddShelfForm() {
  const [category, setCategory] = useState("cleanser");
  const [placeAm, setPlaceAm] = useState(false);
  const [placePm, setPlacePm] = useState(false);

  const placeIn = [placeAm ? "AM" : null, placePm ? "PM" : null].filter(Boolean).join(",");

  return (
    <form action={addProductAction} className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="name">
          Product name
        </label>
        <input className="field" id="name" name="name" required placeholder="Cleanser you already own" />
      </div>
      <div>
        <label className="label" htmlFor="brand">
          Brand (optional)
        </label>
        <input className="field" id="brand" name="brand" />
      </div>
      <div>
        <label className="label" htmlFor="category">
          Category
        </label>
        <select
          className="field"
          id="category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="cleanser">Cleanser</option>
          <option value="treatment">Treatment</option>
          <option value="moisturizer">Moisturizer</option>
          <option value="spf">SPF</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="openedDate">
          Opened date
        </label>
        <input className="field" id="openedDate" name="openedDate" type="date" />
      </div>
      <div>
        <label className="label" htmlFor="expiryDate">
          Expiry date
        </label>
        <input className="field" id="expiryDate" name="expiryDate" type="date" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="ingredients">
          Key ingredients / INCI (optional)
        </label>
        <textarea className="field min-h-20" id="ingredients" name="ingredients" />
      </div>
      {category === "moisturizer" ? (
        <div className="sm:col-span-2 space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface-solid)] p-3">
          <p className="text-xs font-semibold text-[var(--ink-soft)]">
            Place in routine (replaces existing moisturizer slot)
          </p>
          <div className="flex flex-wrap gap-2">
            <label className="chip cursor-pointer">
              <input
                type="checkbox"
                className="mr-1"
                checked={placeAm}
                onChange={(e) => setPlaceAm(e.target.checked)}
              />
              AM
            </label>
            <label className="chip cursor-pointer">
              <input
                type="checkbox"
                className="mr-1"
                checked={placePm}
                onChange={(e) => setPlacePm(e.target.checked)}
              />
              PM
            </label>
          </div>
          <label className="chip cursor-pointer text-xs">
            <input type="checkbox" name="confirmReplaceMultiple" className="mr-1" />
            If multiple moisturizers exist, collapse extras to one slot
          </label>
          <input type="hidden" name="placeIn" value={placeIn} />
        </div>
      ) : null}
      <button className="btn btn-primary sm:col-span-2" type="submit">
        Add to shelf
      </button>
    </form>
  );
}
