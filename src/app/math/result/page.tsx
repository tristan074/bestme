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
      <main className="min-h-screen bg-gradient-to-br from-blue-400 to-indigo-600 flex flex-col items-center justify-center gap-6">
        <div className="text-white text-3xl">没有找到练习结果</div>
        <button
          onClick={() => router.push("/math")}
          className="bg-white text-blue-600 rounded-2xl px-8 py-4 text-2xl font-bold"
        >
          返回
        </button>
      </main>
    );
  }

  const accuracy = Math.round((result.correctCount / result.totalCount) * 100);
  const wrongQuestions = result.questions.filter((q) => !q.correct);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 flex flex-col items-center p-8 gap-8">
      {/* Header */}
      <div className="text-center">
        <div className="text-6xl mb-2">🎉</div>
        <h1 className="text-4xl font-extrabold text-white drop-shadow">练习完成！</h1>
        <p className="text-2xl text-white/80 mt-1">{SPECIALTY_LABELS[result.specialty] ?? result.specialty}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
        <div className="bg-white rounded-3xl p-6 flex flex-col items-center gap-1 shadow-xl">
          <div className="text-5xl font-extrabold text-blue-600">{accuracy}%</div>
          <div className="text-gray-500 text-lg font-medium">正确率</div>
        </div>
        <div className="bg-white rounded-3xl p-6 flex flex-col items-center gap-1 shadow-xl">
          <div className="text-5xl font-extrabold text-green-600">
            {result.correctCount}/{result.totalCount}
          </div>
          <div className="text-gray-500 text-lg font-medium">答对题数</div>
        </div>
        <div className="bg-white rounded-3xl p-6 flex flex-col items-center gap-1 shadow-xl">
          <div className="text-4xl font-extrabold text-indigo-600">{formatTime(result.totalMs)}</div>
          <div className="text-gray-500 text-lg font-medium">用时</div>
        </div>
      </div>

      {/* Wrong answers */}
      {wrongQuestions.length > 0 && (
        <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">错题回顾</h2>
          <div className="flex flex-col gap-3">
            {wrongQuestions.map((q, i) => (
              <div key={i} className="flex items-center gap-4 bg-red-50 rounded-2xl p-4">
                <span className="text-red-400 text-xl">✗</span>
                <span className="text-xl font-bold text-gray-700">{q.expression} =</span>
                <span className="text-xl line-through text-red-400">{q.userAnswer}</span>
                <span className="text-xl font-bold text-green-600">{q.answer}</span>
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
          className="w-full py-5 rounded-3xl bg-yellow-400 text-white text-3xl font-extrabold shadow-xl active:scale-95 transition-transform"
        >
          再来一次 🔄
        </button>
        <button
          onClick={() => router.push("/math")}
          className="w-full py-5 rounded-3xl bg-white/80 text-gray-700 text-3xl font-extrabold shadow-xl active:scale-95 transition-transform"
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
        <main className="min-h-screen bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
          <div className="text-white text-4xl font-bold animate-pulse">加载中...</div>
        </main>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
