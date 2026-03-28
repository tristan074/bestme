"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Timer from "@/components/Timer";
import NumericInput from "@/components/NumericInput";

interface Question {
  a: number;
  b: number;
  answer: number;
  expression: string;
}

interface AnsweredQuestion {
  expression: string;
  answer: number;
  userAnswer: number;
  correct: boolean;
  timeMs: number;
}

const SPECIALTY_LABELS: Record<string, string> = {
  multiplication: "小九九",
  carrying: "进位加减法",
  "two-digit": "两位数加减",
};

function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const specialty = searchParams.get("specialty") ?? "multiplication";
  const count = parseInt(searchParams.get("count") ?? "20", 10);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answered, setAnswered] = useState<AnsweredQuestion[]>([]);
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);
  const [wrongAnswer, setWrongAnswer] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [totalMs, setTotalMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const questionStartRef = useRef<number>(Date.now());
  const totalMsRef = useRef(0);

  useEffect(() => {
    fetch(`/api/math/questions?specialty=${specialty}&count=${count}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setQuestions(data.questions);
        setTimerRunning(true);
        questionStartRef.current = Date.now();
      })
      .catch(() => setError("加载题目失败"))
      .finally(() => setLoading(false));
  }, [specialty, count]);

  const handleTick = useCallback((ms: number) => {
    setTotalMs(ms);
    totalMsRef.current = ms;
  }, []);

  async function handleSubmit(value: number) {
    if (feedback !== null || questions.length === 0) return;

    const q = questions[current];
    const correct = value === q.answer;
    const timeMs = Date.now() - questionStartRef.current;

    const record: AnsweredQuestion = {
      expression: q.expression,
      answer: q.answer,
      userAnswer: value,
      correct,
      timeMs,
    };

    setFeedback(correct ? "correct" : "wrong");
    if (!correct) setWrongAnswer(value);

    setTimeout(async () => {
      const newAnswered = [...answered, record];
      setFeedback(null);
      setWrongAnswer(null);

      if (current + 1 >= questions.length) {
        // Last question — finish
        setTimerRunning(false);
        try {
          const res = await fetch("/api/math/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ specialty, totalTime: totalMsRef.current, questions: newAnswered }),
          });
          const data = await res.json();
          sessionStorage.setItem(
            "mathResult",
            JSON.stringify({
              specialty,
              count,
              correctCount: data.correctCount,
              totalCount: data.totalCount,
              totalMs: totalMsRef.current,
              questions: newAnswered,
            })
          );
        } catch {
          // Store local result even if API fails
          sessionStorage.setItem(
            "mathResult",
            JSON.stringify({
              specialty,
              count,
              correctCount: newAnswered.filter((a) => a.correct).length,
              totalCount: newAnswered.length,
              totalMs: totalMsRef.current,
              questions: newAnswered,
            })
          );
        }
        router.push("/math/result");
      } else {
        setAnswered(newAnswered);
        setCurrent((c) => c + 1);
        questionStartRef.current = Date.now();
      }
    }, 600);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#2D2D2D] flex items-center justify-center">
        <div
          className="text-white text-2xl animate-pulse"
          style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
        >
          加载中...
        </div>
      </main>
    );
  }

  if (error || questions.length === 0) {
    return (
      <main className="min-h-screen bg-[#2D2D2D] flex flex-col items-center justify-center gap-6">
        <div className="text-white text-2xl">{error ?? "没有题目"}</div>
        <button onClick={() => router.push("/math")} className="mc-btn mc-btn-green px-8 py-4 text-base">
          返回
        </button>
      </main>
    );
  }

  const q = questions[current];
  const progress = current / questions.length;

  return (
    <main className="min-h-screen bg-[#2D2D2D] flex flex-col items-center p-8 gap-8">
      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between">
        <Timer running={timerRunning} onTick={handleTick} />
        <div
          className="text-white text-xl font-bold"
          style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
        >
          {current + 1} / {questions.length}
        </div>
        <div className="text-[#AAAAAA] text-sm">{SPECIALTY_LABELS[specialty]}</div>
      </div>

      {/* XP progress bar */}
      <div className="w-full max-w-lg mc-xp-bar h-5 overflow-hidden">
        <div
          className="mc-xp-bar-fill h-full"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Question panel */}
      <div
        className={[
          "w-full max-w-lg mc-panel p-10 flex flex-col items-center gap-4 transition-colors duration-300",
          feedback === "correct"
            ? "outline outline-2 outline-[#5B8731]"
            : feedback === "wrong"
            ? "outline outline-2 outline-[#CC3333]"
            : "",
        ].join(" ")}
      >
        <div
          className="text-6xl font-extrabold text-white tracking-wide"
          style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.6)" }}
        >
          {q.expression} = ?
        </div>

        {feedback === "correct" && (
          <div
            className="text-[#5B8731] text-3xl font-bold"
            style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
          >
            ✓ 正确！
          </div>
        )}
        {feedback === "wrong" && (
          <div
            className="text-[#CC3333] text-2xl font-bold text-center"
            style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
          >
            ✗ 你答了 {wrongAnswer}，正确答案是 {q.answer}
          </div>
        )}
      </div>

      {/* Numeric input */}
      <div className="w-full max-w-xs">
        {feedback === null && <NumericInput onSubmit={handleSubmit} />}
      </div>
    </main>
  );
}

export default function PracticePage() {
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
      <PracticeContent />
    </Suspense>
  );
}
