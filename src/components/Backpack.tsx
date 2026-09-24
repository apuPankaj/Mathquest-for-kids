import React from "react";
import { Realm, InventoryItem } from "@/types";
import { playToggleSound } from "@/utils/audio";
import { assetPath } from "@/utils/assetPath";

interface BackpackProps {
  realm: Realm;
  inventory: InventoryItem[];
  handleEquipItem: (item: InventoryItem) => void;
  selectedItem: InventoryItem | null;
  setSelectedItem: (item: InventoryItem | null) => void;
  audioGuide: boolean;
}

export default function Backpack({
  realm,
  inventory,
  handleEquipItem,
  selectedItem,
  setSelectedItem,
  audioGuide,
}: BackpackProps) {
  const itemPositionMap: Record<string, string> = {
    quill: "absolute -right-3 top-2 text-3xl rotate-12 z-30 select-none",
    compass: "absolute -right-4 bottom-2 text-3xl z-30 select-none",
    abacus: "absolute -left-4 top-2 text-3xl z-30 select-none",
    shield: "absolute -left-4 bottom-2 text-3xl z-30 animate-pulse select-none",
    focus_orb: "absolute -top-4 text-3xl z-30 animate-bounce select-none [animation-duration:2.5s]",
    cape: "absolute -bottom-2 text-5xl z-30 animate-bounce select-none [animation-duration:3s]",
  };

  return (
    <section className="bg-gradient-to-b from-[#f5ebd6] to-[#e6d9bd] rounded-3xl border-6 border-[#8b5a2b] shadow-xl p-5 flex flex-col min-h-[450px]">
      {/* Header */}
      <div className="border-b-2 border-dashed border-[#8b5a2b]/30 pb-3 mb-4 text-center">
        <span className="text-2xl">🎒</span>
        <h2 className="text-xl font-bold text-[#5c3a21] mt-1">Hero's Backpack</h2>
        <p className="text-[10px] text-amber-800 font-semibold uppercase tracking-wider">
          Gear up for quests
        </p>
      </div>

      {/* Mascot Avatar Dressing Room */}
      <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-amber-50/50 to-amber-100/50 rounded-2xl border-2 border-[#8b5a2b]/20 mb-4 p-4 flex flex-col items-center justify-center overflow-hidden shadow-inner group">
        {/* Soft glowing radial background */}
        <div className="absolute w-28 h-28 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.25)_0%,transparent_70%)] animate-pulse"></div>

        {/* Floating character frame */}
        <div className="relative flex items-center justify-center w-24 h-24 bg-white/40 backdrop-blur-xs rounded-full border-2 border-white/60 shadow-md">
          {/* Mascot Representation */}
          {realm === "junior" ? (
            <img
              src={assetPath("/images/red_panda.png")}
              alt="Addie the Red Panda"
              className="w-18 h-18 object-cover rounded-full relative z-20 transition-transform duration-300 group-hover:scale-110 select-none pointer-events-none"
            />
          ) : (
            <span className="text-6xl relative z-20 transition-transform duration-300 group-hover:scale-110 select-none">
              🐙
            </span>
          )}

          {/* Programmatic Equipped Items Overlay */}
          {inventory
            .filter((item) => item.equipped)
            .map((item) => {
              const positionClass = itemPositionMap[item.id] || "absolute -top-2 text-3xl z-30 select-none";
              return (
                <span key={item.id} className={positionClass}>
                  {item.icon}
                </span>
              );
            })}
        </div>

        {/* Mascot Name and Role */}
        <div className="mt-3 text-center z-10">
          <div className="font-extrabold text-[#5c3a21] text-sm leading-none">
            {realm === "junior" ? "Addie" : "Multi"}
          </div>
          <div className="text-[10px] text-amber-800 font-bold tracking-wider mt-0.5">
            {realm === "junior" ? "Red Panda Companion" : "Octopus Scholar"}
          </div>
        </div>
      </div>

      {/* Grid of Slots */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {inventory.map((item) => {
          let borderClass = "border-[#8b5a2b]/20";
          if (item.equipped) {
            borderClass = "border-emerald-500 shadow-md ring-2 ring-emerald-300";
          } else if (selectedItem?.id === item.id) {
            borderClass = "border-amber-500 shadow-sm";
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                if (audioGuide) playToggleSound();
                setSelectedItem(item);
              }}
              className={`aspect-square bg-[#fcfaf5] rounded-xl border-3 ${borderClass} flex items-center justify-center text-3xl transition-transform hover:scale-105 active:scale-95`}
            >
              {item.icon}
            </button>
          );
        })}
      </div>

      {/* Selected Item Details Parchment Card */}
      <div className="flex-1 bg-[#fdfdfc] rounded-2xl p-3 border border-[#8b5a2b]/20 flex flex-col justify-between text-xs min-h-[120px]">
        {selectedItem ? (
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-extrabold text-[#5c3a21] text-sm flex items-center gap-1">
                  {selectedItem.icon} {selectedItem.name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    selectedItem.rarity === "epic"
                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                      : selectedItem.rarity === "rare"
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {selectedItem.rarity}
                </span>
              </div>
              <p className="text-slate-600 font-medium mb-2 leading-relaxed">
                {selectedItem.description}
              </p>
            </div>

            <div className="flex gap-2 items-center">
              <button
                onClick={() => handleEquipItem(selectedItem)}
                className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-center transition-all ${
                  selectedItem.equipped
                    ? "bg-rose-500 text-white hover:bg-rose-600"
                    : "bg-emerald-500 text-white hover:bg-emerald-600"
                }`}
              >
                {selectedItem.equipped ? "Unequip" : "Equip"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-6 text-center">
            <span className="text-3xl mb-1">🎒</span>
            <span>Select any item in your backpack to view details and equip!</span>
          </div>
        )}
      </div>
    </section>
  );
}
