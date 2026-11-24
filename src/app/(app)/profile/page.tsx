import { requireOnboarded } from "@/lib/session";
import { parseJsonArray } from "@/lib/dates";
import {
  SKIN_TYPES,
  CONCERNS,
  GOALS,
  CLIMATES,
} from "@/lib/constants";
import { updateProfileAction } from "@/actions/profile";
import { DisclaimerStrip } from "@/components/Disclaimer";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { profile } = await requireOnboarded();
  const { saved } = await searchParams;
  const concerns = parseJsonArray(profile.concerns);
  const goals = parseJsonArray(profile.goals);
  const allergies = parseJsonArray(profile.allergies);

  return (
    <main className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Constraints
        </p>
        <h1 className="font-display mt-1 text-3xl text-[var(--brand-deep)]">Profile</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Coach and product check read this snapshot server-side.
        </p>
        {saved ? (
          <p className="mt-2 text-sm font-semibold text-[var(--ok)]">Saved.</p>
        ) : null}
      </header>

      <form action={updateProfileAction} className="surface space-y-5 p-5">
        <div>
          <label className="label" htmlFor="skinType">
            Skin type
          </label>
          <select
            className="field"
            id="skinType"
            name="skinType"
            defaultValue={profile.skinType ?? "unsure"}
          >
            {SKIN_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="label">Concerns</legend>
          <div className="flex flex-wrap gap-2">
            {CONCERNS.map((c) => (
              <label key={c} className="chip cursor-pointer">
                <input
                  type="checkbox"
                  name="concerns"
                  value={c}
                  defaultChecked={concerns.includes(c)}
                  className="mr-1"
                />
                {c}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="label" htmlFor="allergies">
            Allergies / avoid tags
          </label>
          <input
            className="field"
            id="allergies"
            name="allergies"
            defaultValue={allergies.join(", ")}
            placeholder="fragrance, niacinamide, lanolin"
          />
        </div>

        <label className="chip cursor-pointer">
          <input
            type="checkbox"
            name="pregnantNursing"
            defaultChecked={profile.pregnantNursing}
            className="mr-1"
          />
          Pregnant / nursing / trying
        </label>
        <input
          className="field"
          name="pregnantNote"
          defaultValue={profile.pregnantNote ?? ""}
          placeholder="Optional note"
        />

        <label className="chip cursor-pointer">
          <input
            type="checkbox"
            name="usesRetinoid"
            defaultChecked={profile.usesRetinoid}
            className="mr-1"
          />
          Using retinoid / Rx actives
        </label>
        <input
          className="field"
          name="retinoidNote"
          defaultValue={profile.retinoidNote ?? ""}
          placeholder="e.g. tretinoin 0.025%"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="climate">
              Climate
            </label>
            <select
              className="field"
              id="climate"
              name="climate"
              defaultValue={profile.climate ?? ""}
            >
              <option value="">—</option>
              {CLIMATES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="city">
              City (optional)
            </label>
            <input className="field" id="city" name="city" defaultValue={profile.city ?? ""} />
          </div>
        </div>

        <fieldset>
          <legend className="label">Goals</legend>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <label key={g} className="chip cursor-pointer">
                <input
                  type="checkbox"
                  name="goals"
                  value={g}
                  defaultChecked={goals.includes(g)}
                  className="mr-1"
                />
                {g}
              </label>
            ))}
          </div>
        </fieldset>
        <textarea
          className="field min-h-20"
          name="goalsNote"
          defaultValue={profile.goalsNote ?? ""}
          placeholder="Short free-text goal"
        />

        <button className="btn btn-primary" type="submit">
          Save profile
        </button>
      </form>

      <DisclaimerStrip />
    </main>
  );
}
