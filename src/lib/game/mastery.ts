// How a child moves through a place: objects → pictures → numbers → mastered.
//
// These are the rules from the plan, kept in one small file so they are easy
// to read and to change, and so `npm run check:addition` can test them:
//   - 4 right in a row on the first try  → move up a stage
//   - needing to be shown the answer twice, without getting one right on
//     their own in between               → move back a stage
//   - stars: 3 on the first try, 2 after a hint, 1 after being shown
// Like questions.ts, this imports nothing that runs, so Node can load it.

import type { Stage } from "./core.ts";

export const STAGES: Stage[] = ["objects", "pictures", "numbers"];
export const STREAK_TO_MOVE_UP = 4;
export const STRUGGLES_TO_MOVE_BACK = 2;

export interface PlaceProgress {
  stage: Stage;
  mastered: boolean; // stays true once earned, even if a replay needs help
  streak: number; // first-try right answers in a row, in this stage
  struggles: number; // times shown the answer since the last first-try right answer
  stars: number; // all stars ever earned in this place
}

export function freshProgress(): PlaceProgress {
  return { stage: "objects", mastered: false, streak: 0, struggles: 0, stars: 0 };
}

// How a question ended.
export type Outcome = "firstTry" | "afterHint" | "afterShow";

export function starsFor(outcome: Outcome): number {
  return outcome === "firstTry" ? 3 : outcome === "afterHint" ? 2 : 1;
}

// What changed, so the screen can say so.
export type ProgressEvent = "none" | "movedUp" | "mastered" | "movedBack";

export function applyOutcome(p: PlaceProgress, outcome: Outcome): { next: PlaceProgress; event: ProgressEvent } {
  const next: PlaceProgress = { ...p, stars: p.stars + starsFor(outcome) };
  const i = STAGES.indexOf(p.stage);

  if (outcome === "firstTry") {
    next.streak = p.streak + 1;
    next.struggles = 0;
    if (next.streak >= STREAK_TO_MOVE_UP) {
      next.streak = 0;
      if (i < STAGES.length - 1) {
        next.stage = STAGES[i + 1];
        return { next, event: "movedUp" };
      }
      if (!p.mastered) {
        next.mastered = true;
        return { next, event: "mastered" };
      }
    }
    return { next, event: "none" };
  }

  next.streak = 0;
  if (outcome === "afterShow") {
    next.struggles = p.struggles + 1;
    if (next.struggles >= STRUGGLES_TO_MOVE_BACK && i > 0) {
      next.stage = STAGES[i - 1];
      next.struggles = 0;
      return { next, event: "movedBack" };
    }
  }
  return { next, event: "none" };
}
