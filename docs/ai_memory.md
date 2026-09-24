# Project Memory: MathQuest (Legends of Numeria)

## 1. Core Vision & Demographics
* **Goal:** Gamified interactive web app teaching math (Addition, Subtraction, Multiplication, Division).
* **Target Audience:** Kids aged 5–10, split into two developmental tiers:
  * **Junior Realm (Ages 5–7):** Focus on addition and subtraction using visual concrete-representational aids, intuitive layouts, audio-guided navigation, and large touch-friendly buttons.
  * **Guardian Realm (Ages 8–10):** Focus on multiplication and division using representational-abstract models, progressive challenges, and text-based hints.
* **Design Philosophy:** Solarpunk fantasy aesthetic. Vibrant, high-contrast colors, zero-punishment mechanics, micro-animations, and audio-friendly interfaces.
* **Pedagogy:** Concrete-Representational-Abstract (CRA) model (e.g., matching physical moving blocks to written equations).

## 2. Technical Stack
* **Frontend only:** Next.js (App Router), TypeScript, Tailwind CSS, `motion` for animation. Published as plain files (static export) to GitHub Pages at `/Mathquest-for-kids/`.
* **Decided September 2026: no server, no database, no Phaser.** Progress is saved in the child's own browser (`src/lib/savedGame.ts`), so no child's data is stored anywhere else. Phaser was dropped because React + `motion` handles every interaction (tapping, moving things between ten-frames) and keeps read-aloud and big touch buttons simple. Do not reintroduce either without the maintainer's say-so.

## 3. Global Architecture Rules
* **No Trackers:** zero personal data collection or external trackers. No names, no accounts. "Start again" wipes the device's progress.
* **No Real Money:** In-game currency ("Star Shards") can only be earned by solving math puzzles.
* **Teaching logic stays out of the screens:** question makers, stage rules, board actions and the unlock rule are plain TypeScript with no React (`src/lib/`), so `npm run check` can test them without a browser. Those files import each other as `./x.ts` (with the ending) so Node can load them directly.
* **One place screen for every operation:** `src/components/game/PlaceQuest.tsx` runs any `Operation` (`src/lib/game/operation.ts`) — its question maker, hints, words, the sum's pieces and a board kit. Stages, hints, "Show me", twins and stars are therefore identical for every operation, and a fix reaches all of them. All four operations run through it; the old one-question-at-a-time quiz (`BattleArena`) is gone.
* **One counting board, three layouts** (`src/components/game/CountingBoard.tsx`, shape in `src/lib/game/board.ts`): ten-frames (adding, taking away), plates of equal groups, and a grid of rows that can be turned around or broken apart (multiplying). Division adds a **basket** (`pile: true`) above either of the last two, which things are shared out of. Every thing keeps the id it was born with, so moving it (between ten-frames, out of the basket, or when a grid turns) animates.
* **The sum never wraps.** Its size comes from the screen width and its length (`PlaceQuest.tsx`): at full size "7 + 3 = 10" did not fit a 360px phone beside the 🔊 button. It keeps its usual 60px on a 390px phone. If the page padding or the button changes, change the 132px in that formula too.
* **Public files need `assetPath()`** (`src/utils/assetPath.ts`): Next.js adds `/Mathquest-for-kids` to page links but not to files in `public/`, so music and pictures 404 on GitHub Pages without it.
* **Animation gotcha:** a `motion` spring can only move between two positions. Three-position keyframes (like the taken-away "hop") need a timed transition, or it throws — and the error froze the stage banner the first time.

## 4. The trails, built September 2026
Each realm's map has trail tabs, and each realm remembers which one was showing.
The map has a switch between two trails. Place ids (`j1`…, `s1`…, `m1`…, `d1`…) are also the keys progress is saved under: **never rename one.**

**➕ Adding Meadows:** Pebble Meadows (add up to 5), Whispering Vines (count on to 10), Solar Orchid (make 10), Numeria Gate (add up to 20 by making a ten).

**➖ Taking-away River:** Firefly Falls (take away within 5), Echo Hollow (count back: take 1–3 from 6–10), Grove of Ten (take away from 10), Sunstone Bridge (back through ten: 11–18, always crossing ten).
* Each subtraction place is the partner of the addition place at the same level, and **opens only when that addition place AND the river place before it are mastered** (`isOpen()` in `src/lib/game/places.ts`).
* Taken-away things stay as faint outlines, so the whole is still visible. Taps always take the next thing in order; at Sunstone Bridge that means the loose ones first ("Back to 10!").
* Named mistakes, each with its own hint: added instead; gave the number taken away; counted the starting number when counting back (9 − 3 → 7); and at level 4, smaller-from-larger (14 − 6 → 12), the root of later borrowing trouble.
* The numbers stage says "minus"; Grove of Ten says the make-10 fact it comes from.

**✖️ Windmill Peaks (Guardian realm):** Windmill Canyons (equal groups: fill plates, "4 and 4 is 8…", with 4 + 4 + 4 under the sum), Skip-Stone Stream (skip count 2s, 5s, 10s), Ancient Generator (3s and 4s as a grid — "Turn it around" swaps rows and columns, nothing added or taken away), Sky Orchard (6s to 9s — "Break it apart" after 5 rows, find each part, add them). `a × b` always means a groups (or rows) of b.
* Open from the start — Guardian players may never have used the Junior map — then in order.
* Named mistakes: added instead (3 × 4 → 7); one group/row too many or few (→ 8, 16; at Sky Orchard, the neighbouring fact); the wrong number in each row (→ 9, 15).

**➗ Crystal Caves (Guardian realm):** Crystal Cavern (share fairly among 2–5 friends), Glowstone Grotto (make groups of 2, 5 or 10), Lantern Hall (think multiplication: deal into 3 or 4 rows, with `4 × ? = 24` under the sum), Sun-Shard Spire (6s to 9s backwards: take 5 rows at once, then one gold row at a time, with `? × 6 = 42` under the sum). Everything divides exactly; leftovers come later.
* **Both meanings of division, on purpose:** SHARING (how many each? — levels 1 and 3) and GROUPING (how many groups? — levels 2 and 4). Children who only ever share get stuck on the other one.
* Each place is the partner of the multiplying place at the same level, and **opens only when that place AND the cave before it are mastered** — the same rule as the river.
* Everything starts in the basket and is shared out of it, so the whole amount stays visible and nothing appears or disappears. Every tap does the next fair step. In the dots stage it arrives already shared out, **with no numbers showing** (they would give the answer away); "Show me" pours it back and does it again.
* Named mistakes: multiplied instead (12 ÷ 3 → 36); took away instead (→ 9); gave the number divided by (→ 3); one off; and at Sun-Shard Spire, forgot the first 5 rows (42 ÷ 6 → 2).
* The names Crystal Cavern and Sun-Shard Spire came from the old quiz, whose two leftover questions were removed with it. **Progress under those old ids (`g2`, `g4`) was never saved**, so nothing was lost.

**In every place:**
* **Stages:** Things (emoji on ten-frames, tapped by the child) → Dots (look and think) → Numbers (typed on a number pad). 4 right first time moves up; being shown the answer twice in a row moves back. Mastering Numbers grows a garden on the map.
* **Help, not "try again":** 1st wrong answer → a hint matched to the mistake (`diagnose()`), 2nd → "Show me" demonstration, then a twin question. Stars 3 / 2 / 1.
* **Voice:** the device's built-in speech (`src/lib/speech.ts`), Indian English when available.
* **Files:** shared pieces in `src/lib/game/` (core, board, operation, mastery, places); each operation in `src/lib/addition/`, `subtraction/`, `multiplication/` or `division/` (`questions.ts`, `board.ts`, `index.ts`); screens in `src/components/game/`.
* **Check after any change:** `npm run check` (≈700,000 checks, needs Node 22.6+). Looking at a few questions on screen cannot prove the rules.

## 5. Status & Next Steps
* [x] Project environment initialized with Next.js & Tailwind CSS.
* [x] Home Dashboard Layout (v0 design integration).
* [x] Addition path, rebuilt to actually teach.
* [x] Subtraction path (the Taking-away River).
* [ ] Try the trails with 2–3 real children and fix what confuses them.
* [ ] "Compare" subtraction (how many more?) and a number line.
* [ ] Two-digit addition and subtraction with carrying and borrowing (needs a tens-and-ones picture).
* [x] Multiplication (Windmill Peaks).
* [x] Division (the Crystal Caves), replacing the old quiz.
* [ ] Division with leftovers (remainders), once exact division is secure.
* [ ] Tall boards push the answer buttons below the fold on a phone: 8–10 rows, and 4–6 plates of 10 (40, 50, 60 ÷ 10, and 4–6 groups of 10 at Skip-Stone Stream). Plates of 10 stack one per line on a 390px phone. Worth a look after testing with children.
* [ ] Grown-up corner: what's mastered, what's tricky.
