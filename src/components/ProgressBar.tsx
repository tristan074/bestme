interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

export default function ProgressBar({ label, value, max, color }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm text-[#AAAAAA]">
        <span>{label}</span>
        <span>
          {value} / {max}
        </span>
      </div>
      {/* XP bar style */}
      <div className="w-full mc-xp-bar h-4 overflow-hidden">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(to bottom, ${color}CC, ${color})`,
            boxShadow: `0 0 6px ${color}66`,
          }}
        />
      </div>
    </div>
  );
}
