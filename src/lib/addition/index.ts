// Addition, as the shared place screen uses it.

import type { Operation } from "../game/operation.ts";
import { LEVELS, correctText, equation, hintFor, makeQuestion, questionText, twinOf } from "./questions.ts";
import type { AdditionQuestion } from "./questions.ts";
import { additionBoard } from "./board.ts";

export const ADDITION: Operation<AdditionQuestion> = {
  id: "addition",
  skill: (level) => LEVELS[level].skill,
  makeQuestion,
  twinOf,
  hintFor,
  questionText,
  correctText,
  equation,
  board: additionBoard,
};
