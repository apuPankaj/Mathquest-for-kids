// What division does on the counting board.
//
// Everything starts in the BASKET (the pile) and is shared out of it, so the
// child sees the whole amount split up — nothing appears or disappears:
//   1  SHARE FAIRLY: 3 empty plates. Each tap deals one to every plate —
//      "One for each friend… each has 2… each has 3. The basket is empty!"
//   2  MAKE GROUPS: each tap moves 5 from the basket onto a new plate —
//      "1 group of 5… 2 groups…"
//   3  THINK MULTIPLICATION: 4 empty rows; each tap puts one in every row,
//      building the grid of 4 rows of 6 that 24 ÷ 4 undoes
//   4  BREAK IT APART BACKWARDS: take 5 rows of 6 at once ("5 rows of 6 is
//      30, 12 left"), then one gold row at a time ("6 rows… 7 rows. None
//      left!")
// Taps (on the basket, a plate, or the big button) always do the next step,
// so the dealing stays fair. In the pictures stage everything arrives
// already shared out; "Show me" pours it all back into the basket and does
// it again.
//
// Plain logic, no React: `npm run check` runs every demonstration and a
// child's tapping to the end for every question, and checks that nothing is
// ever created, lost or stacked, and that every plate ends up equal.

import { EMPTY_BOARD, makeItems } from "../game/board.ts";
import type { Board, BoardKit, Group, Item, Look, Step } from "../game/board.ts";
import type { DivisionQuestion } from "./questions.ts";

// What is still in the basket, in the order it will be taken (from the end).
function basket(b: Board): Item[] {
  return b.items.filter((it) => it.frame === -1).sort((x, y) => y.slot - x.slot);
}

function countOn(b: Board, frame: number): number {
  return b.items.filter((it) => it.frame === frame).length;
}

// Move these things out of the basket, one to each of these frames, each
// landing in the next free space of its frame.
function moveTo(b: Board, ids: string[], frames: number[], group: Group = "a"): Board {
  const next = new Map<number, number>();
  const dest = new Map<string, { frame: number; slot: number }>();
  ids.forEach((id, i) => {
    const f = frames[i];
    const s = next.get(f) ?? countOn(b, f);
    next.set(f, s + 1);
    dest.set(id, { frame: f, slot: s });
  });
  const items = b.items.map((it) => {
    const d = dest.get(it.id);
    return d ? { ...it, ...d, group } : it;
  });
  // A "live" step: mark it, so numbers can show (see labelFor).
  return { ...b, items, counted: [...b.counted, `step${b.counted.length + 1}`], caption: null };
}

// ---------------------------------------------------------------------------
// The four ways of sharing out
// ---------------------------------------------------------------------------

// Levels 1 and 3: one to every plate (or row).
function dealRound(b: Board, q: DivisionQuestion): Step | null {
  const pile = basket(b);
  if (pile.length < b.frames || b.frames === 0) return null;
  const targets = Array.from({ length: b.frames }, (_, f) => f);
  const board = moveTo(b, pile.slice(0, b.frames).map((it) => it.id), targets);
  const each = countOn(board, 0);
  const empty = basket(board).length === 0;
  const rows = q.level === 3;
  let say: string;
  if (each === 1) say = rows ? "One in each row." : "One for each friend.";
  else say = rows ? `Each row has ${each}.` : `Each has ${each}.`;
  if (empty) say += " The basket is empty!";
  return { board, say, pause: 1100 };
}

// Level 2: a new plate with b on it.
function makeGroup(b: Board, q: DivisionQuestion): Step | null {
  const pile = basket(b);
  if (pile.length < q.b) return null;
  const frame = b.frames;
  const board = moveTo({ ...b, frames: frame + 1 }, pile.slice(0, q.b).map((it) => it.id), Array(q.b).fill(frame));
  const n = board.frames;
  let say = n === 1 ? `1 group of ${q.b}.` : `${n} groups.`;
  if (basket(board).length === 0) say += " The basket is empty!";
  return { board, say, pause: 1100 };
}

// Level 4, first step: 5 rows of b at once.
function takeFive(b: Board, q: DivisionQuestion): Step | null {
  const pile = basket(b);
  if (b.frames !== 0 || pile.length < 5 * q.b) return null;
  const ids = pile.slice(0, 5 * q.b).map((it) => it.id);
  const frames = ids.map((_, i) => Math.floor(i / q.b));
  const board = { ...moveTo({ ...b, frames: 5 }, ids, frames), splitAfter: 5 };
  const left = q.a - 5 * q.b;
  return { board, say: `5 rows of ${q.b} is ${5 * q.b}. ${left} left.`, pause: 1800 };
}

// Level 4, after that: one more (gold) row of b.
function takeRow(b: Board, q: DivisionQuestion): Step | null {
  const pile = basket(b);
  if (b.frames < 5 || pile.length < q.b) return null;
  const frame = b.frames;
  const board = moveTo({ ...b, frames: frame + 1 }, pile.slice(0, q.b).map((it) => it.id), Array(q.b).fill(frame), "b");
  const left = basket(board).length;
  return { board, say: left === 0 ? `${board.frames} rows. None left!` : `${board.frames} rows. ${left} left.`, pause: 1200 };
}

// The next step for this level, whichever it is.
function nextStep(b: Board, q: DivisionQuestion): Step | null {
  switch (q.level) {
    case 1:
    case 3:
      return dealRound(b, q);
    case 2:
      return makeGroup(b, q);
    case 4:
      return b.frames === 0 ? takeFive(b, q) : takeRow(b, q);
  }
}

// ---------------------------------------------------------------------------
// The board
// ---------------------------------------------------------------------------

function freshBoard(q: DivisionQuestion): Board {
  const layout = q.level === 1 || q.level === 2 ? "groups" : "array";
  const frames = q.level === 1 || q.level === 3 ? q.b : 0; // plates/rows to share into, or none yet
  const cells = q.level === 1 || q.level === 3 ? q.answer : q.b; // only used to choose a size
  return { ...EMPTY_BOARD, layout, pile: true, frames, cells, items: makeItems("a", q.a, -1, 0, "c") };
}

export function initialBoard(q: DivisionQuestion, look: Look): Board {
  let board = freshBoard(q);
  if (look === "dots") {
    // Pictures: already shared out, with no numbers showing.
    for (let s = nextStep(board, q); s; s = nextStep(board, q)) board = s.board;
    board = { ...board, counted: [] };
  }
  return board;
}

export function tapItem(b: Board, q: DivisionQuestion): Step | null {
  return nextStep(b, q);
}

export function instruction(b: Board, q: DivisionQuestion): string {
  if (basket(b).length === 0) return "Now pick your answer.";
  switch (q.level) {
    case 1:
      return "Tap to share them out, one each.";
    case 2:
      return `Tap to make a group of ${q.b}.`;
    case 3:
      return "Tap to put one in each row.";
    case 4:
      return b.frames === 0 ? `Tap to take 5 rows of ${q.b} at once.` : `Tap to take another row of ${q.b}.`;
  }
}

export function action(b: Board, q: DivisionQuestion): string | null {
  if (basket(b).length === 0) return null;
  switch (q.level) {
    case 1:
      return "🤲 Share one each";
    case 2:
      return `🧺 Make a group of ${q.b}`;
    case 3:
      return "🤲 One in each row";
    case 4:
      return b.frames === 0 ? `✋ Take 5 rows of ${q.b}` : `➕ Take a row of ${q.b}`;
  }
}

// Numbers sit on the last thing of each plate or row — only once the child
// (or "Show me") has shared something out, never on the finished pictures,
// where they would give the answer away.
export function labelFor(b: Board, q: DivisionQuestion, item: Item): number | null {
  if (b.counted.length === 0 || item.frame < 0) return null;
  const n = countOn(b, item.frame);
  if (item.slot !== n - 1) return null;
  switch (q.level) {
    case 1:
    case 3:
      return n; // how many each plate or row has
    case 2:
      return item.frame + 1; // which group this is
    case 4:
      return item.frame >= 4 ? item.frame + 1 : null; // rows counted from the 5th
  }
}

function finale(b: Board, q: DivisionQuestion): Step {
  const text =
    q.level === 1
      ? `${q.a} shared by ${q.b} is ${q.answer} each.`
      : q.level === 2
        ? `${q.a} makes ${q.answer} groups of ${q.b}.`
        : q.level === 3
          ? `${q.b} rows of ${q.answer} make ${q.a}, so ${q.a} divided by ${q.b} is ${q.answer}.`
          : `${q.answer} rows of ${q.b} make ${q.a}, so ${q.a} divided by ${q.b} is ${q.answer}.`;
  return { board: { ...b, caption: text, finished: true }, say: text, pause: 2000 };
}

// "Show me": pour everything back into the basket, share it out again step
// by step, then say the whole fact.
export function demoStep(b: Board, q: DivisionQuestion): Step | null {
  if (b.finished) return null;
  if (!b.replayed) {
    return { board: { ...freshBoard(q), replayed: true }, say: `Start with ${q.a} in the basket.`, pause: 1400 };
  }
  return nextStep(b, q) ?? finale(b, q);
}

// ---------------------------------------------------------------------------

export const divisionBoard: BoardKit<DivisionQuestion> = {
  initialBoard,
  instruction,
  action,
  runAction: (b, q) => nextStep(b, q),
  tapItem,
  canFill: () => false,
  tapEmpty: () => null,
  labelFor,
  demoStep,
};
