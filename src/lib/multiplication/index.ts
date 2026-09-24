// Multiplication, as the shared place screen uses it.

import type { Operation } from "../game/operation.ts";
import { LEVELS, correctText, equation, hintFor, makeQuestion, questionText, subline, twinOf } from "./questions.ts";
import type { MultiplicationQuestion } from "./questions.ts";
import { multiplicationBoard } from "./board.ts";

export const MULTIPLICATION: Operation<MultiplicationQuestion> = {
  id: "multiplication",
  skill: (level) => LEVELS[level].skill,
  makeQuestion,
  twinOf,
  hintFor,
  questionText,
  correctText,
  equation,
  subline,
  board: multiplicationBoard,
};
