import React, { useEffect, useRef, useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import type { AdditionQuestion } from "@/lib/addition/questions";
import {
  Board, Item, Look, Step, canJoin, demoStep, initialBoard, instruction, join, labelFor, tapEmpty, tapItem,
} from "@/lib/addition/board";

// The counting board: one or two ten-frames the child taps to put groups
// together, count, fill a ten or make a ten. What each tap DOES is decided in
// lib/addition/board.ts; this file only draws it and passes the taps on.

interface TenFrameBoardProps {
  question: AdditionQuestion;
  look: Look; // real things (emoji), or plain coloured dots
  interactive: boolean; // can the child act on it? (objects stage)
  demo: boolean; // play the "Show me" demonstration
  onDemoDone?: () => void;
  say: (text: string) => void;
}

// One colour per number, matching the equation above the board.
const GROUP_STYLE = {
  a: { dot: "bg-emerald-400", ring: "ring-emerald-400/70" },
  b: { dot: "bg-amber-400", ring: "ring-amber-400/70" },
  added: { dot: "bg-sky-400", ring: "ring-sky-400/70" },
} as const;

export default function TenFrameBoard({ question: q, look, interactive, demo, onDemoDone, say }: TenFrameBoardProps) {
  const [board, setBoard] = useState<Board>(() => initialBoard(q, look));

  // The demonstration runs on a timer, so it reads the latest board and
  // callbacks through refs rather than from the render it started in.
  const boardRef = useRef(board);
  const sayRef = useRef(say);
  const doneRef = useRef(onDemoDone);
  useEffect(() => {
    boardRef.current = board;
    sayRef.current = say;
    doneRef.current = onDemoDone;
  });

  const apply = (step: Step | null) => {
    if (!step) return;
    boardRef.current = step.board;
    setBoard(step.board);
    if (step.say) sayRef.current(step.say);
  };

  useEffect(() => {
    if (!demo) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const step = demoStep(boardRef.current, q);
      if (!step) {
        doneRef.current?.();
        return;
      }
      boardRef.current = step.board;
      setBoard(step.board);
      if (step.say) sayRef.current(step.say);
      timer = setTimeout(tick, step.pause ?? 850);
    };
    timer = setTimeout(tick, 1400); // let "Let me show you" finish first
    return () => clearTimeout(timer);
  }, [demo, q]);

  const canAct = interactive && !demo;

  const renderItem = (item: Item) => {
    const label = labelFor(board, q, item);
    const faded = board.pre.includes(item.id) && label === null;
    const style = GROUP_STYLE[item.group];
    return (
      <motion.button
        type="button"
        key={item.id}
        layoutId={`${q.key}-${item.id}`}
        initial={item.group === "added" ? { scale: 0 } : false}
        animate={{ scale: 1, opacity: faded ? 0.55 : 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
        onClick={() => canAct && apply(tapItem(boardRef.current, q, item.id))}
        disabled={!canAct}
        aria-label={label !== null ? String(label) : q.thing.one}
        className={`relative w-full h-full flex items-center justify-center rounded-xl ${
          canAct ? "cursor-pointer active:scale-90" : "cursor-default"
        }`}
      >
        {look === "objects" ? (
          <span className={`text-3xl sm:text-4xl leading-none rounded-full ring-2 ${style.ring} bg-white/10 p-0.5 select-none`}>
            {q.thing.emoji}
          </span>
        ) : (
          <span className={`block w-8 h-8 sm:w-9 sm:h-9 rounded-full ${style.dot} shadow-inner`} />
        )}
        {label !== null && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-1 -right-1 min-w-6 h-6 px-1 rounded-full bg-white text-emerald-950 text-sm font-black flex items-center justify-center shadow"
          >
            {label}
          </motion.span>
        )}
      </motion.button>
    );
  };

  const renderFrame = (frame: number) => {
    const items = board.items.filter((it) => it.frame === frame);
    const bySlot = new Map(items.map((it) => [it.slot, it]));
    const fillable = canAct && q.kind === "missing";
    return (
      <div
        key={frame}
        className={`grid grid-cols-5 gap-1.5 p-2 rounded-2xl bg-emerald-950/50 border-2 ${
          items.length === 10 ? "border-amber-300" : "border-emerald-700/60"
        }`}
      >
        {Array.from({ length: board.cells }, (_, slot) => {
          const item = bySlot.get(slot);
          return (
            <div key={slot} className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-emerald-900/60 border border-emerald-800/60">
              {item ? (
                renderItem(item)
              ) : fillable ? (
                <button
                  type="button"
                  onClick={() => apply(tapEmpty(boardRef.current, q))}
                  aria-label="Fill this space"
                  className="w-full h-full rounded-xl border-2 border-dashed border-sky-300/70 animate-pulse cursor-pointer"
                />
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <LayoutGroup id={q.key}>
      <div data-part="board" className="flex flex-col items-center gap-3">
        <div className="min-h-7 text-center text-lg font-bold text-amber-100">
          {board.caption ?? (canAct ? instruction(board, q) : "")}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {Array.from({ length: board.frames }, (_, f) => (
            <React.Fragment key={f}>
              {f > 0 && <span className="text-4xl font-black text-amber-300 font-fredoka">+</span>}
              {renderFrame(f)}
            </React.Fragment>
          ))}
        </div>

        {canAct && canJoin(board, q) && (
          <button
            type="button"
            onClick={() => apply(join(boardRef.current, q))}
            className="mt-1 px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xl shadow-[0_5px_0_#0369a1] active:shadow-none active:translate-y-[5px] transition-all animate-pulse"
          >
            👐 Put them together
          </button>
        )}
      </div>
    </LayoutGroup>
  );
}
