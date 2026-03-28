interface AchievementBadgeProps {
  emoji: string;
  name: string;
  description: string;
  unlocked: boolean;
}

export default function AchievementBadge({
  emoji,
  name,
  description,
  unlocked,
}: AchievementBadgeProps) {
  return (
    <div
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
        unlocked
          ? "border-yellow-400/50 bg-yellow-400/10"
          : "border-white/10 bg-white/5 opacity-40 grayscale"
      }`}
    >
      <span className="text-3xl" role="img" aria-label={name}>
        {emoji}
      </span>
      <p className="text-sm font-semibold text-white text-center">{name}</p>
      <p className="text-xs text-white/60 text-center leading-snug">{description}</p>
      {unlocked && (
        <span className="text-xs text-yellow-400 font-medium">已解锁</span>
      )}
    </div>
  );
}
