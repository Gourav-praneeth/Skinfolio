import { describe, expect, it } from "vitest";
import { applyOrderedIds, moveStep, ordersEqual } from "./routine-order";

const steps = [
  { id: "a", order: 0 },
  { id: "b", order: 1 },
  { id: "c", order: 2 },
];

describe("moveStep", () => {
  it("moves a step up and reindexes", () => {
    const next = moveStep(steps, "c", "up");
    expect(next.map((s) => s.id)).toEqual(["a", "c", "b"]);
    expect(next.map((s) => s.order)).toEqual([0, 1, 2]);
  });

  it("moves a step down", () => {
    const next = moveStep(steps, "a", "down");
    expect(next.map((s) => s.id)).toEqual(["b", "a", "c"]);
  });

  it("no-ops at boundaries", () => {
    expect(moveStep(steps, "a", "up").map((s) => s.id)).toEqual(["a", "b", "c"]);
    expect(moveStep(steps, "c", "down").map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("unknown id returns normalized order without crash", () => {
    const next = moveStep(steps, "missing", "up");
    expect(next.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate input", () => {
    const copy = steps.map((s) => ({ ...s }));
    moveStep(steps, "b", "up");
    expect(steps).toEqual(copy);
  });

  it("persisted order round-trip: two moves restore original", () => {
    const once = moveStep(steps, "b", "up"); // b,a,c
    const twice = moveStep(once, "b", "down"); // a,b,c
    expect(twice.map((s) => s.id)).toEqual(["a", "b", "c"]);
    expect(ordersEqual(twice, steps)).toBe(true);
  });
});

describe("applyOrderedIds", () => {
  it("applies drag order and appends missing ids", () => {
    const next = applyOrderedIds(steps, ["c", "a"]);
    expect(next.map((s) => s.id)).toEqual(["c", "a", "b"]);
    expect(next.map((s) => s.order)).toEqual([0, 1, 2]);
  });

  it("ignores unknown and duplicate ids", () => {
    const next = applyOrderedIds(steps, ["b", "b", "zzz", "a", "c"]);
    expect(next.map((s) => s.id)).toEqual(["b", "a", "c"]);
  });
});
