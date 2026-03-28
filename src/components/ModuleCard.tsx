"use client";
import Link from "next/link";

interface ModuleCardProps {
  title: string;
  description: string;
  emoji: string;
  href: string;
}

export default function ModuleCard({ title, description, emoji, href }: ModuleCardProps) {
  return (
    <Link href={href} className="flex flex-col items-center gap-3 rounded-3xl bg-white p-8 shadow-lg active:scale-95 transition-transform">
      <span className="text-6xl">{emoji}</span>
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      <p className="text-lg text-gray-500">{description}</p>
    </Link>
  );
}
