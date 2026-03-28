"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TrendChartProps {
  data: { date: string; value: number }[];
  color: string;
  label: string;
  unit: string;
}

export default function TrendChart({ data, color, label, unit }: TrendChartProps) {
  return (
    <div>
      <p className="text-sm text-[#AAAAAA] mb-2">{label}</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#AAAAAA", fontSize: 10 }}
            tickFormatter={(v) => v.slice(5)}
          />
          <YAxis tick={{ fill: "#AAAAAA", fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              background: "#2D2D2D",
              border: "2px solid #6B6B6B",
              borderRadius: 0,
              color: "#FFFFFF",
              fontFamily: "monospace",
            }}
            formatter={(v) => [`${v}${unit}`, label]}
            labelFormatter={(l) => l}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
