import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface QuestionInput {
  expression: string;
  answer: number;
  userAnswer: number;
  correct: boolean;
  timeMs: number;
}

export async function POST(request: NextRequest) {
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

  return NextResponse.json({ sessionId: session.id, correctCount, totalCount: questions.length });
}
