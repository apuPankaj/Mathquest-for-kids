# Project Memory: MathQuest (Legends of Numeria)

## 1. Core Vision & Demographics
* **Goal:** Gamified interactive web app teaching math (Addition, Subtraction, Multiplication, Division).
* **Target Audience:** Kids aged 5–10, split into two developmental tiers:
  * **Junior Realm (Ages 5–7):** Focus on addition and subtraction using visual concrete-representational aids, intuitive layouts, audio-guided navigation, and large touch-friendly buttons.
  * **Guardian Realm (Ages 8–10):** Focus on multiplication and division using representational-abstract models, progressive challenges, and text-based hints.
* **Design Philosophy:** Solarpunk fantasy aesthetic. Vibrant, high-contrast colors, zero-punishment mechanics, micro-animations, and audio-friendly interfaces.
* **Pedagogy:** Concrete-Representational-Abstract (CRA) model (e.g., matching physical moving blocks to written equations).

## 2. Technical Stack
* **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
* **Game Canvas:** Phaser.js (embedded inside React)
* **Backend:** Node.js, Express.js
* **Database:** MongoDB (Anonymized user profiles using randomly generated usernames)

## 3. Global Architecture Rules
* **No Trackers:** Strict compliance with COPPA (Children's Online Privacy Protection Act); zero personal data collection or external trackers.
* **No Real Money:** In-game currency ("Star Shards") can only be earned by solving math puzzles.
* **Component Policy:** Keep Phaser math game logic completely modular and decoupled from Next.js page UI components.

## 4. Current Status & Progress Tracking
* [x] Project environment initialized with Next.js & Tailwind CSS.
* [x] Home Dashboard Layout (v0 design integration).
* [ ] Phaser.js Canvas implementation.
* [ ] Backend API setup & Express server connection.
* [ ] Database Schema design for user profiles.

## 5. Active Task & Immediate Next Step
* Currently working on: Phaser.js Canvas implementation.
