"use client";
import { useState } from "react";

interface NumericInputProps {
  onSubmit: (value: number) => void;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "ok"];

export default function NumericInput({ onSubmit }: NumericInputProps) {
  const [input, setInput] = useState("");

  function handleKey(key: string) {
    if (key === "del") {
      setInput((prev) => prev.slice(0, -1));
    } else if (key === "ok") {
      if (input === "") return;
      onSubmit(parseInt(input, 10));
      setInput("");
    } else {
      // Max 3 digits
      if (input.length >= 3) return;
      setInput((prev) => prev + key);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xs">
      {/* Display box — inventory slot style */}
      <div
        className="w-full mc-panel text-center text-5xl font-bold text-white py-4 min-h-[80px] flex items-center justify-center"
        style={{ fontFamily: "var(--font-press-start), monospace", textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
      >
        {input === "" ? <span className="text-[#6B6B6B]">?</span> : input}
      </div>

      {/* Keypad 3×4 grid — inventory slot style keys */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {KEYS.map((key) => {
          const isOk = key === "ok";
          const isDel = key === "del";
          return (
            <button
              key={key}
              onClick={() => handleKey(key)}
              className={[
                "mc-btn py-5 text-xl active:scale-95",
                isOk ? "mc-btn-green" : isDel ? "" : "",
              ].join(" ")}
              style={isDel ? { color: "#FF6666" } : undefined}
            >
              {isOk ? "确认" : isDel ? "⌫" : key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
