// The subtraction question maker.
//
// Each subtraction level is the partner of the addition level with the same
// number, and only opens once that addition level is mastered:
//   1  take away within 5            5 − 2      (partner of: add up to 5)
//   2  count back within 10          9 − 3      (partner of: count on)
//   3  take away from 10             10 − 3     (partner of: make 10)
//   4  back through ten, within 20   14 − 6     (partner of: make a ten)
//
// Like the addition maker, this is plain logic with no screens, checked by
// `npm run check`. The shared pieces are in lib/game/core.ts.

import { PRAISE, THINGS, pick, things, threeChoices } from "../game/core.ts";
import type { EquationPart, Level, Question, Rng, Stage, Thing } from "../game/core.ts";

// a − b = answer. Nothing extra: `a` is how many we start with, `b` how
// many are taken away.
export type SubtractionQuestion = Question;

export const LEVELS: Record<Level, { skill: string }> = {
  1: { skill: "Take away within 5" },
  2: { skill: "Count back" },
  3: { skill: "Take away from 10" },
  4: { skill: "Back through ten" },
};

// Every [a, b] pair a level is allowed to ask. No answer is ever 0 or below.
//   1: start with 2 to 5, take away at least 1, leave at least 1
//   2: start with 6 to 10, take away 1, 2 or 3 — counting back works best
//      for small amounts; for bigger ones children learn other ways later
//   3: always start with 10, take away 1 to 9
//   4: start with 11 to 18, take away 2 to 9, and ALWAYS more than the
//      loose ones — so every question has to go back through ten, which is
//      the whole skill (14 − 6: take away 4 to reach 10, then 2 more)
export function pairsFor(level: Level): [number, number][] {
  const pairs: [number, number][] = [];
  if (level === 1) for (let a = 2; a <= 5; a++) for (let b = 1; b < a; b++) pairs.push([a, b]);
  if (level === 2) for (let a = 6; a <= 10; a++) for (let b = 1; b <= 3; b++) pairs.push([a, b]);
  if (level === 3) for (let b = 1; b <= 9; b++) pairs.push([10, b]);
  if (level === 4) for (let a = 11; a <= 18; a++) for (let b = 2; b <= 9; b++) if (b > a - 10) pairs.push([a, b]);
  return pairs;
}

// Level 4: the loose ones beyond the ten (14 → 4).
export function onesOf(q: { a: number }): number {
  return q.a - 10;
}

function keyOf(level: Level, a: number, b: number): string {
  return `${level}:${a}-${b}`;
}

// The classic level-4 mistake: taking the smaller number from the larger in
// the ones (14 − 6 → "6 take away 4 is 2" → 12). It is the mistake that turns
// into trouble with borrowing later, so it is offered, and caught, here.
function smallerFromLarger(a: number, b: number): number {
  return 10 + (b - (a - 10));
}

// Wrong answers are real mistakes children make, so that a wrong pick tells
// us something (see diagnose() below).
function choicesFor(level: Level, a: number, b: number, rng: Rng): number[] {
  const answer = a - b;
  const slips = rng() < 0.5 ? [answer + 1, answer - 1] : [answer - 1, answer + 1];
  const nearby = [answer + 2, answer - 2, answer + 3, answer + 4];
  switch (level) {
    case 1:
      // a slip, then "gave the number taken away" or "added instead"
      return threeChoices(answer, [slips[0], ...(rng() < 0.5 ? [b, a + b] : [a + b, b]), slips[1], ...nearby]);
    case 2:
      // counted the starting number (9 − 3 → 7), then the number taken away
      return threeChoices(answer, [answer + 1, b, a + b, answer - 1, ...nearby]);
    case 3:
      // a slip, then the number taken away
      return threeChoices(answer, [slips[0], b, slips[1], ...nearby]);
    case 4:
      // smaller-from-larger, then counted the starting number
      return threeChoices(answer, [smallerFromLarger(a, b), answer + 1, answer - 1, ...nearby]);
  }
}

function build(level: Level, a: number, b: number, thing: Thing, rng: Rng): SubtractionQuestion {
  return { key: keyOf(level, a, b), level, a, b, answer: a - b, choices: choicesFor(level, a, b, rng), thing };
}

// A new question for this level. `avoid` is the keys of the last few
// questions, so the same one doesn't come twice in a row.
export function makeQuestion(level: Level, rng: Rng = Math.random, avoid: string[] = []): SubtractionQuestion {
  const all = pairsFor(level);
  const fresh = all.filter(([a, b]) => !avoid.includes(keyOf(level, a, b)));
  const [a, b] = pick(fresh.length > 0 ? fresh : all, rng);
  return build(level, a, b, pick(THINGS, rng), rng);
}

// After "Show me": the same kind of question, numbers a step or two away,
// the same things to count.
export function twinOf(q: SubtractionQuestion, rng: Rng = Math.random): SubtractionQuestion {
  const others = pairsFor(q.level).filter(([a, b]) => !(a === q.a && b === q.b));
  const near = others.filter(([a, b]) => Math.abs(a - q.a) + Math.abs(b - q.b) <= 2);
  const [a, b] = pick(near.length > 0 ? near : others, rng);
  return build(q.level, a, b, q.thing, rng);
}

// ---------------------------------------------------------------------------
// Understanding a wrong answer
// ---------------------------------------------------------------------------

export type Mistake =
  | "smallerFromLarger" // level 4: 14 − 6 → 12
  | "added" // added instead of taking away
  | "gaveTaken" // gave the number taken away, not what is left
  | "gaveStart" // gave the number we started with
  | "countedStart" // counting back, counted the starting number too (9 − 3 → 7)
  | "slip" // one away
  | "other";

export function diagnose(q: SubtractionQuestion, given: number): Mistake {
  if (q.level === 4 && given === smallerFromLarger(q.a, q.b)) return "smallerFromLarger";
  if (given === q.a + q.b) return "added";
  if (given === q.b && q.b !== q.answer) return "gaveTaken";
  if (given === q.a) return "gaveStart";
  if ((q.level === 2 || q.level === 4) && given === q.answer + 1) return "countedStart";
  if (Math.abs(given - q.answer) === 1) return "slip";
  return "other";
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

// The question, as the voice reads it. The numbers stage says "minus", so
// children meet the word once they understand the idea.
export function questionText(q: SubtractionQuestion, stage: Stage): string {
  if (stage === "objects") return `${things(q.a, q.thing)}. ${q.b} ${q.b === 1 ? "is" : "are"} taken away. How many are left?`;
  if (stage === "pictures") return `${q.a} take away ${q.b}. How many are left?`;
  return `What is ${q.a} minus ${q.b}?`;
}

// What to do — never the answer.
export function strategyTip(q: SubtractionQuestion): string {
  switch (q.level) {
    case 1:
      return "Take them away, then count what is left.";
    case 2:
      return `Start at ${q.a}, then count back ${q.b}.`;
    case 3:
      return `What goes with ${q.b} to make 10?`;
    case 4:
      return "Take away to get back to 10 first. Then take away the rest.";
  }
}

export function hintFor(q: SubtractionQuestion, given: number): string {
  switch (diagnose(q, given)) {
    case "smallerFromLarger":
      return `You can't take ${q.b} from ${onesOf(q)}. Take away the ${onesOf(q)} first, to get back to 10.`;
    case "added":
      return "We're taking away, so there will be fewer, not more!";
    case "gaveTaken":
      return "That's how many went away. How many are left?";
    case "gaveStart":
      return "That's how many we started with. Now take some away!";
    case "countedStart":
      return "When you count back, don't count the number you start on.";
    case "slip":
      return "So close! Count again, slowly.";
    default:
      return strategyTip(q);
  }
}

// The praise, then the fact. Taking away from 10 also says the addition
// fact it comes from, because the child has already learned it.
export function correctText(q: SubtractionQuestion, rng: Rng = Math.random): string {
  const fact = `${pick(PRAISE, rng)} ${q.a} take away ${q.b} leaves ${q.answer}.`;
  return q.level === 3 ? `${fact} Because ${q.answer} and ${q.b} make 10.` : fact;
}

// The sum on screen: 9 − 3 = ?   The number taken away is rose, like the
// faint outlines of the things taken away on the board.
export function equation(q: SubtractionQuestion, solved: boolean): EquationPart[] {
  return [
    { text: String(q.a), tone: "a" },
    { text: "−", tone: "op" },
    { text: String(q.b), tone: "taken" },
    { text: "=", tone: "op" },
    { text: solved ? String(q.answer) : "?", tone: "result" },
  ];
}
