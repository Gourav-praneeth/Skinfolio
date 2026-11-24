import OpenAI from "openai";
import { DISCLAIMER_SHORT, PREGNANCY_CAUTION_INGREDIENTS } from "@/lib/constants";

export type CoachContext = {
  profile: {
    skinType: string | null;
    concerns: string[];
    allergies: string[];
    pregnantNursing: boolean;
    pregnantNote: string | null;
    usesRetinoid: boolean;
    retinoidNote: string | null;
    climate: string | null;
    city: string | null;
    goals: string[];
    goalsNote: string | null;
  };
  shelf: Array<{ name: string; brand: string | null; category: string; ingredients: string | null }>;
  routine: { AM: string[]; PM: string[] };
  journal: Array<{ date: string; tags: string[]; notes: string | null }>;
};

const SYSTEM = `You are Skinfolio, a brand-neutral personal skincare coach and journal companion.

Rules:
- You are NOT a doctor. Never diagnose disease. Prefer uncertainty language (“possible”, “might”, “lighting/context matters”).
- Ground answers in the user's profile, shelf, routine, and recent journal. Cite their data when relevant (“you listed fragrance under avoid”).
- Prefer structured, actionable advice (bullet steps). Keep replies concise for mobile.
- Pregnancy / nursing: refuse retinoids, high-dose salicylic acid, hydroquinone, and similar contraindicated suggestions. Redirect to a clinician.
- Red flags (mole change, severe infection signs, sudden widespread rash, eye involvement): do not troubleshoot — urge in-person care.
- Never push a specific storefront or affiliate product. Multi-brand literacy only.
- If context is missing, say what you need rather than inventing their shelf.
- Always keep a brief reminder that this is education, not medical care.

${DISCLAIMER_SHORT}`;

function buildContextBlock(ctx: CoachContext): string {
  return [
    "USER CONTEXT (authoritative for this session):",
    JSON.stringify(ctx, null, 2),
    "",
    `Pregnancy gate active: ${ctx.profile.pregnantNursing}`,
    `Allergy tags: ${ctx.profile.allergies.join(", ") || "(none)"}`,
    `Pregnancy caution ingredients list: ${PREGNANCY_CAUTION_INGREDIENTS.join(", ")}`,
  ].join("\n");
}

export function offlineCoachReply(message: string, ctx: CoachContext): string {
  const lower = message.toLowerCase();
  const lines: string[] = [];

  lines.push(
    "I'm running in offline coach mode (no OPENAI_API_KEY). Here is a careful, context-based reply — not a diagnosis.",
  );

  if (ctx.profile.pregnantNursing) {
    if (PREGNANCY_CAUTION_INGREDIENTS.some((i) => lower.includes(i.split(" ")[0]!))) {
      lines.push(
        "",
        "**Safety:** Your profile marks pregnancy/nursing. I will not suggest retinoids, high-dose salicylic acid, hydroquinone, or similar actives. Please confirm any active with your clinician.",
      );
    }
  }

  if (/mole|infection|oozing|widespread rash|swelling of (the )?eye/.test(lower)) {
    return [
      "That sounds like something to have a clinician evaluate in person rather than troubleshoot in chat.",
      DISCLAIMER_SHORT,
    ].join("\n\n");
  }

  lines.push("");
  lines.push(`Your skin type is logged as **${ctx.profile.skinType ?? "unsure"}**.`);
  if (ctx.profile.concerns.length) {
    lines.push(`Primary concerns: ${ctx.profile.concerns.join(", ")}.`);
  }
  if (ctx.profile.allergies.length) {
    lines.push(`Avoid tags: ${ctx.profile.allergies.join(", ")}.`);
  }
  if (ctx.shelf.length) {
    lines.push(
      `Shelf snapshot: ${ctx.shelf
        .slice(0, 6)
        .map((p) => p.name)
        .join(", ")}${ctx.shelf.length > 6 ? "…" : ""}.`,
    );
  } else {
    lines.push("Your shelf is empty — add products so advice can reference what you already own.");
  }

  if (/spf|sunscreen|sun/.test(lower)) {
    lines.push(
      "",
      "For SPF: morning, last step of AM, reapply if outdoors. If you already own one on your shelf, use that rather than buying new.",
    );
  } else if (/pm|too strong|irritat|barrier/.test(lower)) {
    lines.push(
      "",
      "If PM feels strong: drop one active for a few nights, keep cleanser + moisturizer, and reintroduce slowly. Uncertainty: irritation has many causes (climate, new product, over-exfoliation).",
    );
  } else {
    lines.push(
      "",
      "Ask about a specific product, clash, or routine step. With an API key configured, answers get richer while keeping the same safety rules.",
    );
  }

  lines.push("", DISCLAIMER_SHORT);
  return lines.join("\n");
}

export async function coachReply(
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  ctx: CoachContext,
): Promise<{ content: string; provider: "openai" | "offline" }> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return { content: offlineCoachReply(message, ctx), provider: "offline" };
  }

  try {
    const client = new OpenAI({ apiKey: key });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "system", content: buildContextBlock(ctx) },
        ...history.slice(-12),
        { role: "user", content: message },
      ],
    });
    const content =
      completion.choices[0]?.message?.content?.trim() ||
      offlineCoachReply(message, ctx);
    return { content, provider: "openai" };
  } catch {
    return {
      content:
        offlineCoachReply(message, ctx) +
        "\n\n_(OpenAI request failed — fell back to offline coach.)_",
      provider: "offline",
    };
  }
}
