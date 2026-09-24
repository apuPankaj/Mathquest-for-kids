import React, { useState } from "react";
import { PLACES, TRAILS, Trail, isOpen, placesOn } from "@/lib/game/places";
import { ADDITION } from "@/lib/addition";
import { SUBTRACTION } from "@/lib/subtraction";
import { SavedGame, progressOf, startAgain } from "@/lib/savedGame";

// The side panel beside the map: what the child has grown so far, and the
// grown-ups' "Start again" button. (It replaces the backpack, whose items
// didn't do anything yet.)

const STAGE_ICON = { objects: "🥭", pictures: "🟢", numbers: "🔢" } as const;
const SKILL: Record<Trail, (level: 1 | 2 | 3 | 4) => string> = { adding: ADDITION.skill, subtracting: SUBTRACTION.skill };

export default function GardenPanel({ game }: { game: SavedGame }) {
  const [confirming, setConfirming] = useState(false);
  const isMastered = (id: string) => progressOf(game, id).mastered;
  const grown = PLACES.filter((p) => isMastered(p.id)).length;

  return (
    <section className="bg-gradient-to-b from-[#f5ebd6] to-[#e6d9bd] rounded-3xl border-6 border-[#8b5a2b] shadow-xl p-5 flex flex-col">
      <div className="border-b-2 border-dashed border-[#8b5a2b]/30 pb-3 mb-4 text-center">
        <span className="text-3xl">{"🌳".repeat(grown) || "🌱"}</span>
        <h2 className="text-xl font-bold text-[#5c3a21] mt-1">Your Garden</h2>
        <p className="text-xs text-amber-800 font-semibold">
          {grown === 0 ? "Master a place to grow a tree!" : `${grown} of ${PLACES.length} trees grown`}
        </p>
      </div>

      {(Object.keys(TRAILS) as Trail[]).map((trail) => (
        <div key={trail} className="mb-3">
          <h3 className="text-xs font-extrabold text-[#8b5a2b] uppercase tracking-wider mb-1.5">
            {TRAILS[trail].sign} {TRAILS[trail].name}
          </h3>
          <ul className="flex flex-col gap-2">
            {placesOn(trail).map((place) => {
              const p = progressOf(game, place.id);
              const open = isOpen(place, isMastered);
              return (
                <li
                  key={place.id}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2 border-2 ${
                    p.mastered ? "bg-emerald-100 border-emerald-400" : open ? "bg-white/70 border-amber-300" : "bg-white/30 border-transparent opacity-60"
                  }`}
                >
                  <span className="text-2xl w-8 text-center">{p.mastered ? "🌳" : open ? STAGE_ICON[p.stage] : "🔒"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-[#5c3a21] text-sm truncate">{place.title}</div>
                    <div className="text-[11px] text-amber-800 font-semibold">{SKILL[trail](place.level)}</div>
                  </div>
                  {p.stars > 0 && <span className="text-xs font-black text-amber-700 whitespace-nowrap">⭐ {p.stars}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {/* For grown-ups */}
      <div className="mt-auto pt-5 text-center">
        <p className="text-[11px] text-[#8b5a2b] mb-2">Progress is saved on this device only.</p>
        {confirming ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-rose-800">Clear all progress on this device?</p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => {
                  startAgain();
                  setConfirming(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500 text-white text-sm font-bold"
              >
                Yes, start again
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="px-3 py-1.5 rounded-xl bg-white text-[#5c3a21] text-sm font-bold border border-[#8b5a2b]/40">
                No
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-xs font-bold text-[#8b5a2b] underline underline-offset-2"
          >
            Start again (for a new player)
          </button>
        )}
      </div>
    </section>
  );
}
