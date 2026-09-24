// Division, as the shared place screen uses it.

import type { Operation } from "../game/operation.ts";
import { LEVELS, correctText, equation, hintFor, makeQuestion, questionText, subline, twinOf } from "./questions.ts";
import type { DivisionQuestion } from "./questions.ts";
import { divisionBoard } from "./board.ts";

export const DIVISION: Operation<DivisionQuestion> = {
  id: "division",
  skill: (level) => LEVELS[level].skill,
  makeQuestion,
  twinOf,
  hintFor,
  questionText,
  correctText,
  equation,
  subline,
  board: divisionBoard,
};
