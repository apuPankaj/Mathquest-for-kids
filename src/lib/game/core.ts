// The pieces every operation shares: the levels and stages, the everyday
// things children count, and what a question looks like to the screen.
//
// The pure logic files (this folder, lib/addition, lib/subtraction) import
// each other with a ".ts" ending, e.g. "./core.ts". That lets the check
// script load them straight into Node, with no build step, to test every
// rule. Screens import them the usual way ("@/lib/...").

export type Level = 1 | 2 | 3 | 4;
export type Stage = "objects" | "pictures" | "numbers";

// A random-number source. The game uses Math.random; the check script passes
// a seeded one so a failure can be reproduced exactly.
export type Rng = () => number;

export function pick<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

// The everyday things a child counts. `one` and `many` let the voice say
// "1 mango" but "3 mangoes".
export interface Thing {
  emoji: string;
  one: string;
  many: string;
}

export const THINGS: Thing[] = [
  { emoji: "🥭", one: "mango", many: "mangoes" },
  { emoji: "🍎", one: "apple", many: "apples" },
  { emoji: "🍌", one: "banana", many: "bananas" },
  { emoji: "🦆", one: "duck", many: "ducks" },
  { emoji: "🐟", one: "fish", many: "fish" },
  { emoji: "🐥", one: "chick", many: "chicks" },
  { emoji: "🌼", one: "flower", many: "flowers" },
  { emoji: "🐞", one: "ladybird", many: "ladybirds" },
  { emoji: "🎈", one: "balloon", many: "balloons" },
];

// "1 mango", "3 mangoes"
export function things(n: number, thing: Thing): string {
  return `${n} ${n === 1 ? thing.one : thing.many}`;
}

export const PRAISE = ["Yes!", "Well done!", "Brilliant!", "You got it!", "Super!"];

// What every question has, whatever the operation.
export interface Question {
  key: string; // e.g. "2:6+3" — so the same question doesn't come twice in a row
  level: Level;
  a: number; // the first number
  b: number; // the second number
  answer: number;
  choices: number[]; // three options, smallest first, one of them the answer
  thing: Thing;
}

// Pick three answer choices: the answer, then the first two usable
// candidates in the order given (the most telling mistakes come first).
// Only whole numbers of at least 1, and no repeats.
export function threeChoices(answer: number, candidates: number[]): number[] {
  const choices = [answer];
  for (const n of candidates) {
    if (choices.length === 3) break;
    if (Number.isInteger(n) && n >= 1 && !choices.includes(n)) choices.push(n);
  }
  return choices.sort((x, y) => x - y);
}

// One piece of the sum shown on screen, e.g. the "3" in "3 + 2 = ?".
// `tone` decides its colour, matching the board: the first number is green,
// the second gold, something taken away rose, an unknown blue.
export interface EquationPart {
  text: string;
  tone: "a" | "b" | "taken" | "missing" | "op" | "result";
}
