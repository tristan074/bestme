"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Specialty = "multiplication" | "carrying" | "two-digit";

const SPECIALTIES: { id: Specialty; title: string; description: string; emoji: string }[] = [
  { id: "multiplication", title: "小九九", description: "乘法口诀练习", emoji: "✖️" },
  { id: "carrying", title: "进位加减法", description: "带进位的加减法", emoji: "➕" },
  { id: "two-digit", title: "两位数加减", description: "两位数加减法练习", emoji: "🔢" },
];

const COUNTS = [10, 20, 30, 50];

export default function MathPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Specialty | null>(null);
  const [count, setCount] = useState(20);

  function handleStart() {
    if (!selected) return;
    router.push(`/math/practice?specialty=${selected}&count=${count}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 flex flex-col items-center justify-center p-8 gap-10">
      <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">数学练习</h1>

      {/* Specialty cards */}
      <div className="grid grid-cols-1 gap-6 w-full max-w-lg">
        {SPECIALTIES.map((s) => {
          const isSelected = selected === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={[
                "flex items-center gap-6 rounded-3xl p-6 shadow-xl active:scale-95 transition-all text-left",
                isSelected
                  ? "bg-white ring-4 ring-yellow-400 scale-105"
                  : "bg-white/80",
              ].join(" ")}
            >
              <span className="text-5xl">{s.emoji}</span>
              <div>
                <div className="text-2xl font-bold text-gray-800">{s.title}</div>
                <div className="text-lg text-gray-500">{s.description}</div>
              </div>
              {isSelected && (
                <span className="ml-auto text-3xl text-yellow-500">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Count selector */}
      <div className="flex flex-col items-center gap-4 w-full max-w-lg">
        <div className="text-white text-2xl font-bold">题目数量</div>
        <div className="flex gap-4">
          {COUNTS.map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={[
                "w-20 h-20 rounded-2xl text-2xl font-bold shadow-md active:scale-95 transition-all",
                count === n
                  ? "bg-yellow-400 text-white scale-105"
                  : "bg-white/80 text-gray-800",
              ].join(" ")}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={!selected}
        className={[
          "w-full max-w-lg py-6 rounded-3xl text-3xl font-extrabold shadow-xl transition-all",
          selected
            ? "bg-yellow-400 text-white active:scale-95"
            : "bg-white/30 text-white/50 cursor-not-allowed",
        ].join(" ")}
      >
        开始练习 🚀
      </button>
    </main>
  );
}
