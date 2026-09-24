// What subtraction does on the counting board.
//
// Things taken away are not deleted: they stay in their space as faint
// outlines. The child can still see that the whole was 9 — the 3 that went
// and the 6 that stayed — which is the link back to addition.
//
// Each level acts on the board in its own way:
//   1  tap to take them away, then tap what is left to count it
//   2  COUNT BACK: each tap takes one away and the voice says how many are
//      left — "8, 7, 6" — so the child never counts the number they start on
//   3  a full ten; take some away, and see what is left of the ten
//   4  BACK THROUGH TEN: a full ten and some loose ones. Taps always take the
//      loose ones first ("back to 10!"), then the rest from the ten
//
// Taps always take the NEXT thing in order, whichever one is tapped, so the
// frame stays tidy and level 4 cannot be done in the wrong order.
//
// In the pictures stage the dots arrive already crossed out — the drawing a
// teacher makes on the board. "Show me" puts everything back and does it
// again from the start.
//
// Plain logic, no React: `npm run check` runs every demonstration and a
// child's tapping to the end for every question.

import { EMPTY_BOARD, makeItems } from "../game/board.ts";
import type { Board, BoardKit, Item, Look, Step } from "../game/board.ts";
import type { SubtractionQuestion } from "./questions.ts";
import { onesOf } from "./questions.ts";

// Levels 2 and 4 count back: a running count is shown and said.
const countsBack = (q: SubtractionQuestion) => q.level === 2 || q.level === 4;

function startItems(q: SubtractionQuestion): { cells: 5 | 10; frames: number; items: Item[] } {
  if (q.level === 4) {
    // A full ten, and the loose ones in a second frame.
    return { cells: 10, frames: 2, items: [...makeItems("a", 10, 0), ...makeItems("a", onesOf(q), 1, 0, "o")] };
  }
  return { cells: q.level === 1 ? 5 : 10, frames: 1, items: makeItems("a", q.a, 0) };
}

// The order things are taken away: from the end of the frame backwards,
// and at level 4 the loose ones before the ten.
export function removalOrder(b: Board): string[] {
  const back = (frame: number) =>
    b.items.filter((it) => it.frame === frame).sort((x, y) => y.slot - x.slot).map((it) => it.id);
  return b.frames === 2 ? [...back(1), ...back(0)] : back(0);
}

export function initialBoard(q: SubtractionQuestion, look: Look): Board {
  const board: Board = { ...EMPTY_BOARD, ...startItems(q), joined: true };
  if (look === "dots") {
    // Pictures: already crossed out, to look at and think. No running count.
    return { ...board, taken: removalOrder(board).slice(0, q.b) };
  }
  return { ...board, startAt: countsBack(q) ? q.a : 0 };
}

const left = (b: Board, q: SubtractionQuestion) => q.a - b.taken.length;

// Take the next thing away, and say what goes with it.
function takeNext(b: Board, q: SubtractionQuestion): Step | null {
  if (b.taken.length >= q.b) return null;
  const next = removalOrder(b).find((id) => !b.taken.includes(id));
  if (!next) return null;
  const board = { ...b, taken: [...b.taken, next], caption: null }; // clears "Back to 10!" once it has been seen
  const gone = board.taken.length;
  const remaining = left(board, q);
  const done = gone === q.b;

  if (countsBack(q)) {
    if (q.level === 4 && remaining === 10) {
      return { board: { ...board, caption: "Back to 10!" }, say: "10! Back to ten.", pause: 1300 };
    }
    return { board, say: String(remaining) };
  }
  if (q.level === 1 && done) return { board, say: `${q.b} taken away. Now count what is left.`, pause: 1400 };
  if (done) return { board, say: `${q.b} taken away.`, pause: 1200 };
  return { board, say: String(gone) };
}

// Level 1: count what is left, one tap at a time.
function countItem(b: Board, id: string): Step {
  const already = b.counted.indexOf(id);
  if (already >= 0) return { board: b, say: String(already + 1) };
  const counted = [...b.counted, id];
  return { board: { ...b, counted }, say: String(counted.length) };
}

export function tapItem(b: Board, q: SubtractionQuestion, id: string): Step | null {
  if (b.taken.includes(id)) return null;
  if (b.taken.length < q.b) return takeNext(b, q);
  return q.level === 1 ? countItem(b, id) : null;
}

export function instruction(b: Board, q: SubtractionQuestion): string {
  const done = b.taken.length >= q.b;
  switch (q.level) {
    case 1:
      if (!done) return `Tap to take away ${q.b}.`;
      return b.counted.length < q.answer ? "Now count the ones left." : "Now pick your answer.";
    case 2:
      return done ? "Now pick your answer." : `Start at ${q.a}. Tap to take away ${q.b}, counting back.`;
    case 3:
      return done ? "How many are left? Pick your answer." : `Tap to take away ${q.b}.`;
    case 4:
      if (b.taken.length < onesOf(q)) return "Take away the loose ones first, back to 10.";
      return done ? "Now pick your answer." : `Now take away ${q.b - onesOf(q)} more from the ten.`;
  }
}

export function labelFor(b: Board, q: SubtractionQuestion, item: Item): number | null {
  const taken = b.taken.indexOf(item.id);
  // Level 3 numbers the things taken away: 1, 2, 3.
  if (q.level === 3) return taken >= 0 ? taken + 1 : null;
  if (taken >= 0) return null;
  // Level 1 numbers what is left as the child counts it.
  if (q.level === 1) {
    const i = b.counted.indexOf(item.id);
    return i >= 0 ? i + 1 : null;
  }
  // Counting back: the running count sits on the next thing to go.
  if (b.startAt === 0) return null;
  const next = removalOrder(b).find((id) => !b.taken.includes(id));
  return item.id === next ? left(b, q) : null;
}

function finale(b: Board, q: SubtractionQuestion): Step {
  const text =
    q.level === 3
      ? `10 take away ${q.b} leaves ${q.answer}, because ${q.answer} and ${q.b} make 10.`
      : q.level === 4
        ? `${q.a} take away ${onesOf(q)} is 10. Take away ${q.b - onesOf(q)} more: ${q.answer}.`
        : `${q.a} take away ${q.b} leaves ${q.answer}.`;
  return { board: { ...b, caption: text, finished: true }, say: text, pause: 1800 };
}

// "Show me": put everything back, take them away one at a time (counting
// back where that is the skill), count what is left at level 1, then say
// the whole fact.
export function demoStep(b: Board, q: SubtractionQuestion): Step | null {
  if (b.finished) return null;
  if (!b.replayed) {
    return {
      board: { ...b, taken: [], counted: [], caption: null, replayed: true, startAt: countsBack(q) ? q.a : 0 },
      say: `Start with ${q.a}.`,
      pause: 1200,
    };
  }
  const took = takeNext(b, q);
  if (took) return took;
  if (q.level === 1 && b.counted.length < q.answer) {
    const next = b.items
      .filter((it) => !b.taken.includes(it.id) && !b.counted.includes(it.id))
      .sort((x, y) => x.slot - y.slot)[0];
    if (next) return countItem(b, next.id);
  }
  return finale(b, q);
}

// ---------------------------------------------------------------------------

export const subtractionBoard: BoardKit<SubtractionQuestion> = {
  initialBoard,
  instruction,
  action: () => null,
  runAction: () => null,
  tapItem,
  canFill: () => false,
  tapEmpty: () => null,
  labelFor,
  demoStep,
};
