"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "首页", emoji: "🏠", href: "/" },
  { label: "数学", emoji: "📐", href: "/math" },
  { label: "语文", emoji: "📖", href: "/chinese" },
  { label: "数据", emoji: "📊", href: "/dashboard" },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide during practice/dictation sessions
  if (pathname.includes("/practice") || pathname.includes("/dictation")) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{
        background: "#2D2D2D",
        borderTop: "3px solid",
        borderColor: "#6B6B6B #2D2D2D #2D2D2D #6B6B6B",
      }}
    >
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive
                  ? "bg-[#3A3A3A] text-[#FFD700]"
                  : "text-[#AAAAAA] hover:bg-[#3A3A3A] hover:text-white"
              }`}
              style={isActive ? { textShadow: "1px 1px 0 rgba(0,0,0,0.5)" } : undefined}
            >
              <span className="text-2xl leading-none">{item.emoji}</span>
              <span
                className="text-[10px]"
                style={{ fontFamily: "var(--font-press-start), monospace" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
