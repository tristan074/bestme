import Link from "next/link";

const MODULES = [
  { href: "/chinese/notebooks", label: "本子管理", description: "创建和管理生字本", icon: "📔" },
  { href: "/chinese/import", label: "导入生字", description: "批量导入新生字", icon: "📥" },
  { href: "/chinese/characters", label: "生字库", description: "查看和管理所有生字", icon: "🈳" },
  { href: "/chinese/dictation", label: "听写练习", description: "开始今日听写", icon: "✍️" },
];

export default function ChinesePage() {
  return (
    <main className="min-h-screen bg-[#2D2D2D] flex flex-col items-center justify-center p-8 gap-10">
      <h1
        className="text-3xl font-bold text-white"
        style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "3px 3px 0 rgba(0,0,0,0.6)" }}
      >
        语文练习
      </h1>

      <div className="grid grid-cols-1 gap-4 w-full max-w-lg">
        {MODULES.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="mc-panel flex items-center gap-6 p-6 hover:brightness-125 active:scale-95 transition-all"
          >
            <span className="text-5xl">{m.icon}</span>
            <div>
              <div
                className="text-base font-bold text-white"
                style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
              >
                {m.label}
              </div>
              <div className="text-sm text-[#AAAAAA] mt-1">{m.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
