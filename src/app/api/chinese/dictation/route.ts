import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextReview } from "@/lib/chinese/spaced-repetition";

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

  return NextResponse.json({ total: results.length, correct, wrong });
}
