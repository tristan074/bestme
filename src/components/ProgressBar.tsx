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
      <div className="flex justify-between text-sm text-white/80">
        <span>{label}</span>
        <span>
          {value} / {max}
        </span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
