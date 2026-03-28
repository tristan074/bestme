interface MathPointsResult { base: number; accuracyBonus: number; speedBonus: number; total: number; }

export function calculateMathPoints(correct: number, total: number, isNewBestTime: boolean): MathPointsResult {
  const base = 10;
  const accuracyBonus = correct === total ? 5 : 0;
  const speedBonus = isNewBestTime ? 5 : 0;
  return { base, accuracyBonus, speedBonus, total: base + accuracyBonus + speedBonus };
}

interface DictationPointsResult { base: number; perfectBonus: number; total: number; }

export function calculateDictationPoints(correct: number, total: number): DictationPointsResult {
  const base = 10;
  const perfectBonus = correct === total ? 5 : 0;
  return { base, perfectBonus, total: base + perfectBonus };
}

export function calculateStreakBonus(streak: number): number {
  if (streak >= 30) return 30;
  if (streak >= 7) return 10;
  if (streak >= 3) return 5;
  return 0;
}

export function calculateCheckinPoints(streak: number): number {
  return 5 + calculateStreakBonus(streak);
}
