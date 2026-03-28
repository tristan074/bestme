import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/lib/points/achievements";

export async function GET() {
  // Sum all points
  const aggregate = await prisma.pointsLog.aggregate({ _sum: { points: true } });
  const totalPoints = aggregate._sum.points ?? 0;

  // Unlocked achievements from DB
  const dbAchievements = await prisma.achievement.findMany();

  // Merge with ACHIEVEMENTS definitions
  const unlockedKeys = new Set(dbAchievements.map((a) => a.key));
  const unlockedAchievements = ACHIEVEMENTS.filter((def) => unlockedKeys.has(def.key)).map((def) => {
    const dbRecord = dbAchievements.find((a) => a.key === def.key)!;
    return { ...def, unlockedAt: dbRecord.unlockedAt };
  });

  // Recent 20 logs
  const recentLogs = await prisma.pointsLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ totalPoints, unlockedAchievements, recentLogs });
}
