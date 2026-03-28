import { describe, it, expect } from "vitest";
import { calculateMathPoints, calculateDictationPoints, calculateStreakBonus } from "./engine";

describe("calculateMathPoints", () => {
  it("gives base 10 points", () => { expect(calculateMathPoints(15, 20, false).base).toBe(10); });
  it("+5 for 100% accuracy", () => { expect(calculateMathPoints(20, 20, false).accuracyBonus).toBe(5); });
  it("no accuracy bonus < 100%", () => { expect(calculateMathPoints(19, 20, false).accuracyBonus).toBe(0); });
  it("+5 for new best time", () => { expect(calculateMathPoints(20, 20, true).speedBonus).toBe(5); });
  it("correct total", () => { expect(calculateMathPoints(20, 20, true).total).toBe(20); });
});

describe("calculateDictationPoints", () => {
  it("base 10", () => { expect(calculateDictationPoints(8, 10).base).toBe(10); });
  it("+5 for all correct", () => { expect(calculateDictationPoints(10, 10).perfectBonus).toBe(5); });
  it("correct total", () => { expect(calculateDictationPoints(10, 10).total).toBe(15); });
});

describe("calculateStreakBonus", () => {
  it("0 for < 3", () => { expect(calculateStreakBonus(2)).toBe(0); });
  it("5 for 3-6", () => { expect(calculateStreakBonus(3)).toBe(5); expect(calculateStreakBonus(6)).toBe(5); });
  it("10 for 7-29", () => { expect(calculateStreakBonus(7)).toBe(10); expect(calculateStreakBonus(29)).toBe(10); });
  it("30 for >= 30", () => { expect(calculateStreakBonus(30)).toBe(30); expect(calculateStreakBonus(100)).toBe(30); });
});
