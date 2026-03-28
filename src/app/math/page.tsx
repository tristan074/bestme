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
    <main className="min-h-screen bg-[#2D2D2D] flex flex-col items-center justify-center p-8 gap-10">
      <h1
        className="text-3xl font-bold text-white"
        style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "3px 3px 0 rgba(0,0,0,0.6)" }}
      >
        数学练习
      </h1>

      {/* Specialty cards */}
      <div className="grid grid-cols-1 gap-4 w-full max-w-lg">
        {SPECIALTIES.map((s) => {
          const isSelected = selected === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={[
                "mc-panel flex items-center gap-6 p-6 active:scale-95 transition-all text-left",
                isSelected ? "brightness-150 outline outline-2 outline-[#FFD700]" : "hover:brightness-125",
              ].join(" ")}
            >
              <span className="text-5xl">{s.emoji}</span>
              <div className="flex-1">
                <div
                  className="text-base font-bold text-white"
                  style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
                >
                  {s.title}
                </div>
                <div className="text-sm text-[#AAAAAA] mt-1">{s.description}</div>
              </div>
              {isSelected && (
                <span className="text-2xl text-[#FFD700]" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Count selector */}
      <div className="flex flex-col items-center gap-4 w-full max-w-lg">
        <div
          className="text-base text-white"
          style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
        >
          题目数量
        </div>
        <div className="flex gap-3">
          {COUNTS.map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={[
                "mc-btn w-20 h-20 text-xl active:scale-95",
                count === n ? "mc-btn-gold" : "",
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
        className="mc-btn mc-btn-green w-full max-w-lg py-6 text-xl active:scale-95"
      >
        开始练习 🚀
      </button>
    </main>
  );
}
