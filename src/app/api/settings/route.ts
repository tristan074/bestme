import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: fetch a system setting by key
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (!key) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    return NextResponse.json({ key: setting?.key, value: setting?.value ?? null });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "服务器错误，请重试" }, { status: 500 });
  }
}

// PATCH: update a system setting; creates if not exists
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body as { key: string; value: string };

    if (!key || value === undefined) {
      return NextResponse.json({ error: "key and value are required" }, { status: 400 });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });

    // If updating chinese_daily_limit, also reschedule all pending chars
    if (key === "chinese_daily_limit") {
      const dailyLimit = parseInt(value, 10);
      if (!isNaN(dailyLimit) && dailyLimit > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const pendingChars = await prisma.character.findMany({
          where: { status: "learning" },
          orderBy: { id: "asc" },
        });

        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() + 1);
        baseDate.setHours(0, 0, 0, 0);

        for (let i = 0; i < pendingChars.length; i++) {
          const dayOffset = Math.floor(i / dailyLimit);
          const nextReview = new Date(baseDate);
          nextReview.setDate(nextReview.getDate() + dayOffset);

          // Use deleteMany + create to handle composite primary key [characterId, nextReview]
          await prisma.reviewSchedule.deleteMany({
            where: { characterId: pendingChars[i].id },
          });
          await prisma.reviewSchedule.create({
            data: { characterId: pendingChars[i].id, nextReview, interval: 0 },
          });
        }
      }
    }

    return NextResponse.json({ key: setting.key, value: setting.value });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "服务器错误，请重试" }, { status: 500 });
  }
}
