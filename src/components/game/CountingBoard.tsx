import React, { useEffect, useRef, useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import type { Question } from "@/lib/game/core";
import { Board, BoardKit, Item, Look, Step, present } from "@/lib/game/board";

// The counting board the child taps: ten-frames (adding, taking away), plates
// of equal groups, or a grid of rows (multiplying). What each tap DOES is
// decided by the operation's board kit (lib/*/board.ts); this file only draws
// the board and passes the taps on.

interface CountingBoardProps {
  question: Question;
  kit: BoardKit;
  look: Look; // real things (emoji), or plain coloured dots
  interactive: boolean; // can the child act on it? (objects stage)
  demo: boolean; // play the "Show me" demonstration
  onDemoDone?: () => void;
  say: (text: string) => void;
}

// One colour per number, matching the sum above the board.
const GROUP_STYLE = {
  a: { dot: "bg-emerald-400", ring: "ring-emerald-400/70" },
  b: { dot: "bg-amber-400", ring: "ring-amber-400/70" },
  added: { dot: "bg-sky-400", ring: "ring-sky-400/70" },
} as const;

// Three sizes of space. Ten-frames hold at most 20 things, so they get the
// big ones; plates and grids can hold up to 81, so they shrink to fit a phone.
const SIZES = {
  lg: { cell: "w-12 h-12 sm:w-14 sm:h-14 rounded-xl", emoji: "text-3xl sm:text-4xl", dot: "w-8 h-8 sm:w-9 sm:h-9", badge: "min-w-6 h-6 text-sm -bottom-1 -right-1" },
  md: { cell: "w-10 h-10 sm:w-11 sm:h-11 rounded-lg", emoji: "text-2xl sm:text-3xl", dot: "w-6 h-6 sm:w-7 sm:h-7", badge: "min-w-6 h-6 text-sm -bottom-1.5 -right-1.5" },
  sm: { cell: "w-7 h-7 sm:w-8 sm:h-8 rounded-md", emoji: "text-lg sm:text-xl", dot: "w-5 h-5", badge: "min-w-6 h-6 text-xs -bottom-2 -right-2" },
} as const;

function sizeFor(b: Board): keyof typeof SIZES {
  if (b.layout === "tenframes") return "lg";
  if (b.layout === "groups") return b.cells > 5 ? "sm" : "md";
  return b.cells > 6 || b.frames > 6 ? "sm" : "md";
}

export default function CountingBoard({ question: q, kit, look, interactive, demo, onDemoDone, say }: CountingBoardProps) {
  const [board, setBoard] = useState<Board>(() => kit.initialBoard(q, look));

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
      const step = kit.demoStep(boardRef.current, q);
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
  }, [demo, q, kit]);

  const canAct = interactive && !demo;
  const actionLabel = canAct ? kit.action(board, q) : null;
  const fillable = canAct && kit.canFill(board, q);
  const size = SIZES[sizeFor(board)];

  const renderItem = (item: Item) => {
    const label = kit.labelFor(board, q, item);
    const taken = board.taken.includes(item.id);
    const faded = board.pre.includes(item.id) && label === null;
    const style = GROUP_STYLE[item.group];
    return (
      <motion.button
        type="button"
        key={item.id}
        layoutId={`${q.key}-${item.id}`}
        initial={item.group === "added" || board.layout === "groups" ? { scale: 0 } : false}
        animate={{ scale: taken ? 0.85 : 1, opacity: taken ? 0.35 : faded ? 0.55 : 1, y: taken ? [0, -16, 0] : 0 }}
        // A spring can only move between two positions, so the three-position
        // "fly up and settle" hop of a taken-away thing uses a timed movement.
        // (A spring there throws, and the error freezes the stage banner.)
        transition={{ type: "spring", stiffness: 420, damping: 30, y: { duration: 0.45, ease: "easeOut" } }}
        onClick={() => canAct && !taken && apply(kit.tapItem(boardRef.current, q, item.id))}
        disabled={!canAct || taken}
        aria-label={taken ? "taken away" : label !== null ? String(label) : q.thing.one}
        className={`relative w-full h-full flex items-center justify-center rounded-xl ${
          canAct && !taken ? "cursor-pointer active:scale-90" : "cursor-default"
        }`}
      >
        {look === "objects" ? (
          <span
            className={`${size.emoji} leading-none rounded-full ring-2 bg-white/10 p-0.5 select-none ${
              taken ? "ring-0 outline-2 outline-dashed outline-rose-300/70 grayscale" : style.ring
            }`}
          >
            {q.thing.emoji}
          </span>
        ) : taken ? (
          <span className={`block ${size.dot} rounded-full border-2 border-dashed border-rose-300`} />
        ) : (
          <span className={`block ${size.dot} rounded-full ${style.dot} shadow-inner`} />
        )}
        {label !== null && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute z-10 ${size.badge} px-1 rounded-full font-black flex items-center justify-center shadow ${
              taken ? "bg-rose-200 text-rose-900" : "bg-white text-emerald-950"
            }`}
          >
            {label}
          </motion.span>
        )}
      </motion.button>
    );
  };

  // The spaces of one frame (a ten-frame, a plate or a row).
  const renderCells = (frame: number, cellClass: string) => {
    const bySlot = new Map(board.items.filter((it) => it.frame === frame).map((it) => [it.slot, it]));
    return Array.from({ length: board.cells }, (_, slot) => {
      const item = bySlot.get(slot);
      return (
        <div key={slot} className={`${size.cell} ${cellClass}`}>
          {item ? (
            renderItem(item)
          ) : fillable ? (
            <button
              type="button"
              onClick={() => apply(kit.tapEmpty(boardRef.current, q))}
              aria-label="Fill this space"
              className="w-full h-full rounded-[inherit] border-2 border-dashed border-sky-300/70 animate-pulse cursor-pointer"
            />
          ) : null}
        </div>
      );
    });
  };

  const renderTenFrame = (frame: number) => {
    const full = present(board, frame).length === 10;
    return (
      <div
        key={frame}
        className={`grid grid-cols-5 gap-1.5 p-2 rounded-2xl bg-emerald-950/50 border-2 ${full ? "border-amber-300" : "border-emerald-700/60"}`}
      >
        {renderCells(frame, "bg-emerald-900/60 border border-emerald-800/60")}
      </div>
    );
  };

  // A plate: its things in rows of up to five, so a group of 10 looks like a
  // small ten-frame.
  const renderPlate = (frame: number) => (
    <div
      key={frame}
      data-part="plate"
      className="grid gap-1 p-2 rounded-[1.25rem] bg-amber-100/10 border-2 border-amber-300/40"
      style={{ gridTemplateColumns: `repeat(${Math.min(board.cells, 5)}, minmax(0, 1fr))` }}
    >
      {renderCells(frame, "bg-emerald-900/40")}
    </div>
  );

  // A grid: one frame per row. A dashed line marks where it has been broken apart.
  const renderArray = () => (
    <div className="flex flex-col gap-1 p-2 rounded-2xl bg-emerald-950/50 border-2 border-emerald-700/60">
      {Array.from({ length: board.frames }, (_, f) => (
        <React.Fragment key={f}>
          {board.splitAfter !== null && f === board.splitAfter && (
            <div className="my-1 border-t-2 border-dashed border-amber-300/80" aria-hidden />
          )}
          <div data-part="row" className="flex gap-1">
            {renderCells(f, "bg-emerald-900/40")}
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <LayoutGroup id={q.key}>
      <div data-part="board" className="flex flex-col items-center gap-3">
        <div className="min-h-7 text-center text-lg font-bold text-amber-100">
          {board.caption ?? (canAct ? kit.instruction(board, q) : "")}
        </div>

        {board.layout === "array" ? (
          renderArray()
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {Array.from({ length: board.frames }, (_, f) => (
              <React.Fragment key={f}>
                {f > 0 && board.plus && <span className="text-4xl font-black text-amber-300 font-fredoka">+</span>}
                {board.layout === "groups" ? renderPlate(f) : renderTenFrame(f)}
              </React.Fragment>
            ))}
          </div>
        )}

        {actionLabel && (
          <button
            type="button"
            onClick={() => apply(kit.runAction(boardRef.current, q))}
            className="mt-1 px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xl shadow-[0_5px_0_#0369a1] active:shadow-none active:translate-y-[5px] transition-all animate-pulse"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </LayoutGroup>
  );
}
