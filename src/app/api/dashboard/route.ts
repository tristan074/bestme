import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/lib/points/achievements";

export async function GET() {
  // 1. Math trends: last 60 sessions grouped by specialty
  const mathSessions = await prisma.mathSession.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  const bySpecialty: Record<
    string,
    { date: string; accuracy: number; timePerQuestion: number }[]
  > = {};

  for (const s of mathSessions) {
    const accuracy =
      s.totalCount > 0 ? Math.round((s.correctCount / s.totalCount) * 100) : 0;
    const timePerQuestion =
      s.totalCount > 0 ? Math.round(s.totalTime / s.totalCount / 1000) : 0;
    const date = s.createdAt.toISOString().slice(0, 10);

    if (!bySpecialty[s.specialty]) bySpecialty[s.specialty] = [];
    bySpecialty[s.specialty].push({ date, accuracy, timePerQuestion });
  }

  // Reverse each specialty array to chronological order
  for (const key of Object.keys(bySpecialty)) {
    bySpecialty[key] = bySpecialty[key].reverse();
  }

  // 2. Math bests: per specialty — best time (100% accuracy) and best accuracy
  // Filter in JS since Prisma 7 doesn't support raw column comparison in where
  const allSessions = await prisma.mathSession.findMany();

  const bests: Record<
    string,
    { bestTime: number | null; bestAccuracy: number }
  > = {};

  for (const s of allSessions) {
    const accuracy =
      s.totalCount > 0 ? Math.round((s.correctCount / s.totalCount) * 100) : 0;
    const timePerQuestion =
      s.totalCount > 0 ? s.totalTime / s.totalCount / 1000 : Infinity;

    if (!bests[s.specialty]) {
      bests[s.specialty] = { bestTime: null, bestAccuracy: 0 };
    }

    if (accuracy > bests[s.specialty].bestAccuracy) {
      bests[s.specialty].bestAccuracy = accuracy;
    }

    // Best time only from perfect sessions
    if (s.correctCount === s.totalCount && s.totalCount > 0) {
      if (
        bests[s.specialty].bestTime === null ||
        timePerQuestion < bests[s.specialty].bestTime!
      ) {
        bests[s.specialty].bestTime = Math.round(timePerQuestion * 10) / 10;
      }
    }
  }

  // 3. Math error book: top 20 by errorCount
  const errorBook = await prisma.mathErrorBook.findMany({
    orderBy: { errorCount: "desc" },
    take: 20,
  });

  // 4. Chinese stats: active notebook character counts by status
  const activeNotebook = await prisma.notebook.findFirst({
    where: { isActive: true },
    include: { characters: true },
  });

  const charStats = { unlearned: 0, learning: 0, mastered: 0 };
  if (activeNotebook) {
    for (const c of activeNotebook.characters) {
      if (c.status === "unlearned") charStats.unlearned++;
      else if (c.status === "learning") charStats.learning++;
      else if (c.status === "mastered") charStats.mastered++;
    }
  }

  // 5. Chinese error chars: characters with >= 2 wrong reviews
  const errorChars = await prisma.characterReview.groupBy({
    by: ["characterId"],
    where: { correct: false },
    _count: { correct: true },
    having: { correct: { _count: { gte: 2 } } },
    orderBy: { _count: { correct: "desc" } },
  });

  const errorCharIds = errorChars.map((e) => e.characterId);
  const errorCharDetails = await prisma.character.findMany({
    where: { id: { in: errorCharIds } },
    select: { id: true, char: true, pinyin: true },
  });

  const errorCharMap = new Map(errorCharDetails.map((c) => [c.id, c]));
  const errorCharsResult = errorChars.map((e) => ({
    ...errorCharMap.get(e.characterId),
    wrongCount: e._count.correct,
  }));

  // 6. Checkins: last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().slice(0, 10);

  const checkins = await prisma.dailyCheckin.findMany({
    where: { date: { gte: ninetyDaysAgoStr } },
    orderBy: { date: "asc" },
  });

  // 7. Streak: consecutive days with both math AND chinese done
  const allCheckins = await prisma.dailyCheckin.findMany({
    orderBy: { date: "desc" },
  });

  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let expectedDate = today;

  for (const c of allCheckins) {
    if (c.date !== expectedDate) break;
    if (c.math && c.chinese) {
      streak++;
      const d = new Date(expectedDate);
      d.setDate(d.getDate() - 1);
      expectedDate = d.toISOString().slice(0, 10);
    } else {
      break;
    }
  }

  // 8. Total points
  const pointsAgg = await prisma.pointsLog.aggregate({ _sum: { points: true } });
  const totalPoints = pointsAgg._sum.points ?? 0;

  // 9. Achievements: all unlocked
  const unlockedAchievements = await prisma.achievement.findMany();
  const unlockedKeys = new Set(unlockedAchievements.map((a) => a.key));

  const achievements = ACHIEVEMENTS.map((def) => ({
    ...def,
    unlocked: unlockedKeys.has(def.key),
    unlockedAt: unlockedAchievements.find((a) => a.key === def.key)?.unlockedAt ?? null,
  }));

  return NextResponse.json({
    math: { bySpecialty, bests, errorBook },
    chinese: { charStats, errorChars: errorCharsResult },
    checkins,
    streak,
    totalPoints,
    achievements,
  });
}
