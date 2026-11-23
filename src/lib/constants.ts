export const SKIN_TYPES = ["dry", "oily", "combination", "normal", "unsure"] as const;

export const CONCERNS = [
  "acne",
  "dryness",
  "sensitivity",
  "pigmentation",
  "aging",
  "redness",
  "barrier",
  "other",
] as const;

export const GOALS = [
  "simplify routine",
  "clear acne",
  "gentler barrier",
  "even tone",
  "hydrate",
  "sun protection habit",
] as const;

export const CLIMATES = ["humid", "dry", "cold", "variable"] as const;

export const PRODUCT_CATEGORIES = [
  "cleanser",
  "treatment",
  "moisturizer",
  "spf",
  "other",
] as const;

export const JOURNAL_TAGS = ["calm", "irritated", "oily", "dry", "breakout"] as const;

export const DISCLAIMER_SHORT =
  "Skinfolio is not a doctor and does not diagnose or treat medical conditions. When in doubt, see a clinician.";

export const DISCLAIMER_FULL = `Skinfolio is a personal skincare coach and journal — not a medical device, not FDA-cleared, and not a substitute for professional care.

We do not diagnose disease from photos or chat. Answers may be incomplete or wrong. Pregnancy, nursing, prescription actives, allergies, and sudden skin changes (mole changes, severe infection signs, widespread rash) require a qualified clinician.

By using Skinfolio you acknowledge this limitation. There are no paywalls in this MVP — the core coach, journal, shelf, and product check stay free.`;

/** Ingredients that should be flagged when pregnancy/nursing is on */
export const PREGNANCY_CAUTION_INGREDIENTS = [
  "retinol",
  "retinal",
  "retinaldehyde",
  "tretinoin",
  "adapalen",
  "adapalene",
  "tazarotene",
  "isotretinoin",
  "retinoid",
  "salicylic acid",
  "bha",
  "hydroquinone",
  "benzoyl peroxide",
  "high-dose salicylic",
];

export const CLASH_PAIRS: Array<[RegExp, RegExp, string]> = [
  [
    /retinol|retinoid|tretinoin|adapalen/i,
    /aha|glycolic|lactic|mandelic|salicylic|bha/i,
    "Strong retinoid + AHA/BHA the same night can overwhelm the barrier — consider alternating nights.",
  ],
  [
    /benzoyl peroxide/i,
    /retinol|retinoid|tretinoin/i,
    "Benzoyl peroxide can oxidize some retinoids; separate AM/PM or ask your clinician about stacking.",
  ],
  [
    /vitamin c|ascorbic/i,
    /retinol|retinoid|tretinoin/i,
    "Vitamin C + retinoid the same session can irritate sensitive skin — many people split AM/PM.",
  ],
];
