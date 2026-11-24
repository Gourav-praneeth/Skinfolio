import {
  PREGNANCY_CAUTION_INGREDIENTS,
  CLASH_PAIRS,
} from "@/lib/constants";

export type ProfileSnapshot = {
  skinType: string | null;
  concerns: string[];
  allergies: string[];
  pregnantNursing: boolean;
  usesRetinoid: boolean;
  climate: string | null;
};

export type ProductCheckResult = {
  verdict: "likely_ok" | "caution" | "avoid" | "uncertain";
  summary: string;
  notes: string[];
  matchedAllergies: string[];
  pregnancyFlags: string[];
  uncertainty: string[];
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function runProductCheck(
  input: { name?: string; ingredients?: string },
  profile: ProfileSnapshot,
): ProductCheckResult {
  const blob = normalize(`${input.name ?? ""}\n${input.ingredients ?? ""}`);
  const notes: string[] = [];
  const matchedAllergies: string[] = [];
  const pregnancyFlags: string[] = [];
  const uncertainty: string[] = [];

  if (!blob) {
    return {
      verdict: "uncertain",
      summary: "Nothing to check — paste a product name and/or INCI list.",
      notes: [],
      matchedAllergies: [],
      pregnancyFlags: [],
      uncertainty: ["Empty input"],
    };
  }

  if (!input.ingredients || input.ingredients.trim().length < 8) {
    uncertainty.push(
      "INCI list looks incomplete or missing — compatibility notes may miss allergens or actives.",
    );
  }

  for (const tag of profile.allergies) {
    const t = normalize(tag);
    if (t && blob.includes(t)) {
      matchedAllergies.push(tag);
      notes.push(`Matches your avoid tag “${tag}”.`);
    }
  }

  if (profile.pregnantNursing) {
    for (const ing of PREGNANCY_CAUTION_INGREDIENTS) {
      if (blob.includes(ing)) {
        pregnancyFlags.push(ing);
      }
    }
    if (pregnancyFlags.length) {
      notes.push(
        `Pregnancy/nursing is on your profile — flagged: ${pregnancyFlags.join(", ")}. Skip these unless a clinician cleared them for you.`,
      );
    }
  }

  if (profile.concerns.includes("sensitivity") || profile.concerns.includes("barrier")) {
    if (/fragrance|parfum|essential oil|alcohol denat/i.test(blob)) {
      notes.push(
        "Fragrance / denatured alcohol show up often as irritants for sensitive or barrier-compromised skin — proceed gently.",
      );
    }
  }

  if (profile.skinType === "dry" && /benzoyl peroxide|high.?% salicylic/i.test(blob)) {
    notes.push("Dry skin + strong drying actives can feel harsh — buffer with moisturizer if you try it.");
  }

  if (profile.skinType === "oily" && /heavy oil|mineral oil|petrolatum/i.test(blob) && /face|facial/i.test(blob)) {
    notes.push("Occlusive oils can feel heavy on oily skin — not inherently bad, just a texture fit note.");
  }

  for (const [a, b, tip] of CLASH_PAIRS) {
    if (a.test(blob) && b.test(blob)) {
      notes.push(tip);
    }
  }

  let verdict: ProductCheckResult["verdict"] = "likely_ok";
  if (matchedAllergies.length || (profile.pregnantNursing && pregnancyFlags.length)) {
    verdict = "avoid";
  } else if (notes.length) {
    verdict = "caution";
  } else if (uncertainty.length) {
    verdict = "uncertain";
  }

  const summary =
    verdict === "avoid"
      ? "Avoid or get clinician clearance — conflicts with your constraints."
      : verdict === "caution"
        ? "Possible fit with caveats — review the notes against how your skin usually reacts."
        : verdict === "uncertain"
          ? "Not enough ingredient detail for a confident read."
          : "No hard conflicts found vs your saved profile (still not a guarantee).";

  notes.push(
    "Brand-neutral check only — Skinfolio never pushes a storefront SKU. This is literacy, not a diagnosis.",
  );

  return { verdict, summary, notes, matchedAllergies, pregnancyFlags, uncertainty };
}
