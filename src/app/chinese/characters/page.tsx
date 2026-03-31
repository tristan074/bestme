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

// MC-themed status colors
const STATUS_COLORS: Record<string, string> = {
  unlearned: "bg-[#3A3A3A] text-[#AAAAAA]",
  learning: "bg-[#1A3A5A] text-[#2A9FD6]",
  mastered: "bg-[#1A3A1A] text-[#5B8731]",
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
        生字库
      </h1>

      <a href="/chinese" className="mc-btn px-4 py-2 text-sm self-start">← 返回</a>

      {!activeNotebook ? (
        <div className="w-full max-w-lg mc-panel p-6 text-center text-[#AAAAAA] text-base">
          还没有本子，请先
          <a href="/chinese/notebooks" className="text-[#2A9FD6] font-bold ml-1">创建一个本子</a>
        </div>
      ) : (
        <>
          <div className="w-full max-w-lg mc-panel px-5 py-3 flex items-center gap-3">
            <span className="text-xl">📔</span>
            <span className="font-bold text-white text-base">{activeNotebook.name}</span>
            <span className="ml-auto text-[#AAAAAA] text-sm">{characters.length} 个生字</span>
          </div>

          {/* Batch actions */}
          {selected.size > 0 && (
            <div className="w-full max-w-lg mc-panel p-4 flex flex-wrap items-center gap-3">
              <span className="text-white font-bold text-sm">已选 {selected.size} 个</span>
              <button
                onClick={() => handleBatchStatus("unlearned")}
                disabled={updating}
                className="mc-btn px-4 py-2 text-xs"
              >
                标记未学
              </button>
              <button
                onClick={() => handleBatchStatus("learning")}
                disabled={updating}
                className="mc-btn px-4 py-2 text-xs"
              >
                加入学习
              </button>
              <button
                onClick={() => handleBatchStatus("mastered")}
                disabled={updating}
                className="mc-btn mc-btn-green px-4 py-2 text-xs"
              >
                标记掌握
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="mc-btn ml-auto px-4 py-2 text-xs"
              >
                取消
              </button>
            </div>
          )}

          {characters.length === 0 ? (
            <div className="text-[#AAAAAA] text-base text-center">
              还没有生字，去
              <a href="/chinese/import" className="text-[#FFD700] font-bold ml-1">导入</a>
              一些吧
            </div>
          ) : (
            <div className="w-full max-w-lg flex flex-col gap-6">
              {Object.entries(grouped).map(([lesson, chars]) => (
                <div key={lesson} className="mc-panel overflow-hidden">
                  <div className="px-5 py-3 bg-[#3A3A3A] flex items-center gap-2 border-b border-[#2D2D2D]">
                    <button
                      onClick={() => {
                        const allIds = chars.map((c) => c.id);
                        const allSelected = allIds.every((id) => selected.has(id));
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (allSelected) allIds.forEach((id) => next.delete(id));
                          else allIds.forEach((id) => next.add(id));
                          return next;
                        });
                      }}
                      className="text-xs text-[#FFD700] underline hover:text-white"
                    >
                      全选
                    </button>
                    <span
                      className="font-bold text-[#FFD700] text-sm"
                      style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "1px 1px 0 rgba(0,0,0,0.5)" }}
                    >
                      {lesson}
                    </span>
                    <span className="ml-2 text-[#AAAAAA] text-xs">({chars.length}字)</span>
                  </div>
                  <div className="flex flex-wrap gap-3 p-4">
                    {chars.map((char) => {
                      const isSelected = selected.has(char.id);
                      return (
                        <button
                          key={char.id}
                          onClick={() => toggleSelect(char.id)}
                          className={[
                            "flex flex-col items-center px-4 py-3 min-w-[60px] transition-all active:scale-95 border-2",
                            isSelected
                              ? "border-[#FFD700] bg-[#3A3A1A] scale-105"
                              : "border-[#6B6B6B] bg-[#3A3A3A] hover:brightness-125",
                          ].join(" ")}
                        >
                          <span className="text-3xl font-bold text-white" style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.5)" }}>
                            {char.char}
                          </span>
                          <span className="text-xs text-[#AAAAAA] mt-1">{char.pinyin}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 mt-1 ${STATUS_COLORS[char.status]}`}>
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
