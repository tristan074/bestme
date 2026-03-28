"use client";
import { useState, useEffect } from "react";

interface Notebook {
  id: number;
  name: string;
  isActive: boolean;
}

export default function ImportPage() {
  const [activeNotebook, setActiveNotebook] = useState<Notebook | null>(null);
  const [text, setText] = useState("");
  const [lesson, setLesson] = useState("");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  useEffect(() => {
    fetch("/api/chinese/notebooks")
      .then((r) => r.json())
      .then((data: Notebook[]) => {
        const active = data.find((nb) => nb.isActive) || null;
        setActiveNotebook(active);
        setLoading(false);
      });
  }, []);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!activeNotebook || !text.trim() || importing) return;
    setImporting(true);
    setResult(null);

    const res = await fetch("/api/chinese/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notebookId: activeNotebook.id,
        text,
        lesson: lesson.trim() || undefined,
      }),
    });
    const data = await res.json();
    setResult(data);
    setText("");
    setLesson("");
    setImporting(false);
  }

  if (loading) {
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

  return (
    <main className="min-h-screen bg-[#2D2D2D] flex flex-col items-center p-8 gap-8">
      <h1
        className="text-2xl font-bold text-white mt-4"
        style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "3px 3px 0 rgba(0,0,0,0.6)" }}
      >
        导入生字
      </h1>

      {/* Active notebook info */}
      <div className="w-full max-w-lg mc-panel p-5">
        {activeNotebook ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl">📔</span>
            <div>
              <div className="text-sm text-[#AAAAAA]">当前本子</div>
              <div className="text-xl font-bold text-white" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
                {activeNotebook.name}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-[#AAAAAA] text-base">
            还没有本子，请先
            <a href="/chinese/notebooks" className="text-[#2A9FD6] font-bold ml-1">创建一个本子</a>
          </div>
        )}
      </div>

      {activeNotebook && (
        <form onSubmit={handleImport} className="w-full max-w-lg flex flex-col gap-5">
          {/* Lesson name */}
          <input
            type="text"
            value={lesson}
            onChange={(e) => setLesson(e.target.value)}
            placeholder="课程名称（选填，如：第一课）"
            className="w-full mc-panel px-5 py-4 text-xl text-white bg-[#3A3A3A] outline-none placeholder:text-[#777]"
          />

          {/* Text area */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="在这里粘贴包含生字的文本..."
            rows={6}
            className="w-full mc-panel px-5 py-4 text-xl text-white bg-[#3A3A3A] outline-none resize-none placeholder:text-[#777]"
          />

          <button
            type="submit"
            disabled={!text.trim() || importing}
            className={[
              "mc-btn mc-btn-gold w-full py-5 text-base",
              text.trim() && !importing ? "active:scale-95" : "opacity-50 cursor-not-allowed",
            ].join(" ")}
          >
            {importing ? "导入中..." : "导入生字"}
          </button>
        </form>
      )}

      {/* Result summary */}
      {result && (
        <div className="w-full max-w-lg mc-panel p-6 text-center">
          <div
            className="text-xl font-bold text-[#5B8731] mb-4"
            style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
          >
            导入完成
          </div>
          <div className="flex justify-center gap-8 text-xl">
            <div>
              <div className="text-4xl font-bold text-[#FFD700]" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
                {result.imported}
              </div>
              <div className="text-[#AAAAAA]">新增</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#AAAAAA]">{result.skipped}</div>
              <div className="text-[#AAAAAA]">已存在</div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
