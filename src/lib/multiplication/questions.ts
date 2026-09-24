// The multiplication question maker.
//
// Multiplication means EQUAL GROUPS: 3 × 4 is 3 groups of 4. Each level
// teaches one way of seeing that, each resting on the one before:
//   1  equal groups — fill 3 plates with 4 each: 4 + 4 + 4
//   2  skip counting in 2s, 5s and 10s — "5, 10, 15"
//   3  arrays and turn-arounds, the 3 and 4 times tables — 3 rows of 4 is
//      the same as 4 rows of 3, so every fact learned gives two
//   4  break it apart, the 6 to 9 times tables — 7 × 6 is 5 rows of 6 and 2
//      more rows of 6, using the 5s from level 2
// In every question `a` is the number of groups (or rows) and `b` how many
// are in each.
//
// Plain logic, no screens, checked by `npm run check`.

import { PRAISE, THINGS, pick, threeChoices } from "../game/core.ts";
import type { EquationPart, Level, Question, Rng, Stage, Thing } from "../game/core.ts";

export type MultiplicationQuestion = Question;

export const LEVELS: Record<Level, { skill: string }> = {
  1: { skill: "Equal groups" },
  2: { skill: "Skip count 2s, 5s, 10s" },
  3: { skill: "Turn it around: 3s & 4s" },
  4: { skill: "Break it apart: 6s to 9s" },
};

// Levels 1-2 are drawn as plates of equal groups, levels 3-4 as rows.
export function unitOf(level: Level): "groups" | "rows" {
  return level <= 2 ? "groups" : "rows";
}

// Every [a, b] pair a level is allowed to ask.
//   1: 2 to 5 groups of 2 to 5 (up to 25 things to count one by one)
//   2: 2 to 6 groups of 2, 5 or 10 — the tables children skip-count first
//   3: the 3 and 4 times tables, up to 10, either way round
//   4: 6 to 9 rows of 2 to 9 — every question can break at 5 rows
export function pairsFor(level: Level): [number, number][] {
  const pairs: [number, number][] = [];
  const add = (a: number, b: number) => {
    if (!pairs.some(([x, y]) => x === a && y === b)) pairs.push([a, b]);
  };
  if (level === 1) for (let a = 2; a <= 5; a++) for (let b = 2; b <= 5; b++) add(a, b);
  if (level === 2) for (const b of [2, 5, 10]) for (let a = 2; a <= 6; a++) add(a, b);
  if (level === 3) {
    for (const t of [3, 4]) {
      for (let n = 2; n <= 10; n++) {
        add(t, n);
        add(n, t);
      }
    }
  }
  if (level === 4) for (let a = 6; a <= 9; a++) for (let b = 2; b <= 9; b++) add(a, b);
  return pairs;
}

function keyOf(level: Level, a: number, b: number): string {
  return `${level}:${a}x${b}`;
}

// Wrong answers are real mistakes children make (see diagnose() below).
function choicesFor(level: Level, a: number, b: number, rng: Rng): number[] {
  const answer = a * b;
  const groupOff = rng() < 0.5 ? [answer + b, answer - b] : [answer - b, answer + b];
  const nearby = [answer + 1, answer - 1, answer + 2, answer - 2];
  switch (level) {
    case 1:
    case 2:
      // one group too many or too few, then added instead of multiplied
      return threeChoices(answer, [groupOff[0], a + b, groupOff[1], ...nearby]);
    case 3:
      // a row off, added instead, or the wrong number in each row
      return threeChoices(answer, [groupOff[0], a + b, answer + a, answer - a, groupOff[1], ...nearby]);
    case 4:
      // the neighbouring facts on either side (one row too many or too few)
      return threeChoices(answer, [groupOff[0], groupOff[1], a + b, ...nearby]);
  }
}

function build(level: Level, a: number, b: number, thing: Thing, rng: Rng): MultiplicationQuestion {
  return { key: keyOf(level, a, b), level, a, b, answer: a * b, choices: choicesFor(level, a, b, rng), thing };
}

export function makeQuestion(level: Level, rng: Rng = Math.random, avoid: string[] = []): MultiplicationQuestion {
  const all = pairsFor(level);
  const fresh = all.filter(([a, b]) => !avoid.includes(keyOf(level, a, b)));
  const [a, b] = pick(fresh.length > 0 ? fresh : all, rng);
  return build(level, a, b, pick(THINGS, rng), rng);
}

export function twinOf(q: MultiplicationQuestion, rng: Rng = Math.random): MultiplicationQuestion {
  const others = pairsFor(q.level).filter(([a, b]) => !(a === q.a && b === q.b));
  const near = others.filter(([a, b]) => Math.abs(a - q.a) + Math.abs(b - q.b) <= 2);
  const [a, b] = pick(near.length > 0 ? near : others, rng);
  return build(q.level, a, b, q.thing, rng);
}

// ---------------------------------------------------------------------------
// Understanding a wrong answer
// ---------------------------------------------------------------------------

export type Mistake =
  | "added" // 3 × 4 → 7
  | "groupOff" // one group (or row) too many or too few: 3 × 4 → 8 or 16
  | "columnOff" // rows: the wrong number in each row: 3 × 4 → 9 or 15
  | "slip" // one away, counting one by one
  | "other";

export function diagnose(q: MultiplicationQuestion, given: number): Mistake {
  if (given === q.a + q.b) return "added";
  if (Math.abs(given - q.answer) === q.b) return "groupOff";
  if (q.level >= 3 && Math.abs(given - q.answer) === q.a) return "columnOff";
  if (Math.abs(given - q.answer) === 1) return "slip";
  return "other";
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

export function questionText(q: MultiplicationQuestion, stage: Stage): string {
  const unit = unitOf(q.level);
  if (stage === "objects") return `${q.a} ${unit} of ${q.b} ${q.thing.many}. How many ${q.thing.many} altogether?`;
  if (stage === "pictures") return `${q.a} ${unit} of ${q.b}. How many altogether?`;
  return `What is ${q.a} times ${q.b}?`;
}

// What to do — never the answer.
export function strategyTip(q: MultiplicationQuestion): string {
  const more = q.a - 5;
  switch (q.level) {
    case 1:
      return `Add ${q.b}, ${q.a} times.`;
    case 2:
      return `Count in ${q.b}s, once for each group.`;
    case 3:
      return `Count the rows in ${q.b}s. Or turn it around!`;
    case 4:
      return `Break it apart: 5 rows of ${q.b}, and ${more} more ${more === 1 ? "row" : "rows"}.`;
  }
}

export function hintFor(q: MultiplicationQuestion, given: number): string {
  const unit = unitOf(q.level);
  switch (diagnose(q, given)) {
    case "added":
      return `Times means groups of: ${q.a} ${unit} of ${q.b}, not ${q.a} and ${q.b}.`;
    case "groupOff":
      if (q.level === 4) return `Close! ${strategyTip(q)}`;
      return unit === "groups"
        ? `Count the groups again. Each group has ${q.b}.`
        : `Count the rows again. Each row has ${q.b}.`;
    case "columnOff":
      return `Check how many are in each row.`;
    case "slip":
      return "So close! Count again, slowly.";
    default:
      return strategyTip(q);
  }
}

// The praise, then the fact. Level 3 adds the turned-around fact, which is
// the whole point of that level.
export function correctText(q: MultiplicationQuestion, rng: Rng = Math.random): string {
  const unit = unitOf(q.level);
  const fact = `${pick(PRAISE, rng)} ${q.a} ${unit} of ${q.b} make ${q.answer}.`;
  if (q.level === 3 && q.a !== q.b) return `${fact} And ${q.b} rows of ${q.a} make ${q.answer} too!`;
  return fact;
}

export function equation(q: MultiplicationQuestion, solved: boolean): EquationPart[] {
  return [
    { text: String(q.a), tone: "a" },
    { text: "×", tone: "op" },
    { text: String(q.b), tone: "b" },
    { text: "=", tone: "op" },
    { text: solved ? String(q.answer) : "?", tone: "result" },
  ];
}

// Level 1 shows the adding the multiplication stands for, under the sum:
// 3 × 4 is 4 + 4 + 4. It is the bridge from addition.
export function subline(q: MultiplicationQuestion, solved: boolean): string | null {
  if (q.level !== 1) return null;
  const sum = Array.from({ length: q.a }, () => String(q.b)).join(" + ");
  return solved ? `${sum} = ${q.answer}` : sum;
}
