import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextReview } from "@/lib/chinese/spaced-repetition";
import { calculateDictationPoints } from "@/lib/points/engine";
import { maybeAwardCheckinPoints } from "@/lib/points/checkin";

interface DictationResult {
  characterId: number;
  correct: boolean;
}

// POST: receive dictation results, update schedules, return summary
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { results } = body as { results: DictationResult[] };

  if (!results || !Array.isArray(results) || results.length === 0) {
    return NextResponse.json({ error: "results are required" }, { status: 400 });
  }

  let correct = 0;
  let wrong = 0;

  for (const r of results) {
    // Record the review
    await prisma.characterReview.create({
      data: { characterId: r.characterId, correct: r.correct },
    });

    if (r.correct) correct++;
    else wrong++;

    // Get current schedule
    const schedule = await prisma.reviewSchedule.findUnique({
      where: { characterId: r.characterId },
    });

    const currentInterval = schedule?.interval ?? 0;
    const reviewResult = getNextReview(currentInterval, r.correct);

    if (reviewResult.mastered) {
      // Update character status and delete schedule
      await prisma.character.update({
        where: { id: r.characterId },
        data: { status: "mastered" },
      });
      if (schedule) {
        await prisma.reviewSchedule.delete({ where: { characterId: r.characterId } });
      }
    } else {
      // Update or create schedule
      await prisma.reviewSchedule.upsert({
        where: { characterId: r.characterId },
        create: {
          characterId: r.characterId,
          nextReview: reviewResult.nextReview,
          interval: reviewResult.interval,
        },
        update: {
          nextReview: reviewResult.nextReview,
          interval: reviewResult.interval,
        },
      });
    }
  }

  // Update daily checkin
  const today = new Date().toISOString().slice(0, 10);
  await prisma.dailyCheckin.upsert({
    where: { date: today },
    create: { date: today, chinese: true },
    update: { chinese: true },
  });

  // Points
  const dictationPoints = calculateDictationPoints(correct, results.length);
  await prisma.pointsLog.create({ data: { points: dictationPoints.total, reason: "汉字听写" } });

  // Achievements
  if (correct === results.length) {
    await prisma.achievement.upsert({
      where: { key: "perfect_dictation" },
      create: { key: "perfect_dictation", name: "听写满分" },
      update: {},
    });
  }

  // "hundred_chars": count mastered characters in active notebook
  const activeNotebook = await prisma.notebook.findFirst({
    where: { isActive: true },
  });
  if (activeNotebook) {
    const masteredCount = await prisma.character.count({
      where: { notebookId: activeNotebook.id, status: "mastered" },
    });
    if (masteredCount >= 100) {
      await prisma.achievement.upsert({
        where: { key: "hundred_chars" },
        create: { key: "hundred_chars", name: "百字达人" },
        update: {},
      });
    }
  }

  await maybeAwardCheckinPoints();

  return NextResponse.json({ total: results.length, correct, wrong });
}
