/**
 * Product ownership / PAO helpers.
 * All calendar dates are YYYY-MM-DD strings in local civil time.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type ProductDateStatus = {
  openedDate: string | null;
  expiryDate: string | null;
  /** Whole days since opened (inclusive of open day as day 0). null if no opened date. */
  daysInUse: number | null;
  /** Whole days until expiry (0 = expires today). null if no expiry. Negative = already expired. */
  daysUntilExpiry: number | null;
  expired: boolean;
  /** Expiry is set and is strictly before opened — data quality issue. */
  expiryBeforeOpened: boolean;
  /** Short UI lines; empty when nothing useful to show. */
  labels: {
    inUse: string;
    expiry: string;
    warning: string | null;
  };
};

/** Parse YYYY-MM-DD to UTC noon Date, or null if invalid. */
export function parseDateKey(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!DATE_RE.test(trimmed)) return null;
  const [y, m, d] = trimmed.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return dt;
}

/** Whole-day difference: later − earlier (can be negative). */
export function daysBetween(earlier: Date, later: Date): number {
  const ms = later.getTime() - earlier.getTime();
  return Math.trunc(ms / 86_400_000);
}

export function normalizeOptionalDate(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return parseDateKey(trimmed) ? trimmed : null;
}

export function getProductDateStatus(
  openedDate: string | null | undefined,
  expiryDate: string | null | undefined,
  today: string | Date = new Date(),
): ProductDateStatus {
  const todayKey =
    typeof today === "string" ? today : formatDateKeyUTC(today);
  const todayDt = parseDateKey(todayKey) ?? new Date();

  const opened = normalizeOptionalDate(openedDate);
  const expiry = normalizeOptionalDate(expiryDate);
  const openedDt = parseDateKey(opened);
  const expiryDt = parseDateKey(expiry);

  const expiryBeforeOpened = Boolean(
    openedDt && expiryDt && expiryDt.getTime() < openedDt.getTime(),
  );

  let daysInUse: number | null = null;
  if (openedDt) {
    daysInUse = daysBetween(openedDt, todayDt);
    // Future opened date → treat as not yet in use
    if (daysInUse < 0) daysInUse = 0;
  }

  let daysUntilExpiry: number | null = null;
  let expired = false;
  if (expiryDt) {
    daysUntilExpiry = daysBetween(todayDt, expiryDt);
    expired = daysUntilExpiry < 0;
  }

  const labels = buildLabels({
    opened,
    expiry,
    daysInUse,
    daysUntilExpiry,
    expired,
    expiryBeforeOpened,
  });

  return {
    openedDate: opened,
    expiryDate: expiry,
    daysInUse,
    daysUntilExpiry,
    expired,
    expiryBeforeOpened,
    labels,
  };
}

function formatDateKeyUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildLabels(input: {
  opened: string | null;
  expiry: string | null;
  daysInUse: number | null;
  daysUntilExpiry: number | null;
  expired: boolean;
  expiryBeforeOpened: boolean;
}): ProductDateStatus["labels"] {
  let inUse: string;
  if (input.daysInUse === null) {
    inUse = "Opened date not set";
  } else if (input.daysInUse === 0) {
    inUse = "In use since today (day 0)";
  } else if (input.daysInUse === 1) {
    inUse = "In use for 1 day";
  } else {
    inUse = `In use for ${input.daysInUse} days`;
  }

  let expiry: string;
  if (input.daysUntilExpiry === null) {
    expiry = "No expiry date set";
  } else if (input.expired) {
    const ago = Math.abs(input.daysUntilExpiry);
    expiry =
      ago === 0
        ? `Expired on ${input.expiry}`
        : ago === 1
          ? `Expired 1 day ago (${input.expiry})`
          : `Expired ${ago} days ago (${input.expiry})`;
  } else if (input.daysUntilExpiry === 0) {
    expiry = `Expires today (${input.expiry})`;
  } else if (input.daysUntilExpiry === 1) {
    expiry = `Expires in 1 day (${input.expiry})`;
  } else {
    expiry = `Expires in ${input.daysUntilExpiry} days (${input.expiry})`;
  }

  let warning: string | null = null;
  if (input.expiryBeforeOpened) {
    warning = "Expiry is before opened date — check the dates.";
  } else if (input.expired) {
    warning = "This product is past its expiry date.";
  }

  return { inUse, expiry, warning };
}
