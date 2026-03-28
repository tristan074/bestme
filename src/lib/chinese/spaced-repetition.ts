export const REVIEW_INTERVALS = [1, 2, 4, 7, 15];

export interface ReviewResult {
  interval: number;
  nextReview: Date;
  mastered: boolean;
}

export function getNextReview(currentInterval: number, correct: boolean, fromDate: Date = new Date()): ReviewResult {
  if (!correct) {
    const nextReview = new Date(fromDate);
    nextReview.setDate(nextReview.getDate() + REVIEW_INTERVALS[0]);
    return { interval: 0, nextReview, mastered: false };
  }
  const nextIntervalIndex = currentInterval + 1;
  if (nextIntervalIndex >= REVIEW_INTERVALS.length) {
    return { interval: currentInterval, nextReview: fromDate, mastered: true };
  }
  const nextReview = new Date(fromDate);
  nextReview.setDate(nextReview.getDate() + REVIEW_INTERVALS[nextIntervalIndex]);
  return { interval: nextIntervalIndex, nextReview, mastered: false };
}

export function isDueForReview(nextReview: Date, today: Date = new Date()): boolean {
  return nextReview.toISOString().slice(0, 10) <= today.toISOString().slice(0, 10);
}
