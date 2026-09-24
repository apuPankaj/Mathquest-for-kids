// Checks the addition question maker and the stage rules.
//
//   npm run check:addition
//
// Looking at a few questions on screen cannot prove the rules hold — one
// question looks fine even when the rule behind it is broken. So this makes
// 1,000 questions per level (twice: once with a fixed seed so any failure can
// be reproduced, once truly random) and tests every one.
//
// Needs Node 22.6 or newer (it loads the TypeScript files directly).

import {
  makeQuestion, twinOf, pairsFor, diagnose, hintFor, questionText, correctText, LEVELS,
} from "../src/lib/addition/questions.ts";
import { applyOutcome, freshProgress } from "../src/lib/addition/mastery.ts";

let failures = 0;
let checks = 0;
function check(ok, message) {
  checks++;
  if (!ok) {
    failures++;
    if (failures <= 20) console.log("  ✗ " + message);
  }
}

// A small seeded random-number generator (mulberry32).
function seeded(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function allowed(level, a, b) {
  return pairsFor(level).some(([x, y]) => x === a && y === b);
}

const N = 1000;

for (const [label, rng] of [["seeded", seeded(2026)], ["random", Math.random]]) {
  for (const level of [1, 2, 3, 4]) {
    const seen = new Set();
    const recent = [];
    let named = 0;
    let distractors = 0;

    for (let i = 0; i < N; i++) {
      const q = makeQuestion(level, rng, recent.slice(-3));
      const where = `level ${level} ${q.a}+${q.b}`;
      seen.add(q.key);

      // The numbers are ones this level is allowed to ask.
      check(allowed(level, q.a, q.b), `${where}: not an allowed pair`);
      check(q.kind === LEVELS[level].kind, `${where}: wrong kind`);
      check(q.total === q.a + q.b, `${where}: total is wrong`);

      // The answer is actually right.
      const expected = q.kind === "sum" ? q.a + q.b : 10 - q.a;
      check(q.answer === expected, `${where}: answer ${q.answer}, expected ${expected}`);

      // Level-specific promises.
      if (level === 1) check(q.total <= 5 && q.a >= 1 && q.b >= 1, `${where}: level 1 goes past 5`);
      if (level === 2) check(q.total >= 6 && q.total <= 10, `${where}: level 2 outside 6-10`);
      if (level === 3) check(q.total === 10, `${where}: make-10 total is not 10`);
      if (level === 4) check(q.total >= 11 && q.total <= 18 && q.a <= 9 && q.b <= 9,
        `${where}: level 4 must cross ten using single digits`);

      // Three different choices, smallest first, all at least 1, answer among them.
      check(q.choices.length === 3, `${where}: ${q.choices.length} choices`);
      check(new Set(q.choices).size === q.choices.length, `${where}: repeated choice ${q.choices}`);
      check(q.choices.includes(q.answer), `${where}: answer missing from ${q.choices}`);
      check(q.choices.every((c) => Number.isInteger(c) && c >= 1), `${where}: bad choice in ${q.choices}`);
      check(q.choices.every((c, j) => j === 0 || q.choices[j - 1] < c), `${where}: choices not in order`);

      // Every wrong choice gets a hint, and we count how many are a named mistake.
      for (const c of q.choices.filter((c) => c !== q.answer)) {
        distractors++;
        if (diagnose(q, c) !== "other") named++;
        check(hintFor(q, c).length > 0, `${where}: no hint for ${c}`);
        // (5 + ? = 10 is the one case where naming what we have also names the answer.)
        const givesAway = new RegExp(`\\b${q.answer}\\b`).test(hintFor(q, c));
        check(!givesAway || (q.kind === "missing" && q.a === q.answer),
          `${where}: hint for ${c} gives away the answer: "${hintFor(q, c)}"`);
      }

      // The same question never comes back within three.
      check(!recent.slice(-3).includes(q.key), `${where}: repeated within 3 questions`);
      recent.push(q.key);

      // The twin is a different question of the same kind, and still allowed.
      const t = twinOf(q, rng);
      check(t.level === q.level && t.kind === q.kind, `${where}: twin changed level/kind`);
      check(!(t.a === q.a && t.b === q.b), `${where}: twin is the same question`);
      check(allowed(level, t.a, t.b), `${where}: twin ${t.a}+${t.b} not allowed`);
      check(t.thing === q.thing, `${where}: twin counts different things`);

      // Words: never "1 mangoes", and the question never contains the answer.
      for (const stage of ["objects", "pictures", "numbers"]) {
        const text = questionText(q, stage);
        check(q.thing.one === q.thing.many || !text.includes(`1 ${q.thing.many}`), `${where}: "${text}"`);
      }
      check(correctText(q, rng).includes(`${q.a} and ${q.b} make ${q.total}`), `${where}: correct text`);
    }

    const all = pairsFor(level).length;
    check(seen.size === all, `level ${level} (${label}): only ${seen.size} of ${all} possible questions ever came up`);
    console.log(`level ${level} (${label}): ${N} questions, all ${seen.size}/${all} possible questions used, ` +
      `${Math.round((100 * named) / distractors)}% of wrong choices are a named mistake`);
  }
}

// ---------------------------------------------------------------------------
// Stage rules
// ---------------------------------------------------------------------------

function run(outcomes, start = freshProgress()) {
  let p = start;
  const events = [];
  for (const o of outcomes) {
    const r = applyOutcome(p, o);
    p = r.next;
    if (r.event !== "none") events.push(r.event);
  }
  return { p, events };
}
const times = (n, o) => Array(n).fill(o);

let r = run(times(4, "firstTry"));
check(r.p.stage === "pictures" && r.events.join() === "movedUp", "4 first-try answers should move objects → pictures");

r = run(times(3, "firstTry"));
check(r.p.stage === "objects", "3 first-try answers should not move up yet");

r = run([...times(3, "firstTry"), "afterHint", "firstTry"]);
check(r.p.stage === "objects" && r.p.streak === 1, "a hint should reset the streak");

r = run(times(12, "firstTry"));
check(r.p.mastered && r.p.stage === "numbers" && r.events.join() === "movedUp,movedUp,mastered",
  "12 first-try answers should reach mastered");

r = run([...times(4, "firstTry"), "afterShow", "afterShow"]);
check(r.p.stage === "objects" && r.events.at(-1) === "movedBack", "shown twice in pictures should move back to objects");

r = run([...times(4, "firstTry"), "afterShow", "firstTry", "afterShow"]);
check(r.p.stage === "pictures", "a first-try answer between two shows should prevent moving back");

r = run(times(5, "afterShow"));
check(r.p.stage === "objects", "objects is the bottom stage — never moves below it");

r = run([...times(12, "firstTry"), "afterShow", "afterShow"]);
check(r.p.mastered && r.p.stage === "pictures", "a mastered place stays mastered even if a replay needs help");

r = run(["firstTry", "afterHint", "afterShow"]);
check(r.p.stars === 6, `stars should be 3 + 2 + 1 = 6, got ${r.p.stars}`);

// ---------------------------------------------------------------------------

console.log(failures === 0
  ? `\n✓ All ${checks.toLocaleString()} checks passed.`
  : `\n✗ ${failures} of ${checks.toLocaleString()} checks FAILED.`);
process.exit(failures === 0 ? 0 : 1);
