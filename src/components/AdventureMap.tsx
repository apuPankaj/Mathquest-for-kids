import React from "react";
import { Realm, MathNode } from "@/types";
import { playToggleSound } from "@/utils/audio";

interface AdventureMapProps {
  realm: Realm;
  activeNodes: MathNode[];
  onNodeClick: (node: MathNode) => void;
  audioGuide: boolean;
}

export default function AdventureMap({
  realm,
  activeNodes,
  onNodeClick,
  audioGuide,
}: AdventureMapProps) {
  if (activeNodes.length === 0) return null;

  return (
    <section className="lg:col-span-3 bg-gradient-to-br from-[#faf6eb] to-[#f5ebd6] rounded-3xl border-6 border-[#8b5a2b] shadow-2xl relative min-h-[450px] md:min-h-[580px] flex flex-col overflow-hidden">
      {/* Map Top Header Parchment style */}
      <div className="bg-[#e9dcc3] border-b-2 border-dashed border-[#8b5a2b]/30 py-3 px-6 flex items-center justify-between font-bold text-[#5c3a21]">
        <span className="flex items-center gap-2 text-lg">
          🗺️ Adventure Map: {realm === "junior" ? "Junior Realm Meadows" : "Guardian Peaks"}
        </span>
        <span className="text-sm font-semibold opacity-75">Tap a place to play!</span>
      </div>

      {/* Canvas Viewport containing nodes */}
      <div className="flex-1 relative p-6 bg-[radial-gradient(#8b5a2b_1px,transparent_1px)] [background-size:24px_24px] opacity-95 flex items-center justify-center">
        {/* SVG connectors connecting map nodes */}
        {activeNodes.length >= 4 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <path
              d={`M ${activeNodes[0].x}% ${activeNodes[0].y}% 
                  Q ${(activeNodes[0].x + activeNodes[1].x) / 2}% ${(activeNodes[0].y + activeNodes[1].y) / 2 - 10}% 
                    ${activeNodes[1].x}% ${activeNodes[1].y}% 
                  T ${activeNodes[2].x}% ${activeNodes[2].y}% 
                  T ${activeNodes[3].x}% ${activeNodes[3].y}%`}
              fill="none"
              stroke="#d97706"
              strokeWidth="6"
              strokeDasharray="12, 10"
              className="opacity-70 animate-pulse"
            />
          </svg>
        )}

        {/* Render Nodes */}
        {activeNodes.map((node, index) => {
          const isCurrent = !node.completed && node.unlocked;
          return (
            <button
              key={node.id}
              onClick={() => {
                if (node.unlocked) {
                  if (audioGuide) playToggleSound();
                  onNodeClick(node);
                } else {
                  // Locked visual/audio feedback: low warning tone
                  if (audioGuide) {
                    try {
                      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                      const osc = ctx.createOscillator();
                      const gainNode = ctx.createGain();
                      osc.type = "sawtooth";
                      osc.frequency.setValueAtTime(100, ctx.currentTime);
                      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
                      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
                      osc.connect(gainNode);
                      gainNode.connect(ctx.destination);
                      osc.start();
                      osc.stop(ctx.currentTime + 0.15);
                    } catch (e) {}
                  }
                }
              }}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-all duration-300 ${
                node.unlocked
                  ? "cursor-pointer hover:scale-110 active:scale-95"
                  : "cursor-not-allowed opacity-40"
              }`}
            >
              {/* Node Orb with customized thematic styling */}
              <div className="relative">
                {/* Glowing highlight for active next step node */}
                {isCurrent && (
                  <div className="absolute -inset-3 bg-amber-400 rounded-full animate-ping opacity-60"></div>
                )}

                {/* Node Core Shape */}
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 flex items-center justify-center text-2xl sm:text-3xl shadow-lg transition-colors ${
                    node.completed
                      ? "bg-emerald-500 border-emerald-700 text-white shadow-emerald-200/50"
                      : node.unlocked
                        ? isCurrent
                          ? "bg-amber-400 border-amber-600 text-amber-950 shadow-amber-300/60"
                          : "bg-sky-400 border-sky-600 text-white shadow-sky-200/50"
                        : "bg-slate-400 border-slate-600 text-slate-700"
                  }`}
                >
                  {node.completed ? "✓" : index + 1}
                </div>

                {/* Miniature visual hint of operation type */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-[#8b5a2b] flex items-center justify-center text-xs font-bold text-[#8b5a2b] shadow-xs">
                  {node.mathType === "addition" && "+"}
                  {node.mathType === "subtraction" && "-"}
                  {node.mathType === "multiplication" && "×"}
                  {node.mathType === "division" && "÷"}
                </div>
              </div>

              {/* Title Sign above/below node */}
              <div className="mt-2 bg-[#fdfaf3] border-2 border-[#8b5a2b] px-3 py-1 rounded-lg shadow-sm text-center">
                <span className="block text-xs font-extrabold text-[#5c3a21] whitespace-nowrap">
                  {node.title}
                </span>
                <span className="block text-[9px] text-[#b45309] font-bold">
                  {node.completed
                    ? "Cleared"
                    : node.unlocked
                      ? (node.caption ?? node.questions[0]?.problem)
                      : "Locked 🔒"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
