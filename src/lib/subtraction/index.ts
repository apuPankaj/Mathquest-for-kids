// Subtraction, as the shared place screen uses it.

import type { Operation } from "../game/operation.ts";
import { LEVELS, correctText, equation, hintFor, makeQuestion, questionText, twinOf } from "./questions.ts";
import type { SubtractionQuestion } from "./questions.ts";
import { subtractionBoard } from "./board.ts";

export const SUBTRACTION: Operation<SubtractionQuestion> = {
  id: "subtraction",
  skill: (level) => LEVELS[level].skill,
  makeQuestion,
  twinOf,
  hintFor,
  questionText,
  correctText,
  equation,
  board: subtractionBoard,
};
