import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: list non-archived notebooks with character count
export async function GET() {
  try {
  const notebooks = await prisma.notebook.findMany({
    where: { archived: false },
    include: { _count: { select: { characters: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(notebooks);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "服务器错误，请重试" }, { status: 500 });
  }
}

// POST: create new notebook (deactivate others, set new as active)
export async function POST(request: NextRequest) {
  try {
  const { name } = await request.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  await prisma.notebook.updateMany({ data: { isActive: false } });
  const notebook = await prisma.notebook.create({
    data: { name: name.trim(), isActive: true },
  });
  return NextResponse.json(notebook, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "服务器错误，请重试" }, { status: 500 });
  }
}

// PATCH: update notebook (rename, activate, archive)
export async function PATCH(request: NextRequest) {
  try {
  const body = await request.json();
  const { id, name, isActive, archived } = body as {
    id: number;
    name?: string;
    isActive?: boolean;
    archived?: boolean;
  };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // If activating, deactivate all others first
  if (isActive) {
    await prisma.notebook.updateMany({ data: { isActive: false } });
  }

  const notebook = await prisma.notebook.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(isActive !== undefined && { isActive }),
      ...(archived !== undefined && { archived }),
    },
  });
  return NextResponse.json(notebook);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "服务器错误，请重试" }, { status: 500 });
  }
}
