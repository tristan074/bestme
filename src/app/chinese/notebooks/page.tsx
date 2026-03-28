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
      <main className="min-h-screen bg-gradient-to-br from-red-400 to-pink-600 flex items-center justify-center">
        <div className="text-white text-2xl">加载中...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 flex flex-col items-center p-8 gap-8">
      <h1 className="text-4xl font-extrabold text-white drop-shadow-lg mt-4">本子管理</h1>

      {/* Create new notebook */}
      <form onSubmit={handleCreate} className="w-full max-w-lg flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="新本子名称..."
          className="flex-1 rounded-2xl px-5 py-4 text-xl bg-white/90 outline-none"
        />
        <button
          type="submit"
          disabled={!newName.trim() || submitting}
          className="rounded-2xl px-6 py-4 text-xl font-bold bg-yellow-400 text-white disabled:opacity-50 active:scale-95 transition-all"
        >
          创建
        </button>
      </form>

      {/* Notebooks list */}
      <div className="w-full max-w-lg flex flex-col gap-4">
        {notebooks.length === 0 && (
          <div className="text-center text-white/70 text-xl">还没有本子，创建一个吧</div>
        )}
        {notebooks.map((nb) => (
          <div
            key={nb.id}
            className={[
              "rounded-3xl p-5 shadow-xl bg-white/90 flex flex-col gap-3",
              nb.isActive ? "ring-4 ring-yellow-400" : "",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              {editingId === nb.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 rounded-xl px-4 py-2 text-xl bg-gray-100 outline-none"
                  autoFocus
                />
              ) : (
                <span className="flex-1 text-2xl font-bold text-gray-800">{nb.name}</span>
              )}
              {nb.isActive && (
                <span className="bg-yellow-400 text-white text-sm font-bold px-3 py-1 rounded-full">当前</span>
              )}
            </div>

            <div className="text-gray-500 text-lg">{nb._count.characters} 个生字</div>

            <div className="flex flex-wrap gap-2">
              {editingId === nb.id ? (
                <>
                  <button
                    onClick={() => handleRename(nb.id)}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-green-500 text-white font-bold text-sm active:scale-95 transition-all"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setEditName(""); }}
                    className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-bold text-sm active:scale-95 transition-all"
                  >
                    取消
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setEditingId(nb.id); setEditName(nb.name); }}
                    className="px-4 py-2 rounded-xl bg-blue-100 text-blue-700 font-bold text-sm active:scale-95 transition-all"
                  >
                    重命名
                  </button>
                  {!nb.isActive && (
                    <button
                      onClick={() => handleActivate(nb.id)}
                      className="px-4 py-2 rounded-xl bg-yellow-100 text-yellow-700 font-bold text-sm active:scale-95 transition-all"
                    >
                      设为当前
                    </button>
                  )}
                  <button
                    onClick={() => handleArchive(nb.id)}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm active:scale-95 transition-all"
                  >
                    归档
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
