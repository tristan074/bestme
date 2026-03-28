import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: find active notebook, return due characters in learning status
export async function GET() {
  try {
  const activeNotebook = await prisma.notebook.findFirst({
    where: { isActive: true, archived: false },
  });

  if (!activeNotebook) {
    return NextResponse.json({ notebookId: null, characters: [] });
  }

  const today = new Date().toISOString().slice(0, 10);

  // Find learning characters with a due review schedule
  const schedules = await prisma.reviewSchedule.findMany({
    where: {
      nextReview: { lte: new Date(today + "T23:59:59Z") },
    },
  });

  const dueCharacterIds = schedules.map((s) => s.characterId);

  const characters = await prisma.character.findMany({
    where: {
      id: { in: dueCharacterIds },
      notebookId: activeNotebook.id,
      status: "learning",
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json({
    notebookId: activeNotebook.id,
    notebookName: activeNotebook.name,
    characters,
  });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "服务器错误，请重试" }, { status: 500 });
  }
}
