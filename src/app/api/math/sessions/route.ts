import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateMathPoints } from "@/lib/points/engine";
import { maybeAwardCheckinPoints } from "@/lib/points/checkin";
import { ACHIEVEMENTS } from "@/lib/points/achievements";

const getAchievementName = (key: string) => ACHIEVEMENTS.find((a) => a.key === key)?.name || key;

interface QuestionInput {
  expression: string;
  answer: number;
  userAnswer: number;
  correct: boolean;
  timeMs: number;
}

export async function POST(request: NextRequest) {
  try {
  const body = await request.json();
  const { specialty, totalTime, questions } = body as {
    specialty: string;
    totalTime: number;
    questions: QuestionInput[];
  };

  const correctCount = questions.filter((q) => q.correct).length;

  const session = await prisma.mathSession.create({
    data: {
      specialty,
      totalCount: questions.length,
      correctCount,
      totalTime,
      questions: {
        create: questions.map((q) => ({
          expression: q.expression,
          answer: q.answer,
          userAnswer: q.userAnswer,
          correct: q.correct,
          timeMs: q.timeMs,
        })),
      },
    },
  });

  // Update error book: add wrong answers, remove/decrement correct ones
  for (const q of questions) {
    if (!q.correct) {
      await prisma.mathErrorBook.upsert({
        where: {
          specialty_expression: { specialty, expression: q.expression },
        },
        create: { specialty, expression: q.expression, answer: q.answer },
        update: { errorCount: { increment: 1 }, lastError: new Date() },
      });
    } else {
      const existing = await prisma.mathErrorBook.findUnique({
        where: {
          specialty_expression: { specialty, expression: q.expression },
        },
      });
      if (existing) {
        if (existing.errorCount <= 1) {
          await prisma.mathErrorBook.delete({ where: { id: existing.id } });
        } else {
          await prisma.mathErrorBook.update({
            where: { id: existing.id },
            data: { errorCount: { decrement: 1 } },
          });
        }
      }
    }
  }

  // Update daily checkin
  const today = new Date().toISOString().slice(0, 10);
  await prisma.dailyCheckin.upsert({
    where: { date: today },
    create: { date: today, math: true },
    update: { math: true },
  });

  // Points: check for new personal best (100% sessions only)
  let isNewBest = false;
  if (correctCount === questions.length) {
    // Fetch all previous sessions for this specialty, filter perfect ones in JS
    // (Prisma can't compare two columns directly in a WHERE clause)
    const prevSessions = await prisma.mathSession.findMany({
      where: { specialty, id: { not: session.id } },
      select: { totalTime: true, correctCount: true, totalCount: true },
    });
    const perfectPrev = prevSessions.filter((s) => s.correctCount === s.totalCount);
    if (perfectPrev.length === 0) {
      isNewBest = true;
    } else {
      const bestTime = Math.min(...perfectPrev.map((s) => s.totalTime));
      isNewBest = totalTime < bestTime;
    }
  }

  const mathPoints = calculateMathPoints(correctCount, questions.length, isNewBest);
  await prisma.pointsLog.create({ data: { points: mathPoints.total, reason: "数学练习" } });

  // Achievements
  if (correctCount === questions.length) {
    await prisma.achievement.upsert({
      where: { key: "perfect_math" },
      create: { key: "perfect_math", name: getAchievementName("perfect_math") },
      update: {},
    });
  }
  if (
    specialty === "multiplication" &&
    questions.length >= 20 &&
    totalTime <= 60000 &&
    correctCount === questions.length
  ) {
    await prisma.achievement.upsert({
      where: { key: "lightning_calc" },
      create: { key: "lightning_calc", name: getAchievementName("lightning_calc") },
      update: {},
    });
  }
  if (isNewBest) {
    await prisma.achievement.upsert({
      where: { key: "speed_master" },
      create: { key: "speed_master", name: getAchievementName("speed_master") },
      update: {},
    });
  }

  await maybeAwardCheckinPoints();

  return NextResponse.json({ sessionId: session.id, correctCount, totalCount: questions.length });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "服务器错误，请重试" }, { status: 500 });
  }
}
