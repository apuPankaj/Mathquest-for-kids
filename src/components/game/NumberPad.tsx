import React, { useEffect, useRef, useState } from "react";

// The numbers stage: the child types the answer. With nothing to pick from,
// guessing stops working — this is where we find out they really know it.
// A computer keyboard works too (digits, Backspace, Enter).

interface NumberPadProps {
  reveal: number | null; // after "Show me": the answer to type
  locked: boolean;
  onSubmit: (n: number) => void;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"];

export default function NumberPad({ reveal, locked, onSubmit }: NumberPadProps) {
  const [value, setValue] = useState("");
  // The typed number is also kept in a ref, updated the instant a key is
  // pressed. Two keys pressed faster than the screen redraws (a "1" and then
  // Enter) must still see each other — otherwise Enter reads the old, empty
  // value and the answer is silently ignored.
  const valueRef = useRef("");
  const update = (v: string) => {
    valueRef.current = v;
    setValue(v);
  };

  const press = (key: string) => {
    if (locked) return;
    const v = valueRef.current;
    if (key === "⌫") {
      update(v.slice(0, -1));
    } else if (key === "✓") {
      if (v === "") return;
      update("");
      onSubmit(Number(v));
    } else if (v.length < 2) {
      update(v === "0" ? key : v + key);
    }
  };

  // Keyboard support reads the latest press() through a ref.
  const pressRef = useRef(press);
  useEffect(() => {
    pressRef.current = press;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) pressRef.current(e.key);
      else if (e.key === "Backspace") pressRef.current("⌫");
      else if (e.key === "Enter") pressRef.current("✓");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        aria-live="polite"
        className="w-32 h-16 rounded-2xl bg-white text-emerald-950 text-5xl font-black font-fredoka flex items-center justify-center shadow-inner border-4 border-amber-300"
      >
        {value || <span className="text-slate-300">{reveal ?? "?"}</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key) => (
          <button
            type="button"
            key={key}
            onClick={() => press(key)}
            disabled={locked}
            aria-label={key === "⌫" ? "Delete" : key === "✓" ? "Check my answer" : key}
            className={`w-16 h-14 sm:w-20 sm:h-16 rounded-xl text-3xl font-black font-fredoka transition-all active:translate-y-1 disabled:opacity-50 ${
              key === "✓"
                ? "bg-emerald-400 text-emerald-950 shadow-[0_4px_0_#047857] active:shadow-none"
                : key === "⌫"
                  ? "bg-slate-300 text-slate-700 shadow-[0_4px_0_#64748b] active:shadow-none"
                  : "bg-amber-400 text-amber-950 shadow-[0_4px_0_#b45309] active:shadow-none"
            }`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
