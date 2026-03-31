"use client";
import { useState, useEffect, useCallback } from "react";

interface Notebook {
  id: number;
  name: string;
  isActive: boolean;
  archived: boolean;
  _count: { characters: number };
}

export default function NotebooksPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchNotebooks = useCallback(async () => {
    const res = await fetch("/api/chinese/notebooks");
    const data = await res.json();
    setNotebooks(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotebooks(); }, [fetchNotebooks]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || submitting) return;
    setSubmitting(true);
    await fetch("/api/chinese/notebooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    setSubmitting(false);
    await fetchNotebooks();
  }

  async function handleRename(id: number) {
    if (!editName.trim() || submitting) return;
    setSubmitting(true);
    await fetch("/api/chinese/notebooks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editName.trim() }),
    });
    setEditingId(null);
    setEditName("");
    setSubmitting(false);
    await fetchNotebooks();
  }

  async function handleActivate(id: number) {
    await fetch("/api/chinese/notebooks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: true }),
    });
    await fetchNotebooks();
  }

  async function handleArchive(id: number) {
    await fetch("/api/chinese/notebooks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, archived: true }),
    });
    await fetchNotebooks();
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
        本子管理
      </h1>

      {/* Create new notebook */}
      <form onSubmit={handleCreate} className="w-full max-w-lg flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="新本子名称..."
          className="flex-1 mc-panel px-5 py-4 text-xl text-white bg-[#3A3A3A] outline-none placeholder:text-[#777]"
        />
        <button
          type="submit"
          disabled={!newName.trim() || submitting}
          className="mc-btn mc-btn-gold px-6 py-4 text-base disabled:opacity-50"
        >
          创建
        </button>
      </form>

      {/* Notebooks list */}
      <div className="w-full max-w-lg flex flex-col gap-4">
        {notebooks.length === 0 && (
          <div className="text-center text-[#AAAAAA] text-base">还没有本子，创建一个吧</div>
        )}
        {notebooks.map((nb) => (
          <div
            key={nb.id}
            className={[
              "mc-panel p-5 flex flex-col gap-3",
              nb.isActive ? "outline outline-2 outline-[#FFD700]" : "",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              {editingId === nb.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 bg-[#3A3A3A] border border-[#6B6B6B] px-4 py-2 text-xl text-white outline-none"
                  autoFocus
                />
              ) : (
                <span className="flex-1 text-xl font-bold text-white" style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.5)" }}>
                  {nb.name}
                </span>
              )}
              {nb.isActive && (
                <span
                  className="bg-[#FFD700] text-[#3A2800] text-xs font-bold px-3 py-1"
                  style={{ fontFamily: "var(--font-press-start), monospace" }}
                >
                  当前
                </span>
              )}
            </div>

            <div className="text-[#AAAAAA] text-base">{nb._count.characters} 个生字</div>

            <div className="flex flex-wrap gap-2">
              {editingId === nb.id ? (
                <>
                  <button
                    onClick={() => handleRename(nb.id)}
                    disabled={submitting}
                    className="mc-btn mc-btn-green px-4 py-2 text-xs"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setEditName(""); }}
                    className="mc-btn px-4 py-2 text-xs"
                  >
                    取消
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setEditingId(nb.id); setEditName(nb.name); }}
                    className="mc-btn px-4 py-2 text-xs"
                  >
                    重命名
                  </button>
                  {!nb.isActive && (
                    <button
                      onClick={() => handleActivate(nb.id)}
                      className="mc-btn mc-btn-gold px-4 py-2 text-xs"
                    >
                      设为当前
                    </button>
                  )}
                  <button
                    onClick={() => handleArchive(nb.id)}
                    className="mc-btn px-4 py-2 text-xs"
                  >
                    归档
                  </button>
                  <a
                    href="/chinese/settings"
                    className="mc-btn px-4 py-2 text-xs"
                  >
                    设置
                  </a>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
