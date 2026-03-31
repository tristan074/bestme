"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Character {
  id: number;
  char: string;
  pinyin: string;
  exampleWord?: string;
}

type Phase = "loading" | "empty" | "start" | "session" | "done";

export default function DictationPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch("/api/chinese/today")
      .then((r) => r.json())
      .then((data: { characters: Character[] }) => {
        if (!data.characters || data.characters.length === 0) {
          setPhase("empty");
        } else {
          setCharacters(data.characters);
          setPhase("start");
        }
      });
  }, []);

  // Speak the example word (or pinyin if no example word) using Web Speech API
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "zh-CN";
    utter.rate = 0.8;
    window.speechSynthesis.speak(utter);
  }, []);

  function handleStart() {
    setCurrentIndex(0);
    setPhase("session");
    // Small delay so state settles before speaking
    const first = characters[0];
    setTimeout(() => speak(first.exampleWord || first.char), 100);
  }

  function handleReplay() {
    const cur = characters[currentIndex];
    speak(cur.exampleWord || cur.char);
  }

  function handleNext() {
    const next = currentIndex + 1;
    if (next >= characters.length) {
      // All done — save to sessionStorage and navigate to review
      sessionStorage.setItem("dictationChars", JSON.stringify(characters));
      router.push("/chinese/dictation/review");
    } else {
      const nxt = characters[next];
      setTimeout(() => speak(nxt.exampleWord || nxt.char), 100);
    }
  }

  const total = characters.length;
  const isLast = currentIndex === total - 1;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <main className="min-h-screen bg-[#2D2D2D] flex items-center justify-center">
        <div
          className="text-white text-xl animate-pulse"
          style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
        >
          加载中...
        </div>
      </main>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  if (phase === "empty") {
    return (
      <main className="min-h-screen bg-[#2D2D2D] flex flex-col items-center justify-center gap-8 p-8">
        <div className="text-8xl">🎉</div>
        <div
          className="text-xl font-bold text-white text-center"
          style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "3px 3px 0 rgba(0,0,0,0.6)" }}
        >
          今天没有需要复习的字！
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

  // ── Start screen ─────────────────────────────────────────────────────────
  if (phase === "start") {
    return (
      <main className="min-h-screen bg-[#2D2D2D] flex flex-col items-center justify-center gap-10 p-8">
        <div className="text-8xl">✍️</div>
        <div className="text-center">
          <div
            className="text-xl font-bold text-white mb-2"
            style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "3px 3px 0 rgba(0,0,0,0.6)" }}
          >
            今日听写
          </div>
          <div className="text-base text-[#AAAAAA]">共 {total} 个字需要复习</div>
        </div>
        {/* Preview of characters with example words */}
        <div className="w-full max-w-lg bg-[#3A3A3A] rounded-lg p-4 flex flex-wrap gap-2 justify-center max-h-40 overflow-y-auto">
          {characters.map((c) => (
            <div key={c.id} className="flex flex-col items-center">
              <span className="text-xl text-[#FFD700] font-bold">{c.char}</span>
              {c.exampleWord && (
                <span className="text-xs text-[#AAAAAA]">{c.exampleWord}</span>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={handleStart}
          className="mc-btn mc-btn-gold px-10 py-6 text-base active:scale-95"
        >
          开始听写 🎧
        </button>
        <button
          onClick={() => router.push("/chinese")}
          className="text-[#AAAAAA] text-sm underline"
        >
          返回
        </button>
      </main>
    );
  }

  // ── Session ──────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#2D2D2D] flex flex-col items-center justify-between p-8 gap-8">
      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between mt-4">
        <button
          onClick={() => router.push("/chinese")}
          className="text-[#AAAAAA] text-base hover:text-white transition-colors"
        >
          ✕ 退出
        </button>
        <div
          className="text-white text-base font-bold"
          style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
        >
          第 {currentIndex + 1} / {total} 个
        </div>
        <div className="w-12" />
      </div>

      {/* Speaker icon */}
      <div className="flex-1 flex items-center justify-center">
        <button
          onClick={handleReplay}
          className="text-[10rem] leading-none active:scale-90 transition-transform select-none"
          aria-label="播放读音"
        >
          🔊
        </button>
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-lg flex flex-col gap-4">
        <button
          onClick={handleReplay}
          className="mc-btn w-full py-5 text-base active:scale-95"
        >
          再听一遍
        </button>
        <button
          onClick={handleNext}
          className="mc-btn mc-btn-gold w-full py-5 text-base active:scale-95"
        >
          {isLast ? "听写完毕 ✓" : "下一个 →"}
        </button>
      </div>

      {/* XP progress bar */}
      <div className="w-full max-w-lg mc-xp-bar h-5 overflow-hidden mb-2">
        <div
          className="mc-xp-bar-fill h-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </main>
  );
}
