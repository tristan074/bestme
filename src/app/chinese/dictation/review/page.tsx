"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Character {
  id: number;
  char: string;
  pinyin: string;
}

type Mark = "unmarked" | "correct" | "wrong";

interface CharMark {
  char: Character;
  mark: Mark;
}

type Phase = "review" | "submitting" | "summary";

interface Summary {
  total: number;
  correct: number;
  wrong: number;
}

// Cycle: unmarked → correct → wrong → unmarked
function nextMark(current: Mark): Mark {
  if (current === "unmarked") return "correct";
  if (current === "correct") return "wrong";
  return "unmarked";
}

const MARK_STYLES: Record<Mark, string> = {
  unmarked: "bg-white border-gray-200 text-gray-800",
  correct: "bg-green-100 border-green-400 text-green-800",
  wrong: "bg-red-100 border-red-400 text-red-800",
};

export default function DictationReviewPage() {
  const router = useRouter();
  const [items, setItems] = useState<CharMark[]>([]);
  const [phase, setPhase] = useState<Phase>("review");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("dictationChars");
    if (!raw) {
      router.replace("/chinese/dictation");
      return;
    }
    const chars: Character[] = JSON.parse(raw);
    setItems(chars.map((char) => ({ char, mark: "unmarked" })));
  }, [router]);

  function toggleMark(index: number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, mark: nextMark(item.mark) } : item
      )
    );
  }

  async function handleSubmit() {
    // Validate all marked
    const anyUnmarked = items.some((item) => item.mark === "unmarked");
    if (anyUnmarked) {
      alert("还有字没有标记，请全部标记为正确或错误后再提交。");
      return;
    }

    setPhase("submitting");
    setError(null);

    const results = items.map((item) => ({
      characterId: item.char.id,
      correct: item.mark === "correct",
    }));

    try {
      const res = await fetch("/api/chinese/dictation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });
      const data: Summary = await res.json();
      setSummary(data);
      sessionStorage.removeItem("dictationChars");
      setPhase("summary");
    } catch {
      setError("提交失败，请重试。");
      setPhase("review");
    }
  }

  // ── Summary screen ────────────────────────────────────────────────────────
  if (phase === "summary" && summary) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 flex flex-col items-center justify-center gap-10 p-8">
        <div className="text-6xl">🏆</div>
        <div className="text-3xl font-extrabold text-white drop-shadow-lg">听写完成！</div>
        <div className="w-full max-w-md rounded-3xl bg-white/90 p-8 shadow-xl flex justify-around">
          <div className="text-center">
            <div className="text-5xl font-extrabold text-green-600">{summary.correct}</div>
            <div className="text-gray-500 text-lg mt-1">写对了</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-extrabold text-red-500">{summary.wrong}</div>
            <div className="text-gray-500 text-lg mt-1">写错了</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-extrabold text-gray-700">{summary.total}</div>
            <div className="text-gray-500 text-lg mt-1">共计</div>
          </div>
        </div>
        <button
          onClick={() => router.push("/chinese")}
          className="px-10 py-5 rounded-3xl bg-white text-rose-500 text-2xl font-extrabold shadow-xl active:scale-95 transition-all"
        >
          返回语文
        </button>
      </main>
    );
  }

  // ── Review screen ─────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 flex flex-col items-center p-8 gap-8">
      {/* Header */}
      <div className="w-full max-w-2xl mt-4">
        <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">对照答案</h1>
        <p className="text-white/80 text-lg mt-1">点击每个字标记正确（绿）或错误（红）</p>
      </div>

      {/* Character grid */}
      <div className="w-full max-w-2xl grid grid-cols-4 gap-4">
        {items.map((item, i) => (
          <button
            key={item.char.id}
            onClick={() => toggleMark(i)}
            className={[
              "flex flex-col items-center rounded-3xl p-4 border-2 shadow transition-all active:scale-90",
              MARK_STYLES[item.mark],
            ].join(" ")}
          >
            <span className="text-4xl font-extrabold">{item.char.char}</span>
            <span className="text-sm text-gray-500 mt-1">{item.char.pinyin}</span>
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="w-full max-w-2xl rounded-2xl bg-red-100 text-red-700 px-5 py-3 font-bold text-center">
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={phase === "submitting"}
        className={[
          "w-full max-w-2xl py-6 rounded-3xl text-2xl font-extrabold shadow-xl transition-all",
          phase !== "submitting"
            ? "bg-yellow-400 text-white active:scale-95"
            : "bg-white/30 text-white/50 cursor-not-allowed",
        ].join(" ")}
      >
        {phase === "submitting" ? "提交中..." : "提交结果"}
      </button>
    </main>
  );
}
