// The child's progress, saved in this browser on this device — and nowhere
// else. No names, no accounts, nothing sent to any server. Clearing the
// browser's data, or the "Start again" button, wipes it.
//
// Browser storage can be missing or can refuse to work (private windows,
// blocked site data, some school computers). Every read and write is wrapped
// so the game simply forgets between visits in those cases, rather than
// breaking.
//
// React reads it through useSavedGame(). It is set up as a tiny "store" that
// React subscribes to (useSyncExternalStore), which also keeps two open tabs
// in step with each other.

import { useSyncExternalStore } from "react";
import { PlaceProgress, STAGES, freshProgress } from "./addition/mastery";

export interface SavedGame {
  version: 1;
  starShards: number;
  places: Record<string, PlaceProgress>; // by place id, e.g. "j1"
}

const KEY = "mathquest:v1";
const EMPTY: SavedGame = { version: 1, starShards: 0, places: {} };

const count = (n: unknown): number => (typeof n === "number" && Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0);

// Whatever is in storage came from an older version, another tab or a curious
// grown-up with the developer tools open, so it is checked field by field.
// Anything unrecognisable is replaced with a fresh start for that place.
function clean(raw: unknown): SavedGame {
  if (!raw || typeof raw !== "object") return EMPTY;
  const r = raw as Record<string, unknown>;
  const places: Record<string, PlaceProgress> = {};
  if (r.places && typeof r.places === "object") {
    for (const [id, value] of Object.entries(r.places as Record<string, unknown>)) {
      const p = (value ?? {}) as Record<string, unknown>;
      const fresh = freshProgress();
      places[id] = {
        stage: STAGES.includes(p.stage as PlaceProgress["stage"]) ? (p.stage as PlaceProgress["stage"]) : fresh.stage,
        mastered: p.mastered === true,
        streak: count(p.streak),
        struggles: count(p.struggles),
        stars: count(p.stars),
      };
    }
  }
  return { version: 1, starShards: count(r.starShards), places };
}

function read(): SavedGame {
  try {
    const text = window.localStorage.getItem(KEY);
    return text ? clean(JSON.parse(text)) : EMPTY;
  } catch {
    return EMPTY;
  }
}

let cache: SavedGame | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function getSnapshot(): SavedGame {
  if (cache === null) cache = read();
  return cache;
}

// While the page is being built ahead of time there is no browser, and so
// no saved game — every visitor's first paint is the fresh one.
function getServerSnapshot(): SavedGame {
  return EMPTY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onOtherTab = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = read();
      notify();
    }
  };
  window.addEventListener("storage", onOtherTab);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onOtherTab);
  };
}

export function useSavedGame(): SavedGame {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function updateGame(change: (game: SavedGame) => SavedGame): void {
  cache = change(getSnapshot());
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage refused: progress lasts for this visit only.
  }
  notify();
}

export function startAgain(): void {
  cache = EMPTY;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // nothing saved to remove
  }
  notify();
}

export function progressOf(game: SavedGame, placeId: string): PlaceProgress {
  return game.places[placeId] ?? freshProgress();
}
