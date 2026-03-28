"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Character {
  id: number;
  char: string;
  pinyin: string;
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

  // Speak the pinyin of the current character using Web Speech API
  const speak = useCallback((pinyin: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(pinyin);
    utter.lang = "zh-CN";
    utter.rate = 0.8;
    window.speechSynthesis.speak(utter);
  }, []);

  function handleStart() {
    setCurrentIndex(0);
    setPhase("session");
    // Small delay so state settles before speaking
    setTimeout(() => speak(characters[0].pinyin), 100);
  }

  function handleReplay() {
    speak(characters[currentIndex].pinyin);
  }

  function handleNext() {
    const next = currentIndex + 1;
    if (next >= characters.length) {
      // All done — save to sessionStorage and navigate to review
      sessionStorage.setItem("dictationChars", JSON.stringify(characters));
      router.push("/chinese/dictation/review");
    } else {
      setCurrentIndex(next);
      setTimeout(() => speak(characters[next].pinyin), 100);
    }
  }

  const total = characters.length;
  const isLast = currentIndex === total - 1;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-400 to-pink-600 flex items-center justify-center">
        <div className="text-white text-2xl">加载中...</div>
      </main>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  if (phase === "empty") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 flex flex-col items-center justify-center gap-8 p-8">
        <div className="text-8xl">🎉</div>
        <div className="text-3xl font-extrabold text-white text-center drop-shadow-lg">
          今天没有需要复习的字！
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

  // ── Start screen ─────────────────────────────────────────────────────────
  if (phase === "start") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 flex flex-col items-center justify-center gap-10 p-8">
        <div className="text-8xl">✍️</div>
        <div className="text-center">
          <div className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">今日听写</div>
          <div className="text-xl text-white/80">共 {total} 个字需要复习</div>
        </div>
        <button
          onClick={handleStart}
          className="px-10 py-6 rounded-3xl bg-yellow-400 text-white text-2xl font-extrabold shadow-xl active:scale-95 transition-all"
        >
          开始听写 🎧
        </button>
        <button
          onClick={() => router.push("/chinese")}
          className="text-white/70 text-lg underline"
        >
          返回
        </button>
      </main>
    );
  }

  // ── Session ──────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 flex flex-col items-center justify-between p-8 gap-8">
      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between mt-4">
        <button
          onClick={() => router.push("/chinese")}
          className="text-white/80 text-lg"
        >
          ✕ 退出
        </button>
        <div className="text-white text-xl font-bold">
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
          className="w-full py-5 rounded-3xl bg-white/20 text-white text-2xl font-bold shadow active:scale-95 transition-all"
        >
          再听一遍
        </button>
        <button
          onClick={handleNext}
          className="w-full py-5 rounded-3xl bg-yellow-400 text-white text-2xl font-extrabold shadow-xl active:scale-95 transition-all"
        >
          {isLast ? "听写完毕 ✓" : "下一个 →"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-lg h-3 bg-white/20 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-white rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </main>
  );
}
