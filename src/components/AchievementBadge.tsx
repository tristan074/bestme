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
      className={`flex flex-col items-center gap-2 p-4 border-2 transition-all ${
        unlocked
          ? "border-[#FFD700] bg-[#2D2800]"
          : "border-[#3A3A3A] bg-[#222] opacity-40 grayscale"
      }`}
    >
      <span className="text-3xl" role="img" aria-label={name}>
        {emoji}
      </span>
      <p
        className="text-xs font-semibold text-white text-center"
        style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.5)" }}
      >
        {name}
      </p>
      <p className="text-xs text-[#AAAAAA] text-center leading-snug">{description}</p>
      {unlocked && (
        <span
          className="text-xs text-[#FFD700] font-medium"
          style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.5)" }}
        >
          已解锁
        </span>
      )}
    </div>
  );
}
