import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AdditionQuestion, LEVELS, Stage, correctText, makeQuestion } from "@/lib/addition/questions";
import { PlaceProgress, STAGES, STREAK_TO_MOVE_UP, applyOutcome, starsFor } from "@/lib/addition/mastery";
import type { AdditionPlace } from "@/lib/addition/places";
import { playSuccessSound } from "@/utils/audio";
import TenFrameBoard from "./TenFrameBoard";
import AnswerChoices from "./AnswerChoices";
import NumberPad from "./NumberPad";

// One addition place: a question at a time, at the child's current stage.
//   objects  — real things on the board, which the child taps to count
//   pictures — coloured dots on the board, to look at and think
//   numbers  — just the sum, typed on a number pad
// The rules for moving between stages are in lib/addition/mastery.ts.

interface AdditionQuestProps {
  place: AdditionPlace;
  progress: PlaceProgress;
  onProgress: (next: PlaceProgress) => void;
  onStars: (stars: number) => void;
  onExit: () => void;
  soundOn: boolean;
}

// A question together with the stage it was asked at. The stage is fixed
// when the question is made, so moving up a stage never redraws the question
// the child has just answered.
interface Current {
  q: AdditionQuestion;
  stage: Stage;
  serial: number; // makes the board start fresh even if a question repeats later
}

const STAGE_LABEL: Record<Stage, { icon: string; name: string }> = {
  objects: { icon: "🥭", name: "Things" },
  pictures: { icon: "🟢", name: "Dots" },
  numbers: { icon: "🔢", name: "Numbers" },
};

const MOVED_UP: Record<Stage, string> = {
  objects: "",
  pictures: "Brilliant! Now try it with dots.",
  numbers: "Amazing! Now just the numbers.",
};

export default function AdditionQuest({ place, progress, onProgress, onStars, onExit, soundOn }: AdditionQuestProps) {
  const [current, setCurrent] = useState<Current>(() => ({
    q: makeQuestion(place.level),
    stage: progress.stage,
    serial: 0,
  }));
  const [tried, setTried] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [earned, setEarned] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const recent = useRef<string[]>([current.q.key]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  const { q, stage } = current;

  const nextQuestion = (nextStage: Stage) => {
    const nq = makeQuestion(place.level, Math.random, recent.current.slice(-3));
    recent.current.push(nq.key);
    setCurrent((c) => ({ q: nq, stage: nextStage, serial: c.serial + 1 }));
    setTried([]);
    setSolved(false);
    setEarned(0);
    setMessage(null);
  };

  const answer = (n: number) => {
    if (solved) return;

    if (n !== q.answer) {
      setTried((t) => [...t, n]);
      setMessage("Not quite. Try again!");
      return;
    }

    const outcome = tried.length === 0 ? "firstTry" : "afterHint";
    const { next, event } = applyOutcome(progress, outcome);
    onProgress(next);
    onStars(starsFor(outcome));
    setEarned(starsFor(outcome));
    setSolved(true);
    setMessage(correctText(q));
    if (soundOn) playSuccessSound();

    if (event === "mastered") {
      later(() => setCelebrate(true), 1200);
      return;
    }
    if (event === "movedUp") {
      later(() => setBanner(MOVED_UP[next.stage]), 1200);
      later(() => setBanner(null), 3800);
    }
    later(() => nextQuestion(next.stage), event === "movedUp" ? 3800 : 1900);
  };

  const stageIndex = STAGES.indexOf(stage);

  return (
    <div className="w-full lg:col-span-4 rounded-3xl border-4 border-amber-500/30 bg-[#064e3b] shadow-2xl p-4 sm:p-6 relative min-h-[560px] text-amber-50 overflow-hidden">
      {/* Top bar: back to the map, where we are, which stage */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <button
          type="button"
          onClick={onExit}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all"
        >
          🏠 Map
        </button>
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-black text-amber-200">{place.title}</h2>
          <p className="text-xs text-emerald-300 font-bold">{LEVELS[place.level].skill}</p>
        </div>
        <div className="flex items-center gap-1.5" aria-label={`Stage: ${STAGE_LABEL[stage].name}`}>
          {STAGES.map((s, i) => (
            <span
              key={s}
              title={STAGE_LABEL[s].name}
              className={`px-2 py-1 rounded-lg text-sm font-bold ${
                i === stageIndex ? "bg-amber-400 text-amber-950" : i < stageIndex ? "bg-emerald-600 text-white" : "bg-emerald-950/60 text-emerald-500"
              }`}
            >
              {STAGE_LABEL[s].icon}
            </span>
          ))}
        </div>
      </div>

      {/* Progress through this stage: one dot per right-first-time answer */}
      <div className="flex justify-center gap-2 mb-4" aria-label={`${progress.streak} of ${STREAK_TO_MOVE_UP}`}>
        {Array.from({ length: STREAK_TO_MOVE_UP }, (_, i) => (
          <span key={i} className={`w-3.5 h-3.5 rounded-full border-2 ${i < progress.streak ? "bg-amber-300 border-amber-200" : "bg-transparent border-emerald-500/70"}`} />
        ))}
      </div>

      {/* The sum, coloured to match the board */}
      <div data-part="equation" className="text-center text-6xl sm:text-7xl font-black font-fredoka drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] mb-4 select-none">
        {q.kind === "missing" ? (
          <>
            <span className="text-emerald-300">{q.a}</span> <span className="text-amber-200">+</span>{" "}
            <span className="text-sky-300">{solved ? q.answer : "?"}</span> <span className="text-amber-200">=</span>{" "}
            <span className="text-amber-100">10</span>
          </>
        ) : (
          <>
            <span className="text-emerald-300">{q.a}</span> <span className="text-amber-200">+</span>{" "}
            <span className="text-amber-300">{q.b}</span> <span className="text-amber-200">=</span>{" "}
            <span className="text-amber-100">{solved ? q.answer : "?"}</span>
          </>
        )}
      </div>

      {/* The board — not in the numbers stage */}
      {stage !== "numbers" && (
        <div className="mb-5">
          <TenFrameBoard
            key={`${current.serial}-${stage}`}
            question={q}
            look={stage === "objects" ? "objects" : "dots"}
            interactive={stage === "objects" && !solved}
            demo={false}
            say={() => {}}
          />
        </div>
      )}

      {/* Answers */}
      <div className="flex flex-col items-center gap-4">
        {stage === "numbers" ? (
          <NumberPad key={current.serial} reveal={null} locked={solved} onSubmit={answer} />
        ) : (
          <AnswerChoices choices={q.choices} tried={tried} reveal={solved ? q.answer : null} locked={solved} onPick={answer} />
        )}

        <div className="min-h-8 text-center text-lg font-bold" aria-live="polite">
          {solved ? (
            <span className="text-emerald-300">
              {message} <span className="ml-1">{"⭐".repeat(earned)}</span>
            </span>
          ) : (
            message && <span className="text-amber-200">{message}</span>
          )}
        </div>
      </div>

      {/* "Now try it with dots!" */}
      <AnimatePresence>
        {banner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-4 top-1/3 mx-auto max-w-md bg-amber-300 text-amber-950 text-2xl font-black text-center rounded-3xl p-6 shadow-2xl z-20"
          >
            {banner}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Place mastered */}
      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-emerald-950/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              className="bg-white text-emerald-900 rounded-3xl p-8 text-center max-w-sm shadow-2xl border-4 border-amber-400"
            >
              <div className="text-7xl mb-2">🌳</div>
              <h3 className="text-3xl font-black">You did it!</h3>
              <p className="text-lg font-bold mt-2">
                You mastered {place.title}. A tree grew in Numeria!
              </p>
              <button
                type="button"
                onClick={onExit}
                className="mt-6 px-6 py-3 rounded-2xl bg-emerald-500 text-white font-black text-xl shadow-[0_5px_0_#047857] active:shadow-none active:translate-y-[5px]"
              >
                🗺️ Back to the map
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
