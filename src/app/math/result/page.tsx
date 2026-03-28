"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AnsweredQuestion {
  expression: string;
  answer: number;
  userAnswer: number;
  correct: boolean;
  timeMs: number;
}

interface MathResult {
  specialty: string;
  count: number;
  correctCount: number;
  totalCount: number;
  totalMs: number;
  questions: AnsweredQuestion[];
}

const SPECIALTY_LABELS: Record<string, string> = {
  multiplication: "小九九",
  carrying: "进位加减法",
  "two-digit": "两位数加减",
};

function formatTime(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${minutes.toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function ResultContent() {
  const router = useRouter();
  const [result, setResult] = useState<MathResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("mathResult");
    if (raw) {
      try {
        setResult(JSON.parse(raw));
      } catch {
        // ignore parse error
      }
    }
  }, []);

  if (!result) {
    return (
      <main className="min-h-screen bg-[#2D2D2D] flex flex-col items-center justify-center gap-6">
        <div className="text-white text-xl">没有找到练习结果</div>
        <button
          onClick={() => router.push("/math")}
          className="mc-btn mc-btn-green px-8 py-4 text-base"
        >
          返回
        </button>
      </main>
    );
  }

  const accuracy = Math.round((result.correctCount / result.totalCount) * 100);
  const wrongQuestions = result.questions.filter((q) => !q.correct);

  return (
    <main className="min-h-screen bg-[#2D2D2D] flex flex-col items-center p-8 gap-8">
      {/* Header */}
      <div className="text-center">
        <div className="text-6xl mb-2">🎉</div>
        <h1
          className="text-2xl font-extrabold text-white"
          style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "3px 3px 0 rgba(0,0,0,0.6)" }}
        >
          练习完成！
        </h1>
        <p className="text-base text-[#AAAAAA] mt-2">{SPECIALTY_LABELS[result.specialty] ?? result.specialty}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
        <div className="mc-panel p-5 flex flex-col items-center gap-1">
          <div
            className="text-4xl font-extrabold text-[#2A9FD6]"
            style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
          >
            {accuracy}%
          </div>
          <div className="text-[#AAAAAA] text-sm font-medium">正确率</div>
        </div>
        <div className="mc-panel p-5 flex flex-col items-center gap-1">
          <div
            className="text-3xl font-extrabold text-[#5B8731]"
            style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
          >
            {result.correctCount}/{result.totalCount}
          </div>
          <div className="text-[#AAAAAA] text-sm font-medium">答对题数</div>
        </div>
        <div className="mc-panel p-5 flex flex-col items-center gap-1">
          <div
            className="text-3xl font-extrabold text-[#FFD700]"
            style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
          >
            {formatTime(result.totalMs)}
          </div>
          <div className="text-[#AAAAAA] text-sm font-medium">用时</div>
        </div>
      </div>

      {/* Wrong answers */}
      {wrongQuestions.length > 0 && (
        <div className="w-full max-w-lg mc-panel p-6">
          <h2
            className="text-base font-bold text-[#FFD700] mb-4"
            style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
          >
            错题回顾
          </h2>
          <div className="flex flex-col gap-3">
            {wrongQuestions.map((q, i) => (
              <div key={i} className="flex items-center gap-4 bg-[#3A1A1A] border border-[#CC3333]/40 p-4">
                <span className="text-[#CC3333] text-xl">✗</span>
                <span className="text-lg font-bold text-white">{q.expression} =</span>
                <span className="text-lg line-through text-[#CC3333]">{q.userAnswer}</span>
                <span className="text-lg font-bold text-[#5B8731]">{q.answer}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-4 w-full max-w-lg">
        <button
          onClick={() =>
            router.push(`/math/practice?specialty=${result.specialty}&count=${result.count}`)
          }
          className="mc-btn mc-btn-gold w-full py-5 text-lg active:scale-95"
        >
          再来一次 🔄
        </button>
        <button
          onClick={() => router.push("/math")}
          className="mc-btn w-full py-5 text-lg active:scale-95"
        >
          返回
        </button>
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#2D2D2D] flex items-center justify-center">
          <div
            className="text-white text-2xl animate-pulse"
            style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
          >
            加载中...
          </div>
        </main>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
