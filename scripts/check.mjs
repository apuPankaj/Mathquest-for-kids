// Checks the question makers (addition and subtraction), their counting
// boards, and the stage rules.
//
//   npm run check
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
import { applyOutcome, freshProgress } from "../src/lib/game/mastery.ts";
import { initialBoard, demoStep, tapItem, tapEmpty, labelFor, bigGroup } from "../src/lib/addition/board.ts";
import * as sub from "../src/lib/subtraction/questions.ts";

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
// Subtraction questions — the same promises, plus: the answer is never 0
// or below, and level 4 always has to go back through ten.
// ---------------------------------------------------------------------------

const subAllowed = (level, a, b) => sub.pairsFor(level).some(([x, y]) => x === a && y === b);
for (const [label, rng] of [["seeded", seeded(2027)], ["random", Math.random]]) {
  for (const level of [1, 2, 3, 4]) {
    const seen = new Set();
    const recent = [];
    let named = 0;
    let distractors = 0;

    for (let i = 0; i < N; i++) {
      const q = sub.makeQuestion(level, rng, recent.slice(-3));
      const where = `subtraction level ${level} ${q.a}-${q.b}`;
      seen.add(q.key);

      check(subAllowed(level, q.a, q.b), `${where}: not an allowed pair`);
      check(q.answer === q.a - q.b, `${where}: answer ${q.answer}, expected ${q.a - q.b}`);
      check(q.answer >= 1, `${where}: answer ${q.answer} is not at least 1`);
      if (level === 1) check(q.a <= 5, `${where}: level 1 starts above 5`);
      if (level === 2) check(q.a >= 6 && q.a <= 10 && q.b <= 3, `${where}: level 2 outside 6-10 or takes more than 3`);
      if (level === 3) check(q.a === 10, `${where}: level 3 doesn't start at 10`);
      if (level === 4) check(q.a >= 11 && q.a <= 18 && q.b <= 9 && q.b > q.a - 10 && q.answer < 10,
        `${where}: level 4 must go back through ten`);

      check(q.choices.length === 3, `${where}: ${q.choices.length} choices`);
      check(new Set(q.choices).size === 3, `${where}: repeated choice ${q.choices}`);
      check(q.choices.includes(q.answer), `${where}: answer missing from ${q.choices}`);
      check(q.choices.every((c) => Number.isInteger(c) && c >= 1), `${where}: bad choice in ${q.choices}`);
      check(q.choices.every((c, j) => j === 0 || q.choices[j - 1] < c), `${where}: choices not in order`);

      for (const c of q.choices.filter((c) => c !== q.answer)) {
        distractors++;
        if (sub.diagnose(q, c) !== "other") named++;
        const hint = sub.hintFor(q, c);
        check(hint.length > 0, `${where}: no hint for ${c}`);
        // A hint may name the question's own numbers; it must not state the answer otherwise.
        const own = [q.a, q.b, q.a - 10, 10].includes(q.answer);
        check(own || !new RegExp(`\\b${q.answer}\\b`).test(hint), `${where}: hint for ${c} gives away the answer: "${hint}"`);
      }

      check(!recent.slice(-3).includes(q.key), `${where}: repeated within 3 questions`);
      recent.push(q.key);

      const t = sub.twinOf(q, rng);
      check(t.level === q.level && !(t.a === q.a && t.b === q.b) && subAllowed(level, t.a, t.b), `${where}: bad twin ${t.a}-${t.b}`);
      check(t.thing === q.thing, `${where}: twin counts different things`);

      for (const stage of ["objects", "pictures", "numbers"]) {
        const text = sub.questionText(q, stage);
        // a lone "1" (not the 1 in "11") must never be followed by a plural
        const loneOne = (word) => new RegExp(`(^|[^0-9])1 ${word}\\b`).test(text);
        check(!loneOne("are") && (q.thing.one === q.thing.many || !loneOne(q.thing.many)), `${where}: "${text}"`);
      }
      const praise = sub.correctText(q, rng);
      check(praise.includes(`${q.a} take away ${q.b} leaves ${q.answer}.`), `${where}: correct text "${praise}"`);
      if (level === 3) check(praise.includes(`${q.answer} and ${q.b} make 10`), `${where}: level 3 should say the make-10 fact`);
    }

    const all = sub.pairsFor(level).length;
    check(seen.size === all, `subtraction level ${level} (${label}): only ${seen.size} of ${all} questions came up`);
    console.log(`subtraction level ${level} (${label}): ${N} questions, all ${seen.size}/${all} possible questions used, ` +
      `${Math.round((100 * named) / distractors)}% of wrong choices are a named mistake`);
  }
}

// The four named subtraction mistakes, each on a question where it is unambiguous.
const sq = (level, a, b) => { let q; const rng = seeded(a * 31 + b); do q = sub.makeQuestion(level, rng); while (q.a !== a || q.b !== b); return q; };
check(sub.diagnose(sq(4, 14, 6), 12) === "smallerFromLarger", "14 − 6 → 12 is smaller-from-larger");
check(sub.diagnose(sq(2, 9, 3), 12) === "added", "9 − 3 → 12 is adding instead");
check(sub.diagnose(sq(2, 9, 3), 7) === "countedStart", "9 − 3 → 7 is counting the starting number");
check(sub.diagnose(sq(1, 5, 2), 2) === "gaveTaken", "5 − 2 → 2 is giving the number taken away");
check(sub.hintFor(sq(4, 14, 6), 12) === "You can't take 6 from 4. Take away the 4 first, to get back to 10.",
  `smaller-from-larger hint: "${sub.hintFor(sq(4, 14, 6), 12)}"`);

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
// The counting board: every "Show me" must end on the right answer, and a
// child tapping everything must get there too. Run for EVERY allowed
// question, in both looks — not a sample.
// ---------------------------------------------------------------------------

let boards = 0;
for (const level of [1, 2, 3, 4]) {
  for (const [a, b] of pairsFor(level)) {
    // makeQuestion picks at random, so build this exact pair by asking until it comes up.
    let q;
    const rng = seeded(a * 100 + b);
    do q = makeQuestion(level, rng); while (q.a !== a || q.b !== b);

    for (const look of ["objects", "dots"]) {
      const where = `board level ${level} ${a}+${b} (${look})`;
      boards++;

      // 1. The demonstration, from the very start.
      let board = initialBoard(q, look);
      let lastSay = "";
      let steps = 0;
      for (let s = demoStep(board, q); s; s = demoStep(board, q)) {
        board = s.board;
        if (s.say) lastSay = s.say;
        if (++steps > 60) break;
      }
      check(steps <= 60, `${where}: demonstration never finished`);
      check(board.finished, `${where}: demonstration did not say its last line`);
      check(new RegExp(`\\b${q.total}\\b`).test(lastSay), `${where}: demonstration ended saying "${lastSay}"`);
      const labels = board.items.map((it) => labelFor(board, q, it)).filter((n) => n !== null);
      const top = Math.max(...labels);
      if (q.kind === "missing") {
        check(board.items.length === 10, `${where}: ten-frame not full after demo`);
        check(board.items.filter((it) => it.group === "added").length === q.answer, `${where}: demo added the wrong number`);
        check(top === q.answer, `${where}: labels count to ${top}, not ${q.answer}`);
      } else if (level === 4) {
        const to = bigGroup(q) === "a" ? 0 : 1;
        check(board.items.filter((it) => it.frame === to).length === 10, `${where}: no full ten after demo`);
        check(board.items.filter((it) => it.frame !== to).length === q.total - 10, `${where}: wrong number left over`);
        check(top === 10, `${where}: labels count to ${top}, not 10`);
      } else {
        check(top === q.total, `${where}: labels count to ${top}, not ${q.total}`);
        if (level === 2) check(board.startAt === Math.max(a, b), `${where}: count on started at ${board.startAt}`);
      }

      // 2. A child doing it themselves (objects stage only — pictures are look-and-think).
      if (look !== "objects") continue;
      board = initialBoard(q, look);
      lastSay = "";
      for (let guard = 0; guard < 60; guard++) {
        let s = null;
        if (q.kind === "missing") s = tapEmpty(board, q);
        else if (!board.joined && level <= 2) s = tapItem(board, q, board.items[0].id);
        else if (level === 4) {
          const from = bigGroup(q) === "a" ? 1 : 0;
          const src = board.items.find((it) => it.frame === from);
          s = src ? tapItem(board, q, src.id) : null;
        } else {
          const next = board.items.find((it) => !board.pre.includes(it.id) && !board.counted.includes(it.id));
          s = next ? tapItem(board, q, next.id) : null;
        }
        if (!s) break;
        board = s.board;
        if (s.say) lastSay = s.say;
      }
      if (q.kind === "missing") check(lastSay === `${q.answer}. Full!`, `${where}: child filling the ten ended on "${lastSay}"`);
      else if (level === 4) check(lastSay.startsWith("10!") && lastSay.includes(`${q.total - 10} more`), `${where}: child ended on "${lastSay}"`);
      else check(lastSay === String(q.total), `${where}: child counting ended on "${lastSay}"`);
    }
  }
}
console.log(`counting board: ${boards} demonstrations and child play-throughs run to the end`);

// ---------------------------------------------------------------------------

console.log(failures === 0
  ? `\n✓ All ${checks.toLocaleString()} checks passed.`
  : `\n✗ ${failures} of ${checks.toLocaleString()} checks FAILED.`);
process.exit(failures === 0 ? 0 : 1);
