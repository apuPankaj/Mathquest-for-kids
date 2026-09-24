// The four addition places on the Junior map, in the order a child meets them.
// Each one teaches one level (see LEVELS in questions.ts). x and y are the
// place's position on the map, as percentages.

import type { Level } from "./core.ts";

export interface AdditionPlace {
  id: string;
  title: string;
  level: Level;
  x: number;
  y: number;
}

export const ADDITION_PLACES: AdditionPlace[] = [
  { id: "j1", title: "Pebble Meadows", level: 1, x: 15, y: 75 },
  { id: "j2", title: "Whispering Vines", level: 2, x: 40, y: 55 },
  { id: "j3", title: "Solar Orchid", level: 3, x: 60, y: 30 },
  { id: "j4", title: "Numeria Gate", level: 4, x: 85, y: 20 },
];
