// The addition question maker.
//
// Instead of a fixed list of typed-in questions, this makes a fresh question
// whenever the game asks for one, at the right level for the child. Everything
// here is plain logic — no screens, no React — so it can be checked on its own
// by `npm run check:addition`, which makes thousands of questions and tests
// every rule below.
//
// The shared pieces (levels, the things to count, choices) are in
// lib/game/core.ts.

import { PRAISE, THINGS, pick, things, threeChoices } from "../game/core.ts";
import type { EquationPart, Level, Question, Rng, Stage, Thing } from "../game/core.ts";

// "sum" asks a + b = ?   "missing" asks a + ? = 10
export type QuestionKind = "sum" | "missing";

export interface AdditionQuestion extends Question {
  kind: QuestionKind;
  total: number; // always a + b
  // answer — "sum": the total. "missing": b, the number that was hidden
}

// What each level teaches, in the words the map and the grown-ups see.
export const LEVELS: Record<Level, { skill: string; kind: QuestionKind }> = {
  1: { skill: "Add up to 5", kind: "sum" },
  2: { skill: "Count on to 10", kind: "sum" },
  3: { skill: "Make 10", kind: "missing" },
  4: { skill: "Add up to 20", kind: "sum" },
};

// Every [a, b] pair a level is allowed to ask. The levels are small enough to
// list in full, which makes "is this question allowed?" a simple lookup.
//   1: both at least 1, total up to 5          (count everything)
//   2: total 6 to 10                           (start at the bigger number, count on)
//   3: a from 1 to 9, and b is whatever makes 10 (pairs that make ten)
//   4: both 2 to 9, total 11 or more           (fill a ten, then add the rest)
// Level 4 stops at 9 + 9 on purpose: every question has to cross ten, which is
// the whole skill. Two-digit numbers come in a later build.
export function pairsFor(level: Level): [number, number][] {
  const pairs: [number, number][] = [];
  if (level === 3) {
    for (let a = 1; a <= 9; a++) pairs.push([a, 10 - a]);
    return pairs;
  }
  for (let a = 1; a <= 9; a++) {
    for (let b = 1; b <= 9; b++) {
      const t = a + b;
      if (level === 1 && t <= 5) pairs.push([a, b]);
      if (level === 2 && t >= 6 && t <= 10) pairs.push([a, b]);
      if (level === 4 && a >= 2 && b >= 2 && t >= 11) pairs.push([a, b]);
    }
  }
  return pairs;
}

function keyOf(level: Level, a: number, b: number): string {
  return `${level}:${a}+${b}`;
}

// Wrong answers are chosen from the mistakes children really make, so that a
// wrong pick tells us something (see diagnose() below) — not random numbers.
function choicesFor(level: Level, kind: QuestionKind, a: number, b: number, rng: Rng): number[] {
  const answer = kind === "sum" ? a + b : b;
  const slips = rng() < 0.5 ? [answer + 1, answer - 1] : [answer - 1, answer + 1];

  let specific: number[] = [];
  if (kind === "missing") {
    // Answering 10 (the goal) or a (what we already have) instead of how many more.
    specific = rng() < 0.5 ? [10, a] : [a, 10];
  } else if (level === 4) {
    // Only the ones after making ten (13 → 3), or only one of the two groups.
    specific = [answer - 10, Math.max(a, b)];
  } else {
    // Only counted one of the two groups.
    specific = [Math.max(a, b)];
  }

  // One counting slip, then the most telling mistake, then anything nearby.
  return threeChoices(answer, [slips[0], ...specific, slips[1], answer + 2, answer - 2, answer + 3, answer + 4]);
}

function build(level: Level, a: number, b: number, thing: Thing, rng: Rng): AdditionQuestion {
  const kind = LEVELS[level].kind;
  return {
    key: keyOf(level, a, b),
    level,
    kind,
    a,
    b,
    total: a + b,
    answer: kind === "sum" ? a + b : b,
    choices: choicesFor(level, kind, a, b, rng),
    thing,
  };
}

// A new question for this level. `avoid` is the keys of the last few questions,
// so the child doesn't get the same one twice in a row.
export function makeQuestion(level: Level, rng: Rng = Math.random, avoid: string[] = []): AdditionQuestion {
  const all = pairsFor(level);
  const fresh = all.filter(([a, b]) => !avoid.includes(keyOf(level, a, b)));
  const [a, b] = pick(fresh.length > 0 ? fresh : all, rng);
  return build(level, a, b, pick(THINGS, rng), rng);
}

// After a child is shown how to solve a question, they get a "twin": the same
// kind of question with numbers only a step or two away, and the same things
// to count — close enough that what they just saw helps, different enough that
// they have to do it themselves.
export function twinOf(q: AdditionQuestion, rng: Rng = Math.random): AdditionQuestion {
  const others = pairsFor(q.level).filter(([a, b]) => !(a === q.a && b === q.b));
  const near = others.filter(([a, b]) => Math.abs(a - q.a) + Math.abs(b - q.b) <= 2);
  const [a, b] = pick(near.length > 0 ? near : others, rng);
  return build(q.level, a, b, q.thing, rng);
}

// ---------------------------------------------------------------------------
// Understanding a wrong answer
// ---------------------------------------------------------------------------

export type Mistake =
  | "slip" // one away — miscounted by one
  | "oneGroup" // gave one of the two numbers — forgot the other group
  | "forgotTen" // level 4: gave just the ones (3 instead of 13)
  | "wholeTotal" // "make 10": answered 10, the goal, not how many more
  | "alreadyHave" // "make 10": answered the number we already have
  | "other";

export function diagnose(q: AdditionQuestion, given: number): Mistake {
  if (q.level === 4 && given === q.answer - 10) return "forgotTen";
  if (q.kind === "missing" && given === q.total) return "wholeTotal";
  if (q.kind === "missing" && given === q.a && q.a !== q.answer) return "alreadyHave";
  if (q.kind === "sum" && (given === q.a || given === q.b)) return "oneGroup";
  if (Math.abs(given - q.answer) === 1) return "slip";
  return "other";
}

// ---------------------------------------------------------------------------
// Words. Short, spoken-aloud sentences a 5-year-old can follow.
// ---------------------------------------------------------------------------

// The question, as the voice reads it.
export function questionText(q: AdditionQuestion, stage: Stage): string {
  if (q.kind === "missing") {
    if (stage === "objects") return `We have ${things(q.a, q.thing)}. How many more make 10?`;
    if (stage === "pictures") return `${q.a}, and how many more, make 10?`;
    return `${q.a} plus what makes 10?`;
  }
  if (stage === "objects") return `${things(q.a, q.thing)} and ${q.b} more. How many ${q.thing.many} altogether?`;
  if (stage === "pictures") return `${q.a} and ${q.b} more. How many altogether?`;
  return `What is ${q.a} plus ${q.b}?`;
}

// The one-line tip for each level — what to do, not the answer.
export function strategyTip(q: AdditionQuestion): string {
  switch (q.level) {
    case 1:
      return "Count them all, one by one.";
    case 2:
      return `Start at ${Math.max(q.a, q.b)}, then count on.`;
    case 3:
      return "Count the empty spaces.";
    case 4:
      return "Fill up the ten first. Then add what is left.";
  }
}

// What the game says after a first wrong answer, matched to the mistake.
export function hintFor(q: AdditionQuestion, given: number): string {
  switch (diagnose(q, given)) {
    case "slip":
      return "So close! Count again, slowly.";
    case "oneGroup":
      return "Don't forget the other group!";
    case "forgotTen":
      return "You found the ones. Don't forget the full ten!";
    case "wholeTotal":
      return "10 is how many we want at the end. How many more do we need?";
    case "alreadyHave":
      return `We already have ${q.a}. How many more make 10?`;
    default:
      return strategyTip(q);
  }
}

// What the game says when the answer is right — the praise, then the fact
// itself, so the child hears "3 and 2 make 5" again and again.
export function correctText(q: AdditionQuestion, rng: Rng = Math.random): string {
  return `${pick(PRAISE, rng)} ${q.a} and ${q.b} make ${q.total}.`;
}

// The sum on screen: 3 + 2 = ?   or   7 + ? = 10
export function equation(q: AdditionQuestion, solved: boolean): EquationPart[] {
  if (q.kind === "missing") {
    return [
      { text: String(q.a), tone: "a" },
      { text: "+", tone: "op" },
      { text: solved ? String(q.answer) : "?", tone: "missing" },
      { text: "=", tone: "op" },
      { text: "10", tone: "result" },
    ];
  }
  return [
    { text: String(q.a), tone: "a" },
    { text: "+", tone: "op" },
    { text: String(q.b), tone: "b" },
    { text: "=", tone: "op" },
    { text: solved ? String(q.answer) : "?", tone: "result" },
  ];
}
