import { describe, it, expect } from "vitest";
import {
  generateMultiplication,
  generateCarrying,
  generateTwoDigit,
} from "./generators";

describe("generateMultiplication", () => {
  it("generates the requested number of questions", () => {
    const questions = generateMultiplication(20);
    expect(questions).toHaveLength(20);
  });

  it("each question has factors between 1-9", () => {
    const questions = generateMultiplication(50);
    for (const q of questions) {
      expect(q.a).toBeGreaterThanOrEqual(1);
      expect(q.a).toBeLessThanOrEqual(9);
      expect(q.b).toBeGreaterThanOrEqual(1);
      expect(q.b).toBeLessThanOrEqual(9);
      expect(q.answer).toBe(q.a * q.b);
      expect(q.expression).toBe(`${q.a} × ${q.b}`);
    }
  });

  it("does not repeat expressions within one session", () => {
    const questions = generateMultiplication(20);
    const expressions = questions.map((q) => q.expression);
    expect(new Set(expressions).size).toBe(20);
  });
});

describe("generateCarrying", () => {
  it("generates the requested number of questions", () => {
    const questions = generateCarrying(20);
    expect(questions).toHaveLength(20);
  });

  it("addition: both operands <= 10, result > 10 and <= 20", () => {
    const questions = generateCarrying(100);
    for (const q of questions) {
      if (q.expression.includes("+")) {
        expect(q.a).toBeGreaterThanOrEqual(2);
        expect(q.a).toBeLessThanOrEqual(10);
        expect(q.b).toBeGreaterThanOrEqual(2);
        expect(q.b).toBeLessThanOrEqual(10);
        expect(q.answer).toBeGreaterThan(10);
        expect(q.answer).toBeLessThanOrEqual(20);
      }
    }
  });

  it("subtraction: minuend 11-20, result >= 0", () => {
    const questions = generateCarrying(100);
    for (const q of questions) {
      if (q.expression.includes("−")) {
        expect(q.a).toBeGreaterThanOrEqual(11);
        expect(q.a).toBeLessThanOrEqual(20);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThanOrEqual(10);
      }
    }
  });
});

describe("generateTwoDigit", () => {
  it("generates the requested number of questions", () => {
    const questions = generateTwoDigit(20);
    expect(questions).toHaveLength(20);
  });

  it("involves at least one two-digit number, result 0-100", () => {
    const questions = generateTwoDigit(100);
    for (const q of questions) {
      const hasTwoDigit = q.a >= 10 || q.b >= 10;
      expect(hasTwoDigit).toBe(true);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThanOrEqual(100);
    }
  });
});
