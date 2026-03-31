import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: list all notebooks
export async function GET() {
  try {
    const notebooks = await prisma.notebook.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(notebooks);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "服务器错误，请重试" }, { status: 500 });
  }
}

// PATCH: update notebook (name, dailyLimit, isActive)
// When dailyLimit changes, reschedules all pending learning characters
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, dailyLimit, name, isActive } = body as {
      id: number;
      dailyLimit?: number;
      name?: string;
      isActive?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const notebook = await prisma.notebook.findUnique({ where: { id } });
    if (!notebook) {
      return NextResponse.json({ error: "notebook not found" }, { status: 404 });
    }

    // If dailyLimit changed, reschedule all pending learning characters
    if (dailyLimit !== undefined && dailyLimit !== notebook.dailyLimit) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all learning characters in this notebook with future review dates
      const pendingChars = await prisma.character.findMany({
        where: {
          notebookId: id,
          status: "learning",
        },
        orderBy: { id: "asc" },
      });

      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 1);
      baseDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < pendingChars.length; i++) {
        const char = pendingChars[i];
        const dayOffset = Math.floor(i / dailyLimit);
        const nextReview = new Date(baseDate);
        nextReview.setDate(nextReview.getDate() + dayOffset);

        await prisma.reviewSchedule.upsert({
          where: { characterId: char.id },
          create: { characterId: char.id, nextReview, interval: 0 },
          update: { nextReview, interval: 0 },
        });
      }
    }

    // Update notebook fields
    const updated = await prisma.notebook.update({
      where: { id },
      data: {
        ...(dailyLimit !== undefined && { dailyLimit }),
        ...(name !== undefined && { name }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "服务器错误，请重试" }, { status: 500 });
  }
}
