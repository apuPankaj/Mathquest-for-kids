// The shape of the counting board, shared by every operation.
//
// A board is drawn in one of three layouts:
//   tenframes — boxes of 10 spaces in two rows of five (or one row of five);
//               addition and subtraction
//   groups    — separate plates, each holding the same number of things;
//               multiplication as "equal groups"
//   array     — one grid of rows and columns; multiplication as rows
// In every layout a "frame" is one box, plate or row, and `cells` is how many
// spaces it has. Each operation decides what a tap DOES (lib/*/board.ts); the
// screen that draws it is components/game/CountingBoard.tsx.

import type { Question } from "./core.ts";

export type Look = "objects" | "dots";
export type Layout = "tenframes" | "groups" | "array";
export type Group = "a" | "b" | "added";

export interface Item {
  id: string;
  group: Group; // which number it came from — decides its colour
  frame: number; // which frame (ten-frame, plate or row) it sits in
  slot: number; // which space in that frame
}

export interface Board {
  layout: Layout;
  cells: number; // spaces per frame
  frames: number; // how many frames are drawn
  splitAfter: number | null; // array: draw a gap after this many rows ("break it apart")
  items: Item[];
  plus: boolean; // draw a "+" between two frames (two numbers being added)
  joined: boolean; // addition 1-2: the two groups have been put together
  pre: string[]; // addition 2: things already counted before tapping ("start at 7")
  startAt: number; // addition 2: the number we start at (0 means count from 1)
  counted: string[]; // things counted so far, in order
  taken: string[]; // subtraction: things taken away, in order — drawn as faint outlines
  replayed: boolean; // subtraction: "Show me" has put everything back to start again
  caption: string | null; // a short line shown above the frames
  finished: boolean; // a demonstration has said its last line
}

export const EMPTY_BOARD: Omit<Board, "cells" | "frames" | "items"> = {
  layout: "tenframes",
  splitAfter: null,
  plus: false,
  joined: false,
  pre: [],
  startAt: 0,
  counted: [],
  taken: [],
  replayed: false,
  caption: null,
  finished: false,
};

// One change to the board, and what the voice says about it.
export interface Step {
  board: Board;
  say?: string;
  pause?: number; // how long a demonstration waits after this step (ms)
}

// `prefix` keeps ids unique when one group fills two frames (subtraction's
// full ten plus loose ones).
export function makeItems(group: Group, count: number, frame: number, firstSlot = 0, prefix: string = group): Item[] {
  return Array.from({ length: count }, (_, i) => ({ id: `${prefix}${i}`, group, frame, slot: firstSlot + i }));
}

// Things still on the board (not taken away) in one frame.
export function present(b: Board, frame: number): Item[] {
  return b.items.filter((it) => it.frame === frame && !b.taken.includes(it.id));
}

export function isFull(b: Board, frame: number): boolean {
  return present(b, frame).length >= b.cells;
}

// What an operation tells the board to do. Every method gets the board as it
// is now and returns the next one, without changing anything else — which
// is what lets the check script run each demonstration to the end.
export interface BoardKit<Q extends Question = Question> {
  initialBoard(q: Q, look: Look): Board;
  // The line under the frames while the child can act on the board.
  instruction(b: Board, q: Q): string;
  // A big button, e.g. "👐 Put them together", if this board has one now.
  action(b: Board, q: Q): string | null;
  runAction(b: Board, q: Q): Step | null;
  // The child tapped a thing on the board.
  tapItem(b: Board, q: Q, id: string): Step | null;
  // Can empty spaces be tapped to fill them, and what happens when they are.
  canFill(b: Board, q: Q): boolean;
  tapEmpty(b: Board, q: Q): Step | null;
  // The number shown on a thing, if any.
  labelFor(b: Board, q: Q, item: Item): number | null;
  // The next step of "Show me", or null when it is over.
  demoStep(b: Board, q: Q): Step | null;
}
