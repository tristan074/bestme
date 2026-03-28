"use client";
import { useState, useEffect, useCallback } from "react";

interface Character {
  id: number;
  char: string;
  pinyin: string;
  lesson: string;
  status: "unlearned" | "learning" | "mastered";
  notebookId: number;
}

interface Notebook {
  id: number;
  name: string;
  isActive: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  unlearned: "未学",
  learning: "学习中",
  mastered: "已掌握",
};

const STATUS_COLORS: Record<string, string> = {
  unlearned: "bg-gray-100 text-gray-600",
  learning: "bg-blue-100 text-blue-700",
  mastered: "bg-green-100 text-green-700",
};

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeNotebook, setActiveNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [updating, setUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    const nbRes = await fetch("/api/chinese/notebooks");
    const notebooks: Notebook[] = await nbRes.json();
    const active = notebooks.find((nb) => nb.isActive) || null;
    setActiveNotebook(active);

    if (active) {
      const charRes = await fetch(`/api/chinese/characters?notebookId=${active.id}`);
      const chars: Character[] = await charRes.json();
      setCharacters(chars);
    } else {
      setCharacters([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBatchStatus(status: string) {
    if (selected.size === 0 || updating) return;
    setUpdating(true);
    await fetch("/api/chinese/characters", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), status }),
    });
    setSelected(new Set());
    setUpdating(false);
    await fetchData();
  }

  // Group by lesson
  const grouped = characters.reduce<Record<string, Character[]>>((acc, char) => {
    const key = char.lesson || "未分课";
    if (!acc[key]) acc[key] = [];
    acc[key].push(char);
    return acc;
  }, {});

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-400 to-pink-600 flex items-center justify-center">
        <div className="text-white text-2xl">加载中...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 flex flex-col items-center p-8 gap-8">
      <h1 className="text-4xl font-extrabold text-white drop-shadow-lg mt-4">生字库</h1>

      {!activeNotebook ? (
        <div className="w-full max-w-lg rounded-3xl bg-white/90 p-6 text-center text-gray-500 text-xl shadow-xl">
          还没有本子，请先
          <a href="/chinese/notebooks" className="text-rose-500 font-bold ml-1">创建一个本子</a>
        </div>
      ) : (
        <>
          <div className="w-full max-w-lg rounded-2xl bg-white/80 px-5 py-3 flex items-center gap-3 shadow">
            <span className="text-xl">📔</span>
            <span className="font-bold text-gray-800 text-lg">{activeNotebook.name}</span>
            <span className="ml-auto text-gray-500">{characters.length} 个生字</span>
          </div>

          {/* Batch actions */}
          {selected.size > 0 && (
            <div className="w-full max-w-lg rounded-2xl bg-white/90 p-4 shadow-xl flex flex-wrap items-center gap-3">
              <span className="text-gray-700 font-bold">已选 {selected.size} 个</span>
              <button
                onClick={() => handleBatchStatus("unlearned")}
                disabled={updating}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm active:scale-95 transition-all"
              >
                标记未学
              </button>
              <button
                onClick={() => handleBatchStatus("learning")}
                disabled={updating}
                className="px-4 py-2 rounded-xl bg-blue-100 text-blue-700 font-bold text-sm active:scale-95 transition-all"
              >
                加入学习
              </button>
              <button
                onClick={() => handleBatchStatus("mastered")}
                disabled={updating}
                className="px-4 py-2 rounded-xl bg-green-100 text-green-700 font-bold text-sm active:scale-95 transition-all"
              >
                标记掌握
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="ml-auto px-4 py-2 rounded-xl bg-gray-200 text-gray-500 text-sm active:scale-95 transition-all"
              >
                取消
              </button>
            </div>
          )}

          {characters.length === 0 ? (
            <div className="text-white/70 text-xl text-center">
              还没有生字，去
              <a href="/chinese/import" className="text-yellow-300 font-bold ml-1">导入</a>
              一些吧
            </div>
          ) : (
            <div className="w-full max-w-lg flex flex-col gap-6">
              {Object.entries(grouped).map(([lesson, chars]) => (
                <div key={lesson} className="rounded-3xl bg-white/90 shadow-xl overflow-hidden">
                  <div className="px-5 py-3 bg-white/60 font-bold text-gray-700 text-lg border-b border-gray-100">
                    {lesson}
                    <span className="ml-2 text-gray-400 text-base font-normal">({chars.length}字)</span>
                  </div>
                  <div className="flex flex-wrap gap-3 p-4">
                    {chars.map((char) => {
                      const isSelected = selected.has(char.id);
                      return (
                        <button
                          key={char.id}
                          onClick={() => toggleSelect(char.id)}
                          className={[
                            "flex flex-col items-center rounded-2xl px-4 py-3 min-w-[60px] transition-all active:scale-95 border-2",
                            isSelected
                              ? "border-rose-500 bg-rose-50 scale-105"
                              : "border-transparent bg-gray-50",
                          ].join(" ")}
                        >
                          <span className="text-3xl font-bold text-gray-800">{char.char}</span>
                          <span className="text-xs text-gray-500 mt-1">{char.pinyin}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${STATUS_COLORS[char.status]}`}>
                            {STATUS_LABELS[char.status]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
