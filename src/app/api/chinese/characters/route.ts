import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCharPinyin, parseCharacters } from "@/lib/chinese/pinyin";

// GET: list characters by notebookId, ordered by lesson then id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notebookId = Number(searchParams.get("notebookId"));
    if (!notebookId) {
      return NextResponse.json({ error: "notebookId is required" }, { status: 400 });
    }

    const characters = await prisma.character.findMany({
      where: { notebookId },
      orderBy: [{ lesson: "asc" }, { id: "asc" }],
    });
    return NextResponse.json(characters);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "服务器错误，请重试" }, { status: 500 });
  }
}

// POST: batch import - parse text, auto-generate pinyin, skip duplicates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notebookId, text, lesson } = body as {
      notebookId: number;
      text: string;
      lesson?: string;
    };

    if (!notebookId || !text) {
      return NextResponse.json({ error: "notebookId and text are required" }, { status: 400 });
    }

    const chars = parseCharacters(text);
    if (chars.length === 0) {
      return NextResponse.json({ imported: 0, skipped: 0 });
    }

    let imported = 0;
    let skipped = 0;

    for (const char of chars) {
      const pinyinValue = getCharPinyin(char);
      try {
        await prisma.character.create({
          data: {
            char,
            pinyin: pinyinValue,
            lesson: lesson?.trim() || "",
            notebookId,
          },
        });
        imported++;
      } catch {
        skipped++;
      }
    }

    return NextResponse.json({ imported, skipped });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "服务器错误，请重试" }, { status: 500 });
  }
}

// PATCH: batch update status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, status } = body as { ids: number[]; status: string };

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
      return NextResponse.json({ error: "ids and status are required" }, { status: 400 });
    }

    await prisma.character.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    if (status === "learning") {
      // Get global daily limit from SystemSetting
      const setting = await prisma.systemSetting.findUnique({
        where: { key: "chinese_daily_limit" },
      });
      const dailyLimit = setting ? parseInt(setting.value, 10) : 20;

      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 1);
      baseDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < ids.length; i++) {
        const dayOffset = Math.floor(i / dailyLimit);
        const nextReview = new Date(baseDate);
        nextReview.setDate(nextReview.getDate() + dayOffset);

        await prisma.reviewSchedule.upsert({
          where: { characterId: ids[i] },
          create: { characterId: ids[i], nextReview, interval: 0 },
          update: { nextReview, interval: 0 },
        });
      }
    }

    return NextResponse.json({ updated: ids.length });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "服务器错误，请重试" }, { status: 500 });
  }
}
