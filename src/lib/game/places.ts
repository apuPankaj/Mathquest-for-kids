// The places on the Junior map, trail by trail, in the order a child meets
// them. Each place teaches one level of its operation. x and y are the
// place's position on the wide (desktop) map, as percentages; on phones the
// map lays them out itself (components/AdventureMap.tsx).

import type { Level } from "./core.ts";

export type Trail = "adding" | "subtracting";

export const TRAILS: Record<Trail, { name: string; sign: string }> = {
  adding: { name: "Adding Meadows", sign: "➕" },
  subtracting: { name: "Taking-away River", sign: "➖" },
};

export interface Place {
  id: string; // also the key progress is saved under — never rename one
  title: string;
  trail: Trail;
  level: Level;
  x: number;
  y: number;
}

export const PLACES: Place[] = [
  { id: "j1", title: "Pebble Meadows", trail: "adding", level: 1, x: 15, y: 75 },
  { id: "j2", title: "Whispering Vines", trail: "adding", level: 2, x: 40, y: 55 },
  { id: "j3", title: "Solar Orchid", trail: "adding", level: 3, x: 60, y: 30 },
  { id: "j4", title: "Numeria Gate", trail: "adding", level: 4, x: 85, y: 20 },
  // The river runs downhill, the other way to the meadows.
  { id: "s1", title: "Firefly Falls", trail: "subtracting", level: 1, x: 15, y: 25 },
  { id: "s2", title: "Echo Hollow", trail: "subtracting", level: 2, x: 38, y: 42 },
  { id: "s3", title: "Grove of Ten", trail: "subtracting", level: 3, x: 62, y: 58 },
  { id: "s4", title: "Sunstone Bridge", trail: "subtracting", level: 4, x: 85, y: 75 },
];

export function placesOn(trail: Trail): Place[] {
  return PLACES.filter((p) => p.trail === trail);
}

// The addition place a subtraction place builds on: the one at the same level.
export function partnerOf(place: Place): Place | null {
  if (place.trail !== "subtracting") return null;
  return placesOn("adding").find((p) => p.level === place.level) ?? null;
}

// When a place opens:
//   - the first place on a trail, or once the place before it is mastered;
//   - AND, on the subtraction trail, once its addition partner is mastered —
//     "10 take away 3" waits until "7 and 3 make 10" is known.
export function isOpen(place: Place, isMastered: (id: string) => boolean): boolean {
  const trail = placesOn(place.trail);
  const i = trail.findIndex((p) => p.id === place.id);
  const previousDone = i <= 0 || isMastered(trail[i - 1].id);
  const partner = partnerOf(place);
  return previousDone && (partner === null || isMastered(partner.id));
}

// What a locked place says on the map, so a child (or a grown-up) knows
// what to do to open it.
export function lockedReason(place: Place, isMastered: (id: string) => boolean): string {
  const partner = partnerOf(place);
  if (partner && !isMastered(partner.id)) return `After ${partner.title}`;
  return "Locked 🔒";
}
