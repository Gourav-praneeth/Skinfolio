import { describe, expect, it } from "vitest";
import {
  applyMoisturizerPlan,
  isMoisturizerStep,
  planMoisturizerReplace,
  type MoisturizerStep,
} from "./moisturizer-replace";

function step(
  partial: Partial<MoisturizerStep> & { id: string },
): MoisturizerStep {
  return {
    order: 0,
    productId: null,
    category: null,
    label: null,
    ...partial,
  };
}

describe("isMoisturizerStep", () => {
  it("detects by category and label", () => {
    expect(isMoisturizerStep(step({ id: "1", category: "moisturizer" }))).toBe(true);
    expect(isMoisturizerStep(step({ id: "2", label: "Moisturizer" }))).toBe(true);
    expect(isMoisturizerStep(step({ id: "3", label: "moisturiser cream" }))).toBe(true);
    expect(isMoisturizerStep(step({ id: "4", category: "cleanser" }))).toBe(false);
  });
});

describe("planMoisturizerReplace", () => {
  it("inserts when no moisturizer exists", () => {
    const plan = planMoisturizerReplace([
      step({ id: "c", order: 0, category: "cleanser", productId: "p1" }),
      step({ id: "s", order: 1, category: "spf", productId: "p2" }),
    ]);
    expect(plan).toEqual({ action: "insert", reason: "no_existing_moisturizer" });
  });

  it("replaces single moisturizer without confirmation", () => {
    const plan = planMoisturizerReplace([
      step({ id: "c", order: 0, category: "cleanser", productId: "p1" }),
      step({ id: "m", order: 1, category: "moisturizer", productId: "old-m" }),
    ]);
    expect(plan.action).toBe("replace");
    if (plan.action === "replace") {
      expect(plan.targetStepId).toBe("m");
      expect(plan.requiresConfirmation).toBe(false);
      expect(plan.reason).toBe("single_moisturizer");
      expect(plan.replacedProductIds).toEqual(["old-m"]);
      expect(plan.extraMoisturizerStepIds).toEqual([]);
    }
  });

  it("requires confirmation when multiple moisturizers exist", () => {
    const plan = planMoisturizerReplace([
      step({ id: "m1", order: 0, category: "moisturizer", productId: "a" }),
      step({ id: "m2", order: 1, category: "moisturizer", productId: "b" }),
      step({ id: "m3", order: 2, label: "Night moisturiser" }),
    ]);
    expect(plan.action).toBe("replace");
    if (plan.action === "replace") {
      expect(plan.targetStepId).toBe("m1"); // primary = lowest order
      expect(plan.requiresConfirmation).toBe(true);
      expect(plan.extraMoisturizerStepIds).toEqual(["m2", "m3"]);
      expect(plan.reason).toBe("multiple_moisturizers");
    }
  });

  it("confirmMultiple collapses extras in the plan", () => {
    const plan = planMoisturizerReplace(
      [
        step({ id: "m1", order: 1, category: "moisturizer", productId: "a" }),
        step({ id: "m0", order: 0, category: "moisturizer", productId: "b" }),
      ],
      { confirmMultiple: true },
    );
    expect(plan.action).toBe("replace");
    if (plan.action === "replace") {
      expect(plan.targetStepId).toBe("m0");
      expect(plan.requiresConfirmation).toBe(false);
      expect(plan.extraMoisturizerStepIds).toEqual(["m1"]);
    }
  });
});

describe("applyMoisturizerPlan", () => {
  it("inserts a new moisturizer step", () => {
    const base = [step({ id: "c", order: 0, category: "cleanser", productId: "p1" })];
    const plan = planMoisturizerReplace(base);
    const next = applyMoisturizerPlan(base, "new-m", plan);
    expect(next).toHaveLength(2);
    expect(next[1]?.productId).toBe("new-m");
    expect(next[1]?.category).toBe("moisturizer");
  });

  it("replaces primary moisturizer product id", () => {
    const base = [
      step({ id: "c", order: 0, category: "cleanser", productId: "p1" }),
      step({ id: "m", order: 1, category: "moisturizer", productId: "old" }),
    ];
    const plan = planMoisturizerReplace(base);
    const next = applyMoisturizerPlan(base, "fresh", plan);
    expect(next).toHaveLength(2);
    expect(next.find((s) => s.id === "m")?.productId).toBe("fresh");
  });

  it("with confirmation removes extra moisturizer slots", () => {
    const base = [
      step({ id: "m1", order: 0, category: "moisturizer", productId: "a" }),
      step({ id: "m2", order: 1, category: "moisturizer", productId: "b" }),
      step({ id: "spf", order: 2, category: "spf", productId: "s" }),
    ];
    const plan = planMoisturizerReplace(base, { confirmMultiple: true });
    const next = applyMoisturizerPlan(base, "fresh", plan);
    expect(next.map((s) => s.id)).toEqual(["m1", "spf"]);
    expect(next[0]?.productId).toBe("fresh");
    expect(next.map((s) => s.order)).toEqual([0, 1]);
  });

  it("without confirmation keeps extras after primary replace", () => {
    const base = [
      step({ id: "m1", order: 0, category: "moisturizer", productId: "a" }),
      step({ id: "m2", order: 1, category: "moisturizer", productId: "b" }),
    ];
    const plan = planMoisturizerReplace(base); // requiresConfirmation true
    expect(plan.action).toBe("replace");
    if (plan.action !== "replace") return;
    expect(plan.requiresConfirmation).toBe(true);
    // applyMoisturizerPlan should not be used to force replace when confirmation pending;
    // when called anyway with this plan, extras stay because requiresConfirmation is true
    const next = applyMoisturizerPlan(base, "fresh", plan);
    expect(next).toHaveLength(2);
    expect(next.find((s) => s.id === "m1")?.productId).toBe("fresh");
    expect(next.find((s) => s.id === "m2")?.productId).toBe("b");
  });
});
