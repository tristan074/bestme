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

// POST: create notebook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body as { name: string };
    if (!name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const notebook = await prisma.notebook.create({
      data: { name: name.trim() },
    });
    return NextResponse.json(notebook);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "服务器错误，请重试" }, { status: 500 });
  }
}

// PATCH: update notebook (name or isActive)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, isActive } = body as {
      id: number;
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

    const updated = await prisma.notebook.update({
      where: { id },
      data: {
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
