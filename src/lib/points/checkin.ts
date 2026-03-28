import { prisma } from "@/lib/prisma";
import { calculateCheckinPoints } from "./engine";

export async function maybeAwardCheckinPoints(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);

  const checkin = await prisma.dailyCheckin.findUnique({ where: { date: today } });
  if (!checkin || !checkin.math || !checkin.chinese) return 0;

  // Check if already awarded today
  const alreadyAwarded = await prisma.pointsLog.findFirst({
    where: { reason: "每日打卡", createdAt: { gte: new Date(today) } },
  });
  if (alreadyAwarded) return 0;

  // Calculate streak
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const c = await prisma.dailyCheckin.findUnique({ where: { date: dateStr } });
    if (c?.math && c?.chinese) { streak++; } else { break; }
  }

  const points = calculateCheckinPoints(streak);
  await prisma.pointsLog.create({ data: { points, reason: "每日打卡" } });

  // Streak achievements
  if (streak >= 7) {
    await prisma.achievement.upsert({
      where: { key: "streak_7" },
      create: { key: "streak_7", name: "坚持之星·周" },
      update: {},
    });
  }
  if (streak >= 30) {
    await prisma.achievement.upsert({
      where: { key: "streak_30" },
      create: { key: "streak_30", name: "坚持之星·月" },
      update: {},
    });
  }

  return points;
}
