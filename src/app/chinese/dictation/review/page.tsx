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

// MC-themed mark styles (inventory slot style)
const MARK_STYLES: Record<Mark, string> = {
  unmarked: "border-[#6B6B6B] bg-[#3A3A3A] text-white",
  correct: "border-[#5B8731] bg-[#1A3A1A] text-[#80FF20]",
  wrong: "border-[#CC3333] bg-[#3A1A1A] text-[#FF6666]",
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
      <main className="min-h-screen bg-[#2D2D2D] flex flex-col items-center justify-center gap-10 p-8">
        <div className="text-6xl">🏆</div>
        <div
          className="text-xl font-bold text-white"
          style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "3px 3px 0 rgba(0,0,0,0.6)" }}
        >
          听写完成！
        </div>
        <div className="w-full max-w-md mc-panel p-8 flex justify-around">
          <div className="text-center">
            <div
              className="text-5xl font-extrabold text-[#5B8731]"
              style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
            >
              {summary.correct}
            </div>
            <div className="text-[#AAAAAA] text-base mt-1">写对了</div>
          </div>
          <div className="text-center">
            <div
              className="text-5xl font-extrabold text-[#CC3333]"
              style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
            >
              {summary.wrong}
            </div>
            <div className="text-[#AAAAAA] text-base mt-1">写错了</div>
          </div>
          <div className="text-center">
            <div
              className="text-5xl font-extrabold text-[#AAAAAA]"
              style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
            >
              {summary.total}
            </div>
            <div className="text-[#AAAAAA] text-base mt-1">共计</div>
          </div>
        </div>
        <button
          onClick={() => router.push("/chinese")}
          className="mc-btn mc-btn-green px-10 py-5 text-base active:scale-95"
        >
          返回语文
        </button>
      </main>
    );
  }

  // ── Review screen ─────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#2D2D2D] flex flex-col items-center p-8 gap-8">
      {/* Header */}
      <div className="w-full max-w-2xl mt-4">
        <h1
          className="text-xl font-bold text-white"
          style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "3px 3px 0 rgba(0,0,0,0.6)" }}
        >
          对照答案
        </h1>
        <p className="text-[#AAAAAA] text-sm mt-2">点击每个字标记正确（绿）或错误（红）</p>
      </div>

      {/* Character grid — inventory style */}
      <div className="w-full max-w-2xl grid grid-cols-4 gap-4">
        {items.map((item, i) => (
          <button
            key={item.char.id}
            onClick={() => toggleMark(i)}
            className={[
              "flex flex-col items-center p-4 border-2 transition-all active:scale-90",
              MARK_STYLES[item.mark],
            ].join(" ")}
          >
            <span className="text-4xl font-extrabold" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
              {item.char.char}
            </span>
            <span className="text-sm text-[#AAAAAA] mt-1">{item.char.pinyin}</span>
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="w-full max-w-2xl bg-[#3A1A1A] border border-[#CC3333] text-[#FF6666] px-5 py-3 font-bold text-center">
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={phase === "submitting"}
        className={[
          "mc-btn mc-btn-gold w-full max-w-2xl py-6 text-base",
          phase !== "submitting" ? "active:scale-95" : "opacity-50 cursor-not-allowed",
        ].join(" ")}
      >
        {phase === "submitting" ? "提交中..." : "提交结果"}
      </button>
    </main>
  );
}
