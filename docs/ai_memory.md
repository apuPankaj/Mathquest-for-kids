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
* **One place screen for every operation:** `src/components/game/PlaceQuest.tsx` runs any `Operation` (`src/lib/game/operation.ts`) — its question maker, hints, words, the sum's pieces and a board kit. Stages, hints, "Show me", twins and stars are therefore identical for every operation, and a fix reaches all of them. Division should plug in the same way.
* **One counting board, three layouts** (`src/components/game/CountingBoard.tsx`, shape in `src/lib/game/board.ts`): ten-frames (adding, taking away), plates of equal groups, and a grid of rows that can be turned around or broken apart (multiplying). Every thing keeps the id it was born with, so moving it (between ten-frames, or when a grid turns) animates.
* **Public files need `assetPath()`** (`src/utils/assetPath.ts`): Next.js adds `/Mathquest-for-kids` to page links but not to files in `public/`, so music and pictures 404 on GitHub Pages without it.
* **Animation gotcha:** a `motion` spring can only move between two positions. Three-position keyframes (like the taken-away "hop") need a timed transition, or it throws — and the error froze the stage banner the first time.

## 4. The trails, built September 2026
Each realm's map has trail tabs, and each realm remembers which one was showing.
The map has a switch between two trails. Place ids (`j1`…, `s1`…) are also the keys progress is saved under: **never rename one.**

**➕ Adding Meadows:** Pebble Meadows (add up to 5), Whispering Vines (count on to 10), Solar Orchid (make 10), Numeria Gate (add up to 20 by making a ten).

**➖ Taking-away River:** Firefly Falls (take away within 5), Echo Hollow (count back: take 1–3 from 6–10), Grove of Ten (take away from 10), Sunstone Bridge (back through ten: 11–18, always crossing ten).
* Each subtraction place is the partner of the addition place at the same level, and **opens only when that addition place AND the river place before it are mastered** (`isOpen()` in `src/lib/game/places.ts`).
* Taken-away things stay as faint outlines, so the whole is still visible. Taps always take the next thing in order; at Sunstone Bridge that means the loose ones first ("Back to 10!").
* Named mistakes, each with its own hint: added instead; gave the number taken away; counted the starting number when counting back (9 − 3 → 7); and at level 4, smaller-from-larger (14 − 6 → 12), the root of later borrowing trouble.
* The numbers stage says "minus"; Grove of Ten says the make-10 fact it comes from.

**✖️ Windmill Peaks (Guardian realm):** Windmill Canyons (equal groups: fill plates, "4 and 4 is 8…", with 4 + 4 + 4 under the sum), Skip-Stone Stream (skip count 2s, 5s, 10s), Ancient Generator (3s and 4s as a grid — "Turn it around" swaps rows and columns, nothing added or taken away), Sky Orchard (6s to 9s — "Break it apart" after 5 rows, find each part, add them). `a × b` always means a groups (or rows) of b.
* Open from the start — Guardian players may never have used the Junior map — then in order.
* Named mistakes: added instead (3 × 4 → 7); one group/row too many or few (→ 8, 16; at Sky Orchard, the neighbouring fact); the wrong number in each row (→ 9, 15).
* **➗ Crystal Caves** still holds the two OLD division questions (`data/mockData.ts`, run by the old `BattleArena`), deliberately kept visible until division is rebuilt. Division should become a `dividing` trail partnered with `multiplying`, as subtraction is with adding.

**In every place:**
* **Stages:** Things (emoji on ten-frames, tapped by the child) → Dots (look and think) → Numbers (typed on a number pad). 4 right first time moves up; being shown the answer twice in a row moves back. Mastering Numbers grows a garden on the map.
* **Help, not "try again":** 1st wrong answer → a hint matched to the mistake (`diagnose()`), 2nd → "Show me" demonstration, then a twin question. Stars 3 / 2 / 1.
* **Voice:** the device's built-in speech (`src/lib/speech.ts`), Indian English when available.
* **Files:** shared pieces in `src/lib/game/` (core, board, operation, mastery, places); each operation in `src/lib/addition/` or `src/lib/subtraction/` (`questions.ts`, `board.ts`, `index.ts`); screens in `src/components/game/`.
* **Check after any change:** `npm run check` (≈530,000 checks, needs Node 22.6+). Looking at a few questions on screen cannot prove the rules.

## 5. Status & Next Steps
* [x] Project environment initialized with Next.js & Tailwind CSS.
* [x] Home Dashboard Layout (v0 design integration).
* [x] Addition path, rebuilt to actually teach.
* [x] Subtraction path (the Taking-away River).
* [ ] Try both trails with 2–3 real children and fix what confuses them.
* [ ] "Compare" subtraction (how many more?) and a number line.
* [ ] Two-digit addition and subtraction with carrying and borrowing (needs a tens-and-ones picture).
* [x] Multiplication (Windmill Peaks).
* [ ] Division as a `dividing` trail (fair sharing, then grouping, then "think multiplication"), replacing the old Crystal Caves questions.
* [ ] Tall grids (8–10 rows) push the answer buttons to the bottom edge of a phone screen; worth a look after testing with children.
* [ ] Grown-up corner: what's mastered, what's tricky.
