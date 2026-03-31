"use client";
import { useState, useEffect } from "react";

export default function ChineseSettingsPage() {
  const [dailyLimit, setDailyLimit] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings?key=chinese_daily_limit")
      .then((r) => r.json())
      .then((data: { value: string | null }) => {
        setDailyLimit(data.value ?? "20");
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const val = parseInt(dailyLimit, 10);
    if (isNaN(val) || val < 1) return;
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "chinese_daily_limit", value: String(val) }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main className="min-h-screen bg-[#2D2D2D] flex flex-col items-center p-8 gap-8">
      <a href="/chinese" className="mc-btn px-4 py-2 text-sm self-start">← 返回</a>
      <h1
        className="text-2xl font-bold text-white"
        style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "3px 3px 0 rgba(0,0,0,0.6)" }}
      >
        语文设置
      </h1>

      <form onSubmit={handleSave} className="w-full max-w-lg mc-panel p-6 flex flex-col gap-6">
        <div>
          <div className="text-sm text-[#AAAAAA] mb-2">每日新字上限</div>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min="1"
              max="200"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              className="w-24 bg-[#3A3A3A] border border-[#6B6B6B] px-4 py-3 text-2xl text-white text-center outline-none"
            />
            <span className="text-xl text-[#AAAAAA]">字 / 天</span>
          </div>
          <div className="text-xs text-[#777] mt-2">
            批量标记生字时，每天最多安排这么多字复习。修改后会自动重新排期。
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className={[
            "mc-btn w-full py-4 text-base",
            saving ? "opacity-50" : "mc-btn-gold active:scale-95",
          ].join(" ")}
        >
          {saving ? "保存中..." : saved ? "已保存 ✓" : "保存设置"}
        </button>
      </form>
    </main>
  );
}
