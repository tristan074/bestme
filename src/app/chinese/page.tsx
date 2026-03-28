import Link from "next/link";

const MODULES = [
  { href: "/chinese/notebooks", label: "本子管理", description: "创建和管理生字本", icon: "📔" },
  { href: "/chinese/import", label: "导入生字", description: "批量导入新生字", icon: "📥" },
  { href: "/chinese/characters", label: "生字库", description: "查看和管理所有生字", icon: "🈳" },
  { href: "/chinese/dictation", label: "听写练习", description: "开始今日听写", icon: "✍️" },
];

export default function ChinesePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 flex flex-col items-center justify-center p-8 gap-10">
      <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">语文练习</h1>

      <div className="grid grid-cols-1 gap-6 w-full max-w-lg">
        {MODULES.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="flex items-center gap-6 rounded-3xl p-6 shadow-xl bg-white/80 hover:bg-white active:scale-95 transition-all"
          >
            <span className="text-5xl">{m.icon}</span>
            <div>
              <div className="text-2xl font-bold text-gray-800">{m.label}</div>
              <div className="text-lg text-gray-500">{m.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
