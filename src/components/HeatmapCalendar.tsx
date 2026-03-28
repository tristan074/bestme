"use client";

import { useState } from "react";

interface CheckinDay {
  date: string;
  math: boolean;
  chinese: boolean;
}

interface HeatmapCalendarProps {
  checkins: CheckinDay[];
}

function getColor(checkin: CheckinDay | undefined): string {
  if (!checkin) return "bg-white/10";
  if (checkin.math && checkin.chinese) return "bg-green-400";
  if (checkin.math || checkin.chinese) return "bg-green-700";
  return "bg-white/10";
}

function getLabel(checkin: CheckinDay | undefined, date: string): string {
  if (!checkin) return date;
  const parts = [];
  if (checkin.math) parts.push("数学");
  if (checkin.chinese) parts.push("语文");
  return parts.length > 0 ? `${date}: ${parts.join(" + ")}` : date;
}

export default function HeatmapCalendar({ checkins }: HeatmapCalendarProps) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const checkinMap = new Map(checkins.map((c) => [c.date, c]));

  // Build last 90 days
  const days: string[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  // Pad so grid starts on Sunday
  const firstDayOfWeek = new Date(days[0]).getDay(); // 0=Sun
  const paddedDays: (string | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...days,
  ];

  return (
    <div className="relative">
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}
      >
        {paddedDays.map((date, i) => {
          if (!date) {
            return <div key={`pad-${i}`} className="w-5 h-5" />;
          }
          const checkin = checkinMap.get(date);
          return (
            <div
              key={date}
              className={`w-5 h-5 rounded-sm cursor-pointer transition-opacity hover:opacity-80 ${getColor(checkin)}`}
              onMouseEnter={(e) => {
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                setTooltip({
                  text: getLabel(checkin, date),
                  x: rect.left,
                  y: rect.top,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}
      </div>

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y - 32 }}
        >
          {tooltip.text}
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 text-xs text-white/50">
        <span className="w-3 h-3 rounded-sm bg-white/10 inline-block" /> 无
        <span className="w-3 h-3 rounded-sm bg-green-700 inline-block ml-2" /> 部分
        <span className="w-3 h-3 rounded-sm bg-green-400 inline-block ml-2" /> 全完成
      </div>
    </div>
  );
}
