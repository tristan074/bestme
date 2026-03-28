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
  const all: MathProblem[] = [];

  // Addition: at least one two-digit operand, result <= 100
  for (let a = 10; a <= 99; a++) {
    for (let b = 1; b <= 99; b++) {
      if (a + b <= 100) {
        all.push({ a, b, answer: a + b, expression: `${a} + ${b}` });
      }
    }
  }

  // Subtraction: a is two-digit, result >= 0
  for (let a = 10; a <= 99; a++) {
    for (let b = 1; b <= a; b++) {
      all.push({ a, b, answer: a - b, expression: `${a} − ${b}` });
    }
  }

  return shuffle(all).slice(0, count);
}
