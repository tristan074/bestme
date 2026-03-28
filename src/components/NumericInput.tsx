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
      {/* Display box */}
      <div className="w-full rounded-2xl bg-white border-4 border-blue-300 text-center text-5xl font-bold text-gray-800 py-4 min-h-[80px] flex items-center justify-center shadow-inner">
        {input === "" ? <span className="text-gray-300">?</span> : input}
      </div>

      {/* Keypad 3x4 grid */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {KEYS.map((key) => {
          const isOk = key === "ok";
          const isDel = key === "del";
          return (
            <button
              key={key}
              onClick={() => handleKey(key)}
              className={[
                "rounded-2xl py-5 text-2xl font-bold shadow-md active:scale-95 transition-transform select-none",
                isOk
                  ? "bg-green-500 text-white"
                  : isDel
                  ? "bg-red-100 text-red-600"
                  : "bg-white text-gray-800",
              ].join(" ")}
            >
              {isOk ? "确认" : isDel ? "⌫" : key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
