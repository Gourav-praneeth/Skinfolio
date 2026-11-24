import { describe, expect, it } from "vitest";
import {
  daysBetween,
  getProductDateStatus,
  normalizeOptionalDate,
  parseDateKey,
} from "./product-dates";

describe("parseDateKey / normalizeOptionalDate", () => {
  it("parses valid YYYY-MM-DD", () => {
    const d = parseDateKey("2026-03-15");
    expect(d).not.toBeNull();
    expect(d!.getUTCFullYear()).toBe(2026);
    expect(d!.getUTCMonth()).toBe(2);
    expect(d!.getUTCDate()).toBe(15);
  });

  it("rejects invalid calendar dates and junk", () => {
    expect(parseDateKey("2026-02-30")).toBeNull();
    expect(parseDateKey("03/15/2026")).toBeNull();
    expect(parseDateKey("")).toBeNull();
    expect(parseDateKey(null)).toBeNull();
    expect(normalizeOptionalDate("  ")).toBeNull();
    expect(normalizeOptionalDate("2026-11-01")).toBe("2026-11-01");
  });
});

describe("daysBetween", () => {
  it("counts whole days", () => {
    const a = parseDateKey("2026-01-01")!;
    const b = parseDateKey("2026-01-11")!;
    expect(daysBetween(a, b)).toBe(10);
    expect(daysBetween(b, a)).toBe(-10);
    expect(daysBetween(a, a)).toBe(0);
  });
});

describe("getProductDateStatus", () => {
  const today = "2026-11-24";

  it("happy path: in use and days until expiry", () => {
    const s = getProductDateStatus("2026-11-14", "2026-12-04", today);
    expect(s.daysInUse).toBe(10);
    expect(s.daysUntilExpiry).toBe(10);
    expect(s.expired).toBe(false);
    expect(s.expiryBeforeOpened).toBe(false);
    expect(s.labels.inUse).toBe("In use for 10 days");
    expect(s.labels.expiry).toContain("Expires in 10 days");
    expect(s.labels.warning).toBeNull();
  });

  it("missing opened date", () => {
    const s = getProductDateStatus(null, "2026-12-01", today);
    expect(s.daysInUse).toBeNull();
    expect(s.daysUntilExpiry).toBe(7);
    expect(s.labels.inUse).toBe("Opened date not set");
  });

  it("missing expiry date", () => {
    const s = getProductDateStatus("2026-11-20", null, today);
    expect(s.daysInUse).toBe(4);
    expect(s.daysUntilExpiry).toBeNull();
    expect(s.labels.expiry).toBe("No expiry date set");
    expect(s.expired).toBe(false);
  });

  it("both dates missing", () => {
    const s = getProductDateStatus(undefined, undefined, today);
    expect(s.daysInUse).toBeNull();
    expect(s.daysUntilExpiry).toBeNull();
    expect(s.labels.inUse).toBe("Opened date not set");
    expect(s.labels.expiry).toBe("No expiry date set");
  });

  it("expiry before opened", () => {
    const s = getProductDateStatus("2026-11-20", "2026-11-10", today);
    expect(s.expiryBeforeOpened).toBe(true);
    expect(s.labels.warning).toMatch(/before opened/i);
  });

  it("already expired", () => {
    const s = getProductDateStatus("2026-01-01", "2026-11-20", today);
    expect(s.expired).toBe(true);
    expect(s.daysUntilExpiry).toBe(-4);
    expect(s.labels.expiry).toMatch(/Expired 4 days ago/);
    expect(s.labels.warning).toMatch(/past its expiry/i);
  });

  it("expires today", () => {
    const s = getProductDateStatus("2026-11-01", today, today);
    expect(s.daysUntilExpiry).toBe(0);
    expect(s.expired).toBe(false);
    expect(s.labels.expiry).toMatch(/Expires today/);
  });

  it("opened today is day 0", () => {
    const s = getProductDateStatus(today, "2027-01-01", today);
    expect(s.daysInUse).toBe(0);
    expect(s.labels.inUse).toMatch(/today/);
  });

  it("future opened date clamps in-use to 0", () => {
    const s = getProductDateStatus("2026-12-01", null, today);
    expect(s.daysInUse).toBe(0);
  });
});
