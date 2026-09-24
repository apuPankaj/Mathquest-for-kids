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
* **Teaching logic stays out of the screens:** the question maker, the stage rules and the counting-board actions are plain TypeScript with no React (`src/lib/addition/`), so `npm run check:addition` can test them without a browser.
* **Public files need `assetPath()`** (`src/utils/assetPath.ts`): Next.js adds `/Mathquest-for-kids` to page links but not to files in `public/`, so music and pictures 404 on GitHub Pages without it.

## 4. The addition path (Junior Realm) — built September 2026
Four places, one skill each: Pebble Meadows (add up to 5), Whispering Vines (count on to 10), Solar Orchid (make 10), Numeria Gate (add up to 20 by making a ten).
* **Stages in every place:** Things (emoji on ten-frames, tapped by the child) → Dots (look and think) → Numbers (typed on a number pad). 4 right first time moves up; being shown the answer twice in a row moves back. Mastering Numbers grows a garden on the map and opens the next place.
* **Help, not "try again":** 1st wrong answer → a hint matched to the mistake (`diagnose()`), 2nd → "Show me" demonstration, then a twin question. Stars 3 / 2 / 1.
* **Voice:** the device's built-in speech (`src/lib/speech.ts`), Indian English when available.
* **Files:** `src/lib/addition/questions.ts` (question maker, hints, words), `mastery.ts` (stage rules), `board.ts` (what each tap does), `places.ts`; screens in `src/components/addition/`.
* **Check after any change:** `npm run check:addition` (≈185,000 checks, needs Node 22.6+). Looking at a few questions on screen cannot prove the rules.

## 5. Status & Next Steps
* [x] Project environment initialized with Next.js & Tailwind CSS.
* [x] Home Dashboard Layout (v0 design integration).
* [x] Addition path, rebuilt to actually teach (see section 4).
* [ ] Try the addition path with 2–3 real children and fix what confuses them.
* [ ] Subtraction path (Junior) — the old subtraction questions were removed: they drew both numbers side by side, which looks like adding.
* [ ] Two-digit addition with carrying (needs a tens-and-ones picture).
* [ ] Rebuild multiplication and division (Guardian Realm is still the old quiz, unchanged).
* [ ] Grown-up corner: what's mastered, what's tricky.
