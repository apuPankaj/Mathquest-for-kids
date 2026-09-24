// Everything the place screen needs to know about one operation. Addition
// and subtraction each provide one of these (lib/addition/index.ts,
// lib/subtraction/index.ts), and components/game/PlaceQuest.tsx runs either
// with the same stages, hints, "Show me", twins and stars — so a fix to the
// help flow reaches both at once. Multiplication and division will plug in
// the same way.

import type { EquationPart, Level, Question, Rng, Stage } from "./core.ts";
import type { BoardKit } from "./board.ts";

export interface Operation<Q extends Question = Question> {
  id: "addition" | "subtraction";
  // What a level teaches, in a few words ("Add up to 5").
  skill(level: Level): string;
  makeQuestion(level: Level, rng?: Rng, avoid?: string[]): Q;
  // A near-identical question, for after "Show me".
  twinOf(q: Q, rng?: Rng): Q;
  // What to say after a first wrong answer, matched to the mistake.
  hintFor(q: Q, given: number): string;
  // The question as the voice reads it, at this stage.
  questionText(q: Q, stage: Stage): string;
  // What to say when the answer is right.
  correctText(q: Q, rng?: Rng): string;
  // The sum on screen, piece by piece.
  equation(q: Q, solved: boolean): EquationPart[];
  // An optional small line under the sum, e.g. "4 + 4 + 4" under 3 × 4.
  subline?(q: Q, solved: boolean): string | null;
  board: BoardKit<Q>;
}
