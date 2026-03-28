import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateMultiplication,
  generateCarrying,
  generateTwoDigit,
} from "@/lib/math/generators";

export async function GET(request: NextRequest) {
  try {
  const { searchParams } = new URL(request.url);
  const specialty = searchParams.get("specialty");
  const count = parseInt(searchParams.get("count") || "20", 10);

  if (!specialty || !["multiplication", "carrying", "two-digit"].includes(specialty)) {
    return NextResponse.json({ error: "Invalid specialty" }, { status: 400 });
  }

  const generators: Record<string, (n: number) => ReturnType<typeof generateMultiplication>> = {
    multiplication: generateMultiplication,
    carrying: generateCarrying,
    "two-digit": generateTwoDigit,
  };

  let questions = generators[specialty](count);

  // Mix in error book questions (up to 25% of total)
  const errorBookCount = Math.min(Math.floor(count * 0.25), 5);
  if (errorBookCount > 0) {
    const errorQuestions = await prisma.mathErrorBook.findMany({
      where: { specialty },
      orderBy: { errorCount: "desc" },
      take: errorBookCount,
    });

    if (errorQuestions.length > 0) {
      const errorProblems = errorQuestions.map((eq) => {
        const parts = eq.expression.split(/\s*[×+−]\s*/);
        return {
          a: parseInt(parts[0], 10),
          b: parseInt(parts[1], 10),
          answer: eq.answer,
          expression: eq.expression,
        };
      });
      questions = [
        ...questions.slice(0, count - errorProblems.length),
        ...errorProblems,
      ];
    }
  }

  return NextResponse.json({ questions });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "服务器错误，请重试" }, { status: 500 });
  }
}
