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
      <main className="min-h-screen bg-gradient-to-br from-red-400 to-pink-600 flex items-center justify-center">
        <div className="text-white text-2xl">加载中...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 flex flex-col items-center p-8 gap-8">
      <h1 className="text-4xl font-extrabold text-white drop-shadow-lg mt-4">导入生字</h1>

      {/* Active notebook info */}
      <div className="w-full max-w-lg rounded-3xl bg-white/90 p-5 shadow-xl">
        {activeNotebook ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl">📔</span>
            <div>
              <div className="text-sm text-gray-500">当前本子</div>
              <div className="text-2xl font-bold text-gray-800">{activeNotebook.name}</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 text-lg">
            还没有本子，请先
            <a href="/chinese/notebooks" className="text-rose-500 font-bold ml-1">创建一个本子</a>
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
            className="w-full rounded-2xl px-5 py-4 text-xl bg-white/90 outline-none"
          />

          {/* Text area */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="在这里粘贴包含生字的文本..."
            rows={6}
            className="w-full rounded-2xl px-5 py-4 text-xl bg-white/90 outline-none resize-none"
          />

          <button
            type="submit"
            disabled={!text.trim() || importing}
            className={[
              "w-full py-5 rounded-3xl text-2xl font-extrabold shadow-xl transition-all",
              text.trim() && !importing
                ? "bg-yellow-400 text-white active:scale-95"
                : "bg-white/30 text-white/50 cursor-not-allowed",
            ].join(" ")}
          >
            {importing ? "导入中..." : "导入生字"}
          </button>
        </form>
      )}

      {/* Result summary */}
      {result && (
        <div className="w-full max-w-lg rounded-3xl bg-white/90 p-6 shadow-xl text-center">
          <div className="text-3xl font-extrabold text-green-600 mb-2">导入完成</div>
          <div className="flex justify-center gap-8 text-xl">
            <div>
              <div className="text-4xl font-bold text-gray-800">{result.imported}</div>
              <div className="text-gray-500">新增</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-400">{result.skipped}</div>
              <div className="text-gray-500">已存在</div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
