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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe">
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
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
                isActive
                  ? "text-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="text-2xl leading-none">{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
