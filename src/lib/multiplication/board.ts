// What multiplication does on the counting board.
//
//   1  EQUAL GROUPS: empty plates. Tap a plate to put b on it, and the voice
//      adds up: "4… 4 and 4 is 8… 8 and 4 is 12"
//   2  SKIP COUNTING: full plates. Tap each one and the voice counts in
//      steps: "5, 10, 15"
//   3  ARRAYS: a grid of rows. Tap each row to count in steps — or press
//      "Turn it around": the grid spins, 3 rows of 4 become 4 rows of 3,
//      and nothing is added or taken away
//   4  BREAK IT APART: a big grid. Break it after 5 rows, find each part
//      ("5 rows of 6 is 30", "2 more rows of 6 is 12"), then add them
//
// Plates and rows can be tapped in any order; the running total follows
// the order the child taps them. In the pictures stage the plates arrive
// full and the big grid arrives already broken apart, to look at and think.
//
// Plain logic, no React: `npm run check` runs every demonstration and a
// child's tapping to the end for every question.

import { EMPTY_BOARD, makeItems } from "../game/board.ts";
import type { Board, BoardKit, Item, Look, Step } from "../game/board.ts";
import type { MultiplicationQuestion } from "./questions.ts";

const groupId = (frame: number) => `g${frame}`;

// Every thing keeps the id it was born with ("t2-3": row 2, place 3), so
// when the grid turns around each thing is seen moving to its new place.
function fill(frame: number, cells: number): Item[] {
  return makeItems("a", cells, frame, 0, `t${frame}-`);
}

function fullGrid(frames: number, cells: number): Item[] {
  return Array.from({ length: frames }, (_, f) => fill(f, cells)).flat();
}

// Level 4: after the break, the rows below it turn gold, like the second
// number in an addition.
function breakApart(b: Board): Board {
  return {
    ...b,
    splitAfter: 5,
    items: b.items.map((it) => ({ ...it, group: it.frame >= 5 ? "b" : "a" })),
  };
}

const rowWord = (n: number) => (n === 1 ? "row" : "rows");

export function initialBoard(q: MultiplicationQuestion, look: Look): Board {
  const base = { ...EMPTY_BOARD, frames: q.a, cells: q.b };
  switch (q.level) {
    case 1:
      // Empty plates to fill — unless it's the pictures stage.
      return { ...base, layout: "groups", items: look === "dots" ? fullGrid(q.a, q.b) : [] };
    case 2:
      return { ...base, layout: "groups", items: fullGrid(q.a, q.b) };
    case 3:
      return { ...base, layout: "array", items: fullGrid(q.a, q.b) };
    case 4: {
      const board: Board = { ...base, layout: "array", items: fullGrid(q.a, q.b) };
      return look === "dots" ? breakApart(board) : board;
    }
  }
}

// ---------------------------------------------------------------------------
// Levels 1-3: count a plate or a row
// ---------------------------------------------------------------------------

function countGroup(b: Board, q: MultiplicationQuestion, frame: number): Step | null {
  if (frame < 0 || frame >= b.frames) return null;
  const done = b.counted.indexOf(groupId(frame));
  if (done >= 0) return { board: b, say: String((done + 1) * b.cells) }; // tapped again: say its total

  const items = b.items.some((it) => it.frame === frame) ? b.items : [...b.items, ...fill(frame, b.cells)];
  const counted = [...b.counted, groupId(frame)];
  const n = counted.length;
  const total = n * b.cells;
  // Level 1 says the adding out loud; levels 2-3 skip-count.
  const say = q.level === 1 && n > 1 ? `${total - b.cells} and ${b.cells} is ${total}.` : String(total);
  return { board: { ...b, items, counted, caption: null }, say, pause: 1000 };
}

function nextUncounted(b: Board): number {
  for (let f = 0; f < b.frames; f++) if (!b.counted.includes(groupId(f))) return f;
  return -1;
}

// ---------------------------------------------------------------------------
// Level 3: turn it around
// ---------------------------------------------------------------------------

export function turnAround(b: Board): Board {
  return {
    ...b,
    frames: b.cells,
    cells: b.frames,
    items: b.items.map((it) => ({ ...it, frame: it.slot, slot: it.frame })),
    counted: [],
  };
}

function turnStep(b: Board): Step {
  const turned = turnAround(b);
  const text = `Turned around: ${turned.frames} ${rowWord(turned.frames)} of ${turned.cells}.`;
  return {
    board: { ...turned, caption: text },
    say: `${text} Nothing was added or taken away!`,
    pause: 2200,
  };
}

// ---------------------------------------------------------------------------
// Level 4: break it apart
// ---------------------------------------------------------------------------

const parts = (q: MultiplicationQuestion) => ({ top: 5 * q.b, bottom: (q.a - 5) * q.b, more: q.a - 5 });

function splitStep(b: Board, q: MultiplicationQuestion): Step {
  const { more } = parts(q);
  const text = `5 rows of ${q.b}, and ${more} more ${rowWord(more)}.`;
  return { board: { ...breakApart(b), caption: text }, say: `Break it apart: ${text}`, pause: 1600 };
}

function countPart(b: Board, q: MultiplicationQuestion, part: "top" | "bottom"): Step | null {
  const { top, bottom, more } = parts(q);
  if (b.counted.includes(part)) return { board: b, say: String(part === "top" ? top : bottom) };
  const counted = [...b.counted, part];
  let say = part === "top" ? `5 rows of ${q.b} is ${top}.` : `${more} more ${rowWord(more)} of ${q.b} is ${bottom}.`;
  if (counted.length === 2) say += ` Now add ${top} and ${bottom}.`;
  return { board: { ...b, counted, caption: null }, say, pause: 1500 };
}

// ---------------------------------------------------------------------------
// Taps
// ---------------------------------------------------------------------------

export function tapItem(b: Board, q: MultiplicationQuestion, id: string): Step | null {
  const item = b.items.find((it) => it.id === id);
  if (!item) return null;
  if (q.level === 4) {
    if (b.splitAfter === null) return splitStep(b, q); // tapping the grid breaks it apart
    return countPart(b, q, item.frame < 5 ? "top" : "bottom");
  }
  return countGroup(b, q, item.frame);
}

// Level 1: tapping an empty plate fills that plate.
export function tapEmpty(b: Board, q: MultiplicationQuestion, frame: number): Step | null {
  if (q.level !== 1 || b.items.some((it) => it.frame === frame)) return null;
  return countGroup(b, q, frame);
}

export function instruction(b: Board, q: MultiplicationQuestion): string {
  const allCounted = b.counted.length >= b.frames;
  switch (q.level) {
    case 1:
      return allCounted ? "Now pick your answer." : `Tap each plate to put ${q.b} on it.`;
    case 2:
      return allCounted ? "Now pick your answer." : `Tap each group to count in ${q.b}s.`;
    case 3:
      return allCounted ? "Now pick your answer." : `Tap each row to count in ${b.cells}s. Or turn it around!`;
    case 4: {
      const { top, bottom } = parts(q);
      if (b.splitAfter === null) return "Tap to break it apart: 5 rows, and the rest.";
      if (b.counted.length < 2) return "Tap the top part, then the bottom part.";
      return `Now add ${top} and ${bottom}.`;
    }
  }
}

// The running total sits on the last thing of each plate or row counted;
// at level 4, each part's value on the last thing of that part.
export function labelFor(b: Board, q: MultiplicationQuestion, item: Item): number | null {
  if (item.slot !== b.cells - 1) return null;
  if (q.level === 4) {
    const { top, bottom } = parts(q);
    if (item.frame === 4 && b.counted.includes("top")) return top;
    if (item.frame === b.frames - 1 && b.counted.includes("bottom")) return bottom;
    return null;
  }
  const i = b.counted.indexOf(groupId(item.frame));
  return i >= 0 ? (i + 1) * b.cells : null;
}

export function action(b: Board, q: MultiplicationQuestion): string | null {
  if (q.level === 3) return "🔄 Turn it around";
  if (q.level === 4 && b.splitAfter === null) return "✂️ Break it apart";
  return null;
}

export function runAction(b: Board, q: MultiplicationQuestion): Step | null {
  if (q.level === 3) return turnStep(b);
  if (q.level === 4 && b.splitAfter === null) return splitStep(b, q);
  return null;
}

// ---------------------------------------------------------------------------
// "Show me"
// ---------------------------------------------------------------------------

function finale(b: Board, q: MultiplicationQuestion): Step {
  if (q.level === 4) {
    const { top, bottom } = parts(q);
    const text = `${top} and ${bottom} make ${q.answer}.`;
    return { board: { ...b, caption: text, finished: true }, say: text, pause: 1800 };
  }
  if (q.level === 3) {
    // Say the fact the way the grid is now, then turn it and say it again.
    const text = `${b.frames} rows of ${b.cells} make ${q.answer}.`;
    if (b.frames === b.cells) return { board: { ...b, caption: text, finished: true }, say: text, pause: 1800 };
    const turned = turnAround(b);
    const more = `Turned around, ${turned.frames} rows of ${turned.cells} make ${q.answer} too!`;
    return { board: { ...turned, caption: more, finished: true }, say: `${text} ${more}`, pause: 2600 };
  }
  const text = `${q.a} groups of ${q.b} make ${q.answer}.`;
  return { board: { ...b, caption: text, finished: true }, say: text, pause: 1800 };
}

export function demoStep(b: Board, q: MultiplicationQuestion): Step | null {
  if (b.finished) return null;
  if (q.level === 4) {
    if (b.splitAfter === null) return splitStep(b, q);
    if (!b.counted.includes("top")) return countPart(b, q, "top");
    if (!b.counted.includes("bottom")) return countPart(b, q, "bottom");
    return finale(b, q);
  }
  const next = nextUncounted(b);
  return next >= 0 ? countGroup(b, q, next) : finale(b, q);
}

// ---------------------------------------------------------------------------

export const multiplicationBoard: BoardKit<MultiplicationQuestion> = {
  initialBoard,
  instruction,
  action,
  runAction,
  tapItem,
  canFill: (b, q) => q.level === 1 && b.counted.length < b.frames,
  tapEmpty,
  labelFor,
  demoStep,
};
