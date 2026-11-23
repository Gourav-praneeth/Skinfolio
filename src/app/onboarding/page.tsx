import { redirect } from "next/navigation";
import { requireUser, getProfile } from "@/lib/session";
import { saveOnboardingAction } from "@/actions/profile";
import {
  SKIN_TYPES,
  CONCERNS,
  GOALS,
  CLIMATES,
  DISCLAIMER_FULL,
} from "@/lib/constants";
import { BrandMark } from "@/components/BrandMark";

export default async function OnboardingPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (profile?.onboardingDone && profile.disclaimerAck) {
    redirect("/home");
  }

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-4 py-8">
      <BrandMark
        size="md"
        subtitle="About 5–10 minutes: disclaimer → profile → then build your shelf on Routine."
      />

      <form action={saveOnboardingAction} className="mt-8 space-y-6">
        <section className="surface space-y-3 p-5 animate-rise">
          <h2 className="font-display text-xl text-[var(--brand-deep)]">1 · Disclaimer</h2>
          <p className="whitespace-pre-wrap text-sm text-[var(--ink-soft)]">{DISCLAIMER_FULL}</p>
          <label className="chip cursor-pointer">
            <input type="checkbox" name="disclaimerAck" required className="mr-1" />I understand —
            not a doctor / not a diagnosis
          </label>
        </section>

        <section className="surface space-y-3 p-5 animate-rise-delay">
          <h2 className="font-display text-xl text-[var(--brand-deep)]">2 · Skin profile</h2>
          <div>
            <label className="label" htmlFor="skinType">
              Skin type
            </label>
            <select className="field" id="skinType" name="skinType" defaultValue="unsure">
              {SKIN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <fieldset>
            <legend className="label">Primary concerns</legend>
            <div className="flex flex-wrap gap-2">
              {CONCERNS.map((c) => (
                <label key={c} className="chip cursor-pointer">
                  <input type="checkbox" name="concerns" value={c} className="mr-1" />
                  {c}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label className="label" htmlFor="allergies">
              Allergies / avoid list
            </label>
            <input
              className="field"
              id="allergies"
              name="allergies"
              placeholder="fragrance, niacinamide…"
            />
          </div>
        </section>

        <section className="surface space-y-3 p-5">
          <h2 className="font-display text-xl text-[var(--brand-deep)]">3 · Constraints</h2>
          <label className="chip cursor-pointer">
            <input type="checkbox" name="pregnantNursing" className="mr-1" />
            Pregnant / nursing / trying
          </label>
          <input className="field" name="pregnantNote" placeholder="Optional note" />
          <label className="chip cursor-pointer">
            <input type="checkbox" name="usesRetinoid" className="mr-1" />
            Known retinoid / Rx actives
          </label>
          <input className="field" name="retinoidNote" placeholder="Optional details" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="climate">
                Climate
              </label>
              <select className="field" id="climate" name="climate" defaultValue="variable">
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
              <input className="field" id="city" name="city" />
            </div>
          </div>
        </section>

        <section className="surface space-y-3 p-5">
          <h2 className="font-display text-xl text-[var(--brand-deep)]">4 · Goals</h2>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <label key={g} className="chip cursor-pointer">
                <input type="checkbox" name="goals" value={g} className="mr-1" />
                {g}
              </label>
            ))}
          </div>
          <textarea
            className="field min-h-20"
            name="goalsNote"
            placeholder="Anything else the coach should know?"
          />
        </section>

        <button className="btn btn-primary w-full" type="submit">
          Save & go to Home
        </button>
        <p className="text-center text-xs text-[var(--muted)]">
          Next: add shelf products and AM/PM on the Routine tab. No paywall.
        </p>
      </form>
    </main>
  );
}
