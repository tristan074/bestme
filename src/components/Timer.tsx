"use client";
import { useEffect, useState } from "react";

interface TimerProps { running: boolean; onTick?: (ms: number) => void; }

export default function Timer({ running, onTick }: TimerProps) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    const start = Date.now() - elapsed;
    const interval = setInterval(() => {
      const now = Date.now() - start;
      setElapsed(now);
      onTick?.(now);
    }, 100);
    return () => clearInterval(interval);
  }, [running]); // eslint-disable-line
  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  return (
    <div
      className="text-2xl font-bold text-[#FFD700]"
      style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "2px 2px 0 rgba(0,0,0,0.6)" }}
    >
      ⏱ {minutes.toString().padStart(2, "0")}:{(seconds % 60).toString().padStart(2, "0")}
    </div>
  );
}
