export type MoisturizerStep = {
  id: string;
  order: number;
  productId: string | null;
  /** Product category when linked; null for free-text steps. */
  category: string | null;
  /** Free-text label — used as fallback moisturizer detection. */
  label: string | null;
};

export type MoisturizerReplacePlan =
  | {
      action: "insert";
      reason: "no_existing_moisturizer";
    }
  | {
      action: "replace";
      targetStepId: string;
      replacedProductIds: string[];
      /** Extra moisturizer steps beyond the primary. */
      extraMoisturizerStepIds: string[];
      /**
       * True when multiple moisturizer slots exist and the caller has not
       * confirmed collapsing them to one primary slot.
       */
      requiresConfirmation: boolean;
      reason: "single_moisturizer" | "multiple_moisturizers";
    };

const MOISTURIZER_LABEL = /moisturi[sz]er/i;

export function isMoisturizerStep(step: MoisturizerStep): boolean {
  if (step.category === "moisturizer") return true;
  if (step.label && MOISTURIZER_LABEL.test(step.label)) return true;
  return false;
}

/**
 * Decide how to place a new moisturizer into a period's routine.
 * Primary slot = lowest `order` moisturizer step.
 */
export function planMoisturizerReplace(
  periodSteps: MoisturizerStep[],
  opts: { confirmMultiple?: boolean } = {},
): MoisturizerReplacePlan {
  const moisturizers = [...periodSteps]
    .filter(isMoisturizerStep)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

  if (moisturizers.length === 0) {
    return { action: "insert", reason: "no_existing_moisturizer" };
  }

  const primary = moisturizers[0]!;
  const extras = moisturizers.slice(1);
  const requiresConfirmation = extras.length > 0 && !opts.confirmMultiple;

  return {
    action: "replace",
    targetStepId: primary.id,
    replacedProductIds: moisturizers
      .map((m) => m.productId)
      .filter((id): id is string => Boolean(id)),
    extraMoisturizerStepIds: extras.map((m) => m.id),
    requiresConfirmation,
    reason: extras.length > 0 ? "multiple_moisturizers" : "single_moisturizer",
  };
}

/**
 * Apply a replace plan to an in-memory step list for a period.
 * When replacing with confirmation granted (or single slot), extra moisturizer
 * slots are removed so one primary remains.
 */
export function applyMoisturizerPlan(
  periodSteps: MoisturizerStep[],
  newProductId: string,
  plan: MoisturizerReplacePlan,
): MoisturizerStep[] {
  if (plan.action === "insert") {
    const maxOrder = periodSteps.reduce((m, s) => Math.max(m, s.order), -1);
    return [
      ...periodSteps.map((s, i) => ({ ...s, order: i })),
      {
        id: `new-${newProductId}`,
        order: Math.max(periodSteps.length, maxOrder + 1),
        productId: newProductId,
        category: "moisturizer",
        label: null,
      },
    ].map((s, i) => ({ ...s, order: i }));
  }

  let next = periodSteps.map((s) => {
    if (s.id !== plan.targetStepId) return s;
    return {
      ...s,
      productId: newProductId,
      category: "moisturizer" as const,
      label: null,
    };
  });

  // Collapse extras when confirmation is not still required
  if (!plan.requiresConfirmation && plan.extraMoisturizerStepIds.length > 0) {
    const drop = new Set(plan.extraMoisturizerStepIds);
    next = next.filter((s) => !drop.has(s.id));
  }

  return next.map((s, i) => ({ ...s, order: i }));
}
