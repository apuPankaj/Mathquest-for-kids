import React from "react";

// Three big answer buttons, for the objects and pictures stages.
// A wrong pick is dimmed rather than marked with a red cross — the child
// should feel "not that one", not "you failed".

interface AnswerChoicesProps {
  choices: number[];
  tried: number[]; // wrong answers already picked
  reveal: number | null; // after "Show me": the answer to tap
  locked: boolean; // e.g. while the demonstration plays
  onPick: (n: number) => void;
}

export default function AnswerChoices({ choices, tried, reveal, locked, onPick }: AnswerChoicesProps) {
  return (
    <div data-part="choices" className="flex items-center justify-center gap-4 sm:gap-6">
      {choices.map((n) => {
        const wasTried = tried.includes(n);
        const glowing = reveal === n;
        return (
          <button
            type="button"
            key={n}
            onClick={() => onPick(n)}
            disabled={locked || wasTried || (reveal !== null && !glowing)}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl font-black text-4xl sm:text-5xl font-fredoka flex items-center justify-center transition-all duration-150 ${
              glowing
                ? "bg-emerald-400 text-emerald-950 shadow-[0_6px_0_#047857] ring-4 ring-amber-300 animate-pulse"
                : wasTried
                  ? "bg-slate-600/40 text-slate-400/60 shadow-none"
                  : "bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-[0_6px_0_#b45309] active:shadow-none active:translate-y-[6px] disabled:opacity-60"
            }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
