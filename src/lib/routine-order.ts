export type OrderableStep = {
  id: string;
  order: number;
};

/**
 * Reorder steps within one period. Returns a new array with contiguous
 * `order` values 0..n-1 reflecting the move. Does not mutate input.
 */
export function moveStep(
  steps: OrderableStep[],
  stepId: string,
  direction: "up" | "down",
): OrderableStep[] {
  const sorted = [...steps].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const index = sorted.findIndex((s) => s.id === stepId);
  if (index < 0) {
    return sorted.map((s, i) => ({ id: s.id, order: i }));
  }

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= sorted.length) {
    return sorted.map((s, i) => ({ id: s.id, order: i }));
  }

  const next = [...sorted];
  const tmp = next[index]!;
  next[index] = next[target]!;
  next[target] = tmp;

  return next.map((s, i) => ({ id: s.id, order: i }));
}

/**
 * Apply an explicit ordered id list (e.g. from drag-and-drop).
 * Unknown ids are ignored; missing existing ids are appended at the end.
 */
export function applyOrderedIds(
  steps: OrderableStep[],
  orderedIds: string[],
): OrderableStep[] {
  const byId = new Map(steps.map((s) => [s.id, s]));
  const seen = new Set<string>();
  const result: OrderableStep[] = [];

  for (const id of orderedIds) {
    if (!byId.has(id) || seen.has(id)) continue;
    seen.add(id);
    result.push({ id, order: result.length });
  }

  for (const s of [...steps].sort((a, b) => a.order - b.order)) {
    if (seen.has(s.id)) continue;
    result.push({ id: s.id, order: result.length });
  }

  return result;
}

export function ordersEqual(
  a: OrderableStep[],
  b: OrderableStep[],
): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x.order - y.order);
  const sb = [...b].sort((x, y) => x.order - y.order);
  return sa.every((step, i) => step.id === sb[i]?.id && step.order === sb[i]?.order);
}
