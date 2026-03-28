import Link from "next/link";

const SUBJECT_CARDS = [
  {
    href: "/math",
    emoji: "📐",
    title: "数学",
    description: "口算练习，从基础到挑战",
  },
  {
    href: "/chinese",
    emoji: "📖",
    title: "语文",
    description: "词语听写，巩固生字词",
  },
  {
    href: "/dashboard",
    emoji: "📊",
    title: "数据",
    description: "学习记录，查看成长轨迹",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 flex flex-col items-center justify-center px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-2">BestMe</h1>
        <p className="text-xl text-indigo-100">Fred 的学习助手</p>
      </div>

      {/* Subject cards */}
      <div className="w-full max-w-lg flex flex-col gap-4">
        {SUBJECT_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex items-center gap-5 bg-white/15 hover:bg-white/25 active:bg-white/30 backdrop-blur-sm rounded-2xl px-6 py-5 transition-colors"
          >
            <span className="text-6xl leading-none shrink-0">{card.emoji}</span>
            <div>
              <p className="text-2xl font-bold text-white">{card.title}</p>
              <p className="text-sm text-indigo-100 mt-0.5">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
