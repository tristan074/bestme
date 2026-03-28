export interface MathProblem {
  a: number;
  b: number;
  answer: number;
  expression: string;
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateMultiplication(count: number): MathProblem[] {
  const all: MathProblem[] = [];
  for (let a = 1; a <= 9; a++) {
    for (let b = 1; b <= 9; b++) {
      all.push({ a, b, answer: a * b, expression: `${a} × ${b}` });
    }
  }
  return shuffle(all).slice(0, count);
}

export function generateCarrying(count: number): MathProblem[] {
  const all: MathProblem[] = [];

  // Addition: a + b where both <= 10, sum > 10
  for (let a = 2; a <= 10; a++) {
    for (let b = 2; b <= 10; b++) {
      if (a + b > 10 && a + b <= 20) {
        all.push({ a, b, answer: a + b, expression: `${a} + ${b}` });
      }
    }
  }

  // Subtraction: a - b where a is 11-20, b <= 10, result >= 0 and <= 10
  for (let a = 11; a <= 20; a++) {
    for (let b = 2; b <= 10; b++) {
      if (a - b >= 0 && a - b <= 10) {
        all.push({ a, b, answer: a - b, expression: `${a} − ${b}` });
      }
    }
  }

  return shuffle(all).slice(0, count);
}

export function generateTwoDigit(count: number): MathProblem[] {
  const seen = new Set<string>();
  const results: MathProblem[] = [];

  while (results.length < count) {
    const isAddition = Math.random() < 0.5;
    const a = Math.floor(Math.random() * 90) + 10; // 10-99

    if (isAddition) {
      const maxB = 100 - a;
      if (maxB < 1) continue;
      const b = Math.floor(Math.random() * maxB) + 1;
      const expr = `${a} + ${b}`;
      if (seen.has(expr)) continue;
      seen.add(expr);
      results.push({ a, b, answer: a + b, expression: expr });
    } else {
      const b = Math.floor(Math.random() * a) + 1; // 1 to a
      const expr = `${a} − ${b}`;
      if (seen.has(expr)) continue;
      seen.add(expr);
      results.push({ a, b, answer: a - b, expression: expr });
    }
  }

  return results;
}
