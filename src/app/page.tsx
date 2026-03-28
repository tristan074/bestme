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
    <main className="min-h-screen bg-[#2D2D2D] flex flex-col items-center justify-center px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1
          className="text-4xl font-bold text-white mb-3"
          style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "3px 3px 0 rgba(0,0,0,0.6)" }}
        >
          BestMe
        </h1>
        <p className="text-lg text-[#AAAAAA]" style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.4)" }}>
          Fred 的学习助手
        </p>
      </div>

      {/* Subject cards */}
      <div className="w-full max-w-lg flex flex-col gap-4">
        {SUBJECT_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="mc-panel flex items-center gap-5 px-6 py-5 hover:brightness-125 active:scale-95 transition-all"
          >
            <span className="text-6xl leading-none shrink-0">{card.emoji}</span>
            <div>
              <p
                className="text-xl font-bold text-white"
                style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
              >
                {card.title}
              </p>
              <p className="text-sm text-[#AAAAAA] mt-1">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
