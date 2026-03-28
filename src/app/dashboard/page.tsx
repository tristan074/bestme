"use client";

import { useEffect, useState } from "react";
import TrendChart from "@/components/TrendChart";
import HeatmapCalendar from "@/components/HeatmapCalendar";
import AchievementBadge from "@/components/AchievementBadge";
import ProgressBar from "@/components/ProgressBar";
import { ACHIEVEMENTS } from "@/lib/points/achievements";

interface DashboardData {
  math: {
    bySpecialty: Record<
      string,
      { date: string; accuracy: number; timePerQuestion: number }[]
    >;
    bests: Record<string, { bestTime: number | null; bestAccuracy: number }>;
    errorBook: {
      id: number;
      specialty: string;
      expression: string;
      answer: number;
      errorCount: number;
    }[];
  };
  chinese: {
    charStats: { unlearned: number; learning: number; mastered: number };
    errorChars: { id: number; char: string; pinyin: string; wrongCount: number }[];
  };
  checkins: { date: string; math: boolean; chinese: boolean }[];
  streak: number;
  totalPoints: number;
  achievements: {
    key: string;
    name: string;
    description: string;
    emoji: string;
    unlocked: boolean;
  }[];
}

const SPECIALTY_LABELS: Record<string, string> = {
  multiplication: "乘法口诀",
  carrying: "进位加法",
  "two-digit": "两位数运算",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("加载失败");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <p className="text-white/70">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <p className="text-white/70">加载中...</p>
      </div>
    );
  }

  const { math, chinese, checkins, streak, totalPoints, achievements } = data;
  const totalChars =
    chinese.charStats.unlearned + chinese.charStats.learning + chinese.charStats.mastered;

  // Build achievement list: merge API data with full ACHIEVEMENTS list to ensure all show up
  const achievementMap = new Map(achievements.map((a) => [a.key, a]));
  const allAchievements = ACHIEVEMENTS.map((def) => ({
    ...def,
    unlocked: achievementMap.get(def.key)?.unlocked ?? false,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        <h1 className="text-3xl font-bold">学习仪表盘</h1>

        {/* Overview cards */}
        <section>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-2xl p-6 text-center">
              <p className="text-4xl font-bold text-yellow-400">{totalPoints}</p>
              <p className="text-sm text-white/70 mt-1">总积分</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 text-center">
              <p className="text-4xl font-bold text-orange-400">{streak}</p>
              <p className="text-sm text-white/70 mt-1">连续打卡天数</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 text-center">
              <p className="text-4xl font-bold text-green-400">
                {chinese.charStats.mastered}
              </p>
              <p className="text-sm text-white/70 mt-1">已掌握汉字</p>
            </div>
          </div>
        </section>

        {/* Heatmap calendar */}
        <section className="bg-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">打卡记录（近90天）</h2>
          <HeatmapCalendar checkins={checkins} />
        </section>

        {/* Math trends */}
        {Object.keys(math.bySpecialty).length > 0 && (
          <section className="bg-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6">数学趋势</h2>
            <div className="space-y-8">
              {Object.entries(math.bySpecialty).map(([specialty, sessions]) => {
                const accuracyData = sessions.map((s) => ({
                  date: s.date,
                  value: s.accuracy,
                }));
                const timeData = sessions.map((s) => ({
                  date: s.date,
                  value: s.timePerQuestion,
                }));
                const best = math.bests[specialty];

                return (
                  <div key={specialty}>
                    <h3 className="font-medium mb-1">
                      {SPECIALTY_LABELS[specialty] ?? specialty}
                    </h3>
                    {best && (
                      <p className="text-xs text-white/50 mb-3">
                        最佳正确率 {best.bestAccuracy}%
                        {best.bestTime !== null &&
                          `  ·  最快（满分）${best.bestTime}秒/题`}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-6">
                      <TrendChart
                        data={accuracyData}
                        color="#a78bfa"
                        label="正确率"
                        unit="%"
                      />
                      <TrendChart
                        data={timeData}
                        color="#34d399"
                        label="每题用时"
                        unit="秒"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Math error book */}
        {math.errorBook.length > 0 && (
          <section className="bg-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">数学错题本</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {math.errorBook.map((e) => (
                <div
                  key={e.id}
                  className="bg-white/10 rounded-xl p-3 text-center"
                >
                  <p className="text-lg font-mono font-bold">{e.expression}</p>
                  <p className="text-xs text-white/50 mt-1">
                    答案 {e.answer} · 错 {e.errorCount} 次
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Chinese progress */}
        <section className="bg-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">汉字学习进度</h2>
          <div className="space-y-4">
            <ProgressBar
              label="已掌握"
              value={chinese.charStats.mastered}
              max={totalChars}
              color="#34d399"
            />
            <ProgressBar
              label="学习中"
              value={chinese.charStats.learning}
              max={totalChars}
              color="#fbbf24"
            />
            <ProgressBar
              label="未学习"
              value={chinese.charStats.unlearned}
              max={totalChars}
              color="#94a3b8"
            />
          </div>
        </section>

        {/* Chinese error chars */}
        {chinese.errorChars.length > 0 && (
          <section className="bg-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">常错汉字</h2>
            <div className="flex flex-wrap gap-3">
              {chinese.errorChars.map((c) => (
                <div
                  key={c.id}
                  className="bg-white/10 rounded-xl px-4 py-3 text-center min-w-[72px]"
                >
                  <p className="text-2xl font-bold">{c.char}</p>
                  <p className="text-xs text-white/50 mt-1">{c.pinyin}</p>
                  <p className="text-xs text-red-400 mt-0.5">错 {c.wrongCount} 次</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Achievement wall */}
        <section className="bg-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">成就墙</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {allAchievements.map((a) => (
              <AchievementBadge
                key={a.key}
                emoji={a.emoji}
                name={a.name}
                description={a.description}
                unlocked={a.unlocked}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
