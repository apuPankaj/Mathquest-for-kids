// What is on the counting board, and what each tap does to it.
//
// The board is one or two TEN-FRAMES: boxes of 10 spaces in two rows of five
// (level 1 uses a single row of five). Children learn to see "7" as "3 short
// of a full ten" at a glance — the idea every later level, and carrying,
// is built on.
//
// Each level acts on the board in its own way, matching what it teaches:
//   1  tap the two groups to put them together, then tap each one to count
//   2  put them together, then START AT the bigger number and count on
//   3  tap the empty spaces to fill the ten — how many more make 10?
//   4  move things from the smaller group into the bigger one until it is a
//      full ten, and see "10 and 3 more"
//
// Everything here is plain logic with no React, so `npm run check:addition`
// can run every "Show me" demonstration to the end and confirm it lands on
// the right answer. The board's shape is shared (lib/game/board.ts); the
// screen is components/game/CountingBoard.tsx.

import { EMPTY_BOARD, isFull, makeItems } from "../game/board.ts";
import type { Board, BoardKit, Item, Look, Step } from "../game/board.ts";
import type { AdditionQuestion } from "./questions.ts";

// Which group is bigger. Ties count as `a`.
export function bigGroup(q: AdditionQuestion): "a" | "b" {
  return q.a >= q.b ? "a" : "b";
}

// Both groups in one frame, the bigger one first so counting on reads left to right.
function joinedItems(q: AdditionQuestion): Item[] {
  const big = bigGroup(q);
  const small = big === "a" ? "b" : "a";
  const bigCount = big === "a" ? q.a : q.b;
  const smallCount = big === "a" ? q.b : q.a;
  return [...makeItems(big, bigCount, 0), ...makeItems(small, smallCount, 0, bigCount)];
}

export function initialBoard(q: AdditionQuestion, look: Look): Board {
  const base = { ...EMPTY_BOARD, plus: true };

  if (q.kind === "missing") {
    return { ...base, cells: 10, frames: 1, joined: true, items: makeItems("a", q.a, 0) };
  }
  if (q.level === 4) {
    return { ...base, cells: 10, frames: 2, joined: false, items: [...makeItems("a", q.a, 0), ...makeItems("b", q.b, 1)] };
  }
  const cells = q.level === 1 ? 5 : 10;
  // With real objects the child puts the groups together themselves. In the
  // pictures stage they arrive already together, as coloured dots.
  if (look === "dots") {
    return { ...base, cells, frames: 1, joined: true, items: joinedItems(q) };
  }
  return { ...base, cells, frames: 2, joined: false, items: [...makeItems("a", q.a, 0), ...makeItems("b", q.b, 1)] };
}

// The instruction under the frames when the child can act on the board.
export function instruction(b: Board, q: AdditionQuestion): string {
  if (q.kind === "missing") return isFull(b, 0) ? "Full! Now pick your answer." : "Tap the empty spaces to fill the ten.";
  if (q.level === 4) {
    return isFull(b, targetFrame(q)) ? "A full ten! Now pick your answer." : "Tap to move them into the other ten.";
  }
  if (!b.joined) return "Tap to put them together.";
  if (b.pre.length > 0) return `Start at ${b.startAt}. Tap the others to count on.`;
  return b.counted.length === b.items.length ? "Now pick your answer." : "Tap each one to count.";
}

// ---------------------------------------------------------------------------
// Levels 1 and 2 — together, then count
// ---------------------------------------------------------------------------

export function canJoin(b: Board, q: AdditionQuestion): boolean {
  return q.kind === "sum" && q.level <= 2 && !b.joined;
}

export function join(b: Board, q: AdditionQuestion): Step {
  const board: Board = { ...b, frames: 1, joined: true, items: joinedItems(q), counted: [] };
  if (q.level === 2) {
    return { ...startCountingOn(board, q), pause: 1200 };
  }
  return { board, say: "Now count them all!", pause: 1000 };
}

function startCountingOn(b: Board, q: AdditionQuestion): Step {
  const big = bigGroup(q);
  const startAt = big === "a" ? q.a : q.b;
  const pre = b.items.filter((it) => it.group === big).map((it) => it.id);
  return {
    board: { ...b, pre, startAt, counted: b.counted.filter((id) => !pre.includes(id)) },
    say: `Start at ${startAt}. Now count on!`,
    pause: 1200,
  };
}

function countItem(b: Board, id: string): Step {
  if (b.pre.includes(id)) return { board: b, say: String(b.startAt) };
  const already = b.counted.indexOf(id);
  if (already >= 0) return { board: b, say: String(b.startAt + already + 1) };
  const counted = [...b.counted, id];
  return { board: { ...b, counted }, say: String(b.startAt + counted.length) };
}

// ---------------------------------------------------------------------------
// Level 3 — fill the ten
// ---------------------------------------------------------------------------

export function tapEmpty(b: Board, q: AdditionQuestion): Step | null {
  if (q.kind !== "missing" || isFull(b, 0)) return null;
  const addedCount = b.items.filter((it) => it.group === "added").length;
  const item: Item = { id: `added${addedCount}`, group: "added", frame: 0, slot: q.a + addedCount };
  const board = { ...b, items: [...b.items, item] };
  if (isFull(board, 0)) return { board, say: `${addedCount + 1}. Full!` };
  return { board, say: String(addedCount + 1) };
}

// ---------------------------------------------------------------------------
// Level 4 — make a ten
// ---------------------------------------------------------------------------

function targetFrame(q: AdditionQuestion): number {
  return bigGroup(q) === "a" ? 0 : 1;
}

function moveIntoTen(b: Board, q: AdditionQuestion, id: string): Step | null {
  const to = targetFrame(q);
  const from = 1 - to;
  const item = b.items.find((it) => it.id === id);
  if (!item || item.frame !== from || isFull(b, to)) return null;

  const filled = b.items.filter((it) => it.frame === to).length;
  let n = 0;
  const items = b.items.map((it) => {
    if (it.id === id) return { ...it, frame: to, slot: filled };
    if (it.frame === from) return { ...it, slot: n++ }; // close the gap it left
    return it;
  });
  const board = { ...b, items };
  if (isFull(board, to)) {
    const left = items.filter((it) => it.frame === from).length;
    return { board: { ...board, caption: `10 and ${left} more` }, say: `10! A full ten, and ${left} more.`, pause: 1400 };
  }
  return { board, say: String(filled + 1) };
}

// ---------------------------------------------------------------------------
// Taps
// ---------------------------------------------------------------------------

// The child tapped a thing on the board.
export function tapItem(b: Board, q: AdditionQuestion, id: string): Step | null {
  if (q.kind === "missing") return null;
  if (q.level === 4) return moveIntoTen(b, q, id);
  if (!b.joined) return join(b, q); // tapping either group puts them together
  return countItem(b, id);
}

// The number shown on a thing, if any.
export function labelFor(b: Board, q: AdditionQuestion, item: Item): number | null {
  if (q.kind === "missing") return item.group === "added" ? item.slot - q.a + 1 : null;
  if (q.level === 4) return item.frame === targetFrame(q) && item.group !== bigGroup(q) ? item.slot + 1 : null;
  const i = b.counted.indexOf(item.id);
  if (i >= 0) return b.startAt + i + 1;
  if (b.pre.length > 0 && item.id === b.pre[b.pre.length - 1]) return b.startAt;
  return null;
}

// ---------------------------------------------------------------------------
// "Show me" — the same actions, done automatically, one step at a time
// ---------------------------------------------------------------------------

function finale(b: Board, q: AdditionQuestion): Step {
  const text =
    q.kind === "missing"
      ? `${q.a} and ${q.b} make 10.`
      : q.level === 4
        ? `10 and ${q.total - 10} make ${q.total}.`
        : `${q.a} and ${q.b} make ${q.total}.`;
  return { board: { ...b, caption: text, finished: true }, say: text, pause: 1800 };
}

// The next step of the demonstration, or null when it is over. It carries on
// from wherever the child got to, rather than starting again.
export function demoStep(b: Board, q: AdditionQuestion): Step | null {
  if (b.finished) return null;

  if (q.kind === "missing") {
    return tapEmpty(b, q) ?? finale(b, q);
  }

  if (q.level === 4) {
    const from = 1 - targetFrame(q);
    const next = b.items.filter((it) => it.frame === from).at(-1);
    const moved = next ? moveIntoTen(b, q, next.id) : null;
    return moved ?? finale(b, q);
  }

  if (!b.joined) return join(b, q);
  if (q.level === 2 && b.pre.length === 0) return startCountingOn(b, q);
  const next = b.items.find((it) => !b.pre.includes(it.id) && !b.counted.includes(it.id));
  return next ? countItem(b, next.id) : finale(b, q);
}

// ---------------------------------------------------------------------------
// The whole kit, as the shared screen uses it
// ---------------------------------------------------------------------------

export const additionBoard: BoardKit<AdditionQuestion> = {
  initialBoard,
  instruction,
  action: (b, q) => (canJoin(b, q) ? "👐 Put them together" : null),
  runAction: (b, q) => (canJoin(b, q) ? join(b, q) : null),
  tapItem,
  canFill: (b, q) => q.kind === "missing" && !isFull(b, 0),
  tapEmpty,
  labelFor,
  demoStep,
};
