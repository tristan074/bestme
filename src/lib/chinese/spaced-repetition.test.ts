import { describe, it, expect } from "vitest";
import { REVIEW_INTERVALS, getNextReview, isDueForReview } from "./spaced-repetition";

describe("REVIEW_INTERVALS", () => {
  it("has correct intervals", () => { expect(REVIEW_INTERVALS).toEqual([1, 2, 4, 7, 15]); });
});

describe("getNextReview", () => {
  it("returns next interval on correct", () => {
    const result = getNextReview(0, true, new Date("2026-03-28"));
    expect(result.interval).toBe(1);
    expect(result.nextReview.toISOString().slice(0, 10)).toBe("2026-03-30");
  });
  it("resets on wrong", () => {
    const result = getNextReview(3, false, new Date("2026-03-28"));
    expect(result.interval).toBe(0);
    expect(result.nextReview.toISOString().slice(0, 10)).toBe("2026-03-29");
  });
  it("marks mastered after all intervals", () => {
    expect(getNextReview(4, true, new Date("2026-03-28")).mastered).toBe(true);
  });
});

describe("isDueForReview", () => {
  it("true if today or past", () => {
    expect(isDueForReview(new Date("2026-03-27"), new Date("2026-03-28"))).toBe(true);
    expect(isDueForReview(new Date("2026-03-28"), new Date("2026-03-28"))).toBe(true);
  });
  it("false if future", () => {
    expect(isDueForReview(new Date("2026-03-29"), new Date("2026-03-28"))).toBe(false);
  });
});
