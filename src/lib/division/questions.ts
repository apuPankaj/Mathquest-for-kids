// The division question maker.
//
// Division is multiplication backwards, and it has TWO meanings a child must
// meet, because children who only ever share things out get stuck on the
// other one:
//   SHARING  — 12 shared by 3: how many does each get?      (levels 1 and 3)
//   GROUPING — 12 in groups of 3: how many groups?          (levels 2 and 4)
// Each level is the partner of the multiplication level with the same number:
//   1  fair sharing, 2-5 friends                 (partner: equal groups)
//   2  making groups of 2, 5 or 10               (partner: skip counting)
//   3  think multiplication: 3 or 4 equal rows    (partner: 3s & 4s arrays)
//   4  break it apart backwards: rows of 2-9,
//      6 to 9 rows — take 5 rows first           (partner: break it apart)
// Everything divides exactly; leftovers come later. In every question `a` is
// how many there are altogether, `b` the number divided by.
//
// Plain logic, no screens, checked by `npm run check`.

import { PRAISE, THINGS, pick, threeChoices } from "../game/core.ts";
import type { EquationPart, Level, Question, Rng, Stage, Thing } from "../game/core.ts";

export type DivisionQuestion = Question;

export const LEVELS: Record<Level, { skill: string }> = {
  1: { skill: "Share fairly" },
  2: { skill: "Make groups of 2, 5, 10" },
  3: { skill: "Think multiplication: 3s & 4s" },
  4: { skill: "Break it apart: 6s to 9s" },
};

// Is this level about sharing (how many each?) or grouping (how many groups?)
export function meaningOf(level: Level): "sharing" | "grouping" {
  return level === 1 || level === 3 ? "sharing" : "grouping";
}

// Every [a, b] pair a level may ask, built from the multiplication it undoes.
//   1: b friends (2-5) get 2-5 each
//   2: groups of 2, 5 or 10; 2-6 groups
//   3: 3 or 4 rows; 2-10 in each row
//   4: rows of 2-9; 6-9 rows
export function pairsFor(level: Level): [number, number][] {
  const pairs: [number, number][] = [];
  const add = (b: number, answer: number) => pairs.push([b * answer, b]);
  if (level === 1) for (let b = 2; b <= 5; b++) for (let n = 2; n <= 5; n++) add(b, n);
  if (level === 2) for (const b of [2, 5, 10]) for (let n = 2; n <= 6; n++) add(b, n);
  if (level === 3) for (const b of [3, 4]) for (let n = 2; n <= 10; n++) add(b, n);
  if (level === 4) for (let b = 2; b <= 9; b++) for (let n = 6; n <= 9; n++) add(b, n);
  return pairs;
}

function keyOf(level: Level, a: number, b: number): string {
  return `${level}:${a}/${b}`;
}

// Wrong answers are real mistakes children make (see diagnose() below).
function choicesFor(level: Level, a: number, b: number, rng: Rng): number[] {
  const answer = a / b;
  const slips = rng() < 0.5 ? [answer + 1, answer - 1] : [answer - 1, answer + 1];
  const nearby = [answer + 2, answer - 2, answer + 3];
  switch (level) {
    case 1:
      // one round off, took away instead, gave the number of friends
      return threeChoices(answer, [slips[0], a - b, b, slips[1], ...nearby]);
    case 2:
      // one group off, took away instead, multiplied instead
      return threeChoices(answer, [slips[0], a - b, a * b, slips[1], ...nearby]);
    case 3:
      // one off, multiplied instead, gave the number of rows
      return threeChoices(answer, [slips[0], a * b, b, slips[1], ...nearby]);
    case 4:
      // forgot the first 5 rows, one row off, took away instead
      return threeChoices(answer, [answer - 5, slips[0], a - b, slips[1], ...nearby]);
  }
}

function build(level: Level, a: number, b: number, thing: Thing, rng: Rng): DivisionQuestion {
  return { key: keyOf(level, a, b), level, a, b, answer: a / b, choices: choicesFor(level, a, b, rng), thing };
}

export function makeQuestion(level: Level, rng: Rng = Math.random, avoid: string[] = []): DivisionQuestion {
  const all = pairsFor(level);
  const fresh = all.filter(([a, b]) => !avoid.includes(keyOf(level, a, b)));
  const [a, b] = pick(fresh.length > 0 ? fresh : all, rng);
  return build(level, a, b, pick(THINGS, rng), rng);
}

// A near-identical question: the same number to divide by, and an answer one
// or two away (or, failing that, the nearest other question).
export function twinOf(q: DivisionQuestion, rng: Rng = Math.random): DivisionQuestion {
  const others = pairsFor(q.level).filter(([a, b]) => !(a === q.a && b === q.b));
  const distance = ([a, b]: [number, number]) => Math.abs(a / b - q.answer) + Math.abs(b - q.b);
  const near = others.filter((p) => distance(p) <= 2);
  const [a, b] = pick(near.length > 0 ? near : others, rng);
  return build(q.level, a, b, q.thing, rng);
}

// ---------------------------------------------------------------------------
// Understanding a wrong answer
// ---------------------------------------------------------------------------

export type Mistake =
  | "forgotFive" // level 4: counted only the extra rows (42 ÷ 6 → 2)
  | "multiplied" // 12 ÷ 3 → 36
  | "subtracted" // 12 ÷ 3 → 9
  | "gaveDivisor" // gave the number divided by (12 ÷ 3 → 3)
  | "oneOff" // one round, group or row too many or too few
  | "other";

export function diagnose(q: DivisionQuestion, given: number): Mistake {
  if (q.level === 4 && given === q.answer - 5) return "forgotFive";
  if (given === q.a * q.b) return "multiplied";
  if (given === q.a - q.b && q.a - q.b !== q.answer) return "subtracted";
  if (given === q.b && q.b !== q.answer) return "gaveDivisor";
  if (Math.abs(given - q.answer) === 1) return "oneOff";
  return "other";
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

export function questionText(q: DivisionQuestion, stage: Stage): string {
  const { a, b } = q;
  const many = q.thing.many;
  if (stage === "numbers") return `What is ${a} divided by ${b}?`;
  const objects = stage === "objects";
  switch (q.level) {
    case 1:
      return objects ? `${a} ${many}, shared equally by ${b} friends. How many does each friend get?` : `${a} shared by ${b}. How many each?`;
    case 2:
      return objects ? `${a} ${many}. Put ${b} in each group. How many groups?` : `${a} in groups of ${b}. How many groups?`;
    case 3:
      return objects ? `${a} ${many} in ${b} equal rows. How many in each row?` : `${a} in ${b} equal rows. How many in each row?`;
    case 4:
      return objects ? `${a} ${many}. How many rows of ${b} can you make?` : `How many rows of ${b} make ${a}?`;
  }
}

// What to do — never the answer.
export function strategyTip(q: DivisionQuestion): string {
  switch (q.level) {
    case 1:
      return "Share them out one at a time, then count one plate.";
    case 2:
      return `Make groups of ${q.b}, and count the groups.`;
    case 3:
      return `Think: ${q.b} times what makes ${q.a}?`;
    case 4:
      return `Take 5 rows of ${q.b} first. Then see how many more rows.`;
  }
}

export function hintFor(q: DivisionQuestion, given: number): string {
  const sharing = meaningOf(q.level) === "sharing";
  switch (diagnose(q, given)) {
    case "forgotFive":
      return "You found the extra rows. Don't forget the first 5!";
    case "multiplied":
      return `Dividing shares things out, so the answer is smaller than ${q.a}.`;
    case "subtracted":
      return sharing
        ? `We're not taking ${q.b} away. We're sharing among ${q.b}.`
        : `We're not taking ${q.b} away. We're making groups of ${q.b}.`;
    case "gaveDivisor":
      if (q.level === 1) return `${q.b} is how many friends. How many does each friend get?`;
      if (q.level === 3) return `${q.b} is how many rows. How many are in each row?`;
      return `${q.b} is how many in each group. How many groups are there?`;
    case "oneOff":
      if (q.level === 1) return "So close! Count one plate carefully.";
      if (q.level === 3) return "So close! Count one row carefully.";
      return q.level === 2 ? "So close! Count the groups again." : "So close! Count the rows again.";
    default:
      return strategyTip(q);
  }
}

// The praise, then the fact — and at levels 3 and 4, the multiplication it
// undoes, which is the whole idea.
export function correctText(q: DivisionQuestion, rng: Rng = Math.random): string {
  const praise = pick(PRAISE, rng);
  switch (q.level) {
    case 1:
      return `${praise} ${q.a} shared by ${q.b} is ${q.answer} each.`;
    case 2:
      return `${praise} ${q.a} makes ${q.answer} groups of ${q.b}.`;
    case 3:
      return `${praise} ${q.b} rows of ${q.answer} make ${q.a}, so ${q.a} divided by ${q.b} is ${q.answer}.`;
    case 4:
      return `${praise} ${q.answer} rows of ${q.b} make ${q.a}, so ${q.a} divided by ${q.b} is ${q.answer}.`;
  }
}

export function equation(q: DivisionQuestion, solved: boolean): EquationPart[] {
  return [
    { text: String(q.a), tone: "a" },
    { text: "÷", tone: "op" },
    { text: String(q.b), tone: "b" },
    { text: "=", tone: "op" },
    { text: solved ? String(q.answer) : "?", tone: "result" },
  ];
}

// Levels 3 and 4 show the multiplication with a gap in it: 4 × ? = 24 is
// "4 rows of how many?", ? × 6 = 42 is "how many rows of 6?".
export function subline(q: DivisionQuestion, solved: boolean): string | null {
  const gap = solved ? String(q.answer) : "?";
  if (q.level === 3) return `${q.b} × ${gap} = ${q.a}`;
  if (q.level === 4) return `${gap} × ${q.b} = ${q.a}`;
  return null;
}
