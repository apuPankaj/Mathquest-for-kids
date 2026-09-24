import React from "react";
import { motion } from "motion/react";
import { Realm, MathNode } from "@/types";
import { playLockedSound, playToggleSound } from "@/utils/audio";

interface AdventureMapProps {
  realm: Realm;
  activeNodes: MathNode[];
  onNodeClick: (node: MathNode) => void;
  audioGuide: boolean;
}

interface Point {
  x: number;
  y: number;
}

// On a phone the map is tall and narrow, so the places zig-zag up it instead
// of running corner to corner (where the end labels fell off the screen).
function phonePosition(index: number, count: number): Point {
  const step = count > 1 ? 72 / (count - 1) : 0;
  return { x: index % 2 === 0 ? 28 : 72, y: 86 - index * step };
}

// The dotted trail between places: one gentle bend per stretch, bending
// alternately left and right. Drawn in a 100 × 100 box stretched over the
// map, so plain numbers act as percentages. (SVG paths don't accept "%",
// which is why the old trail never appeared at all.)
function trail(points: Point[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const bend = (i % 2 === 0 ? 1 : -1) * 6;
    const cx = (a.x + b.x) / 2 + (-(b.y - a.y) / len) * bend;
    const cy = (a.y + b.y) / 2 + ((b.x - a.x) / len) * bend;
    d += ` Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x} ${b.y}`;
  }
  return d;
}

// What grows around a mastered place.
const GARDEN = [
  { emoji: "🌳", x: -50, y: -22, size: "text-3xl" },
  { emoji: "🌷", x: 44, y: -30, size: "text-2xl" },
  { emoji: "🌻", x: -44, y: 24, size: "text-2xl" },
  { emoji: "🌿", x: 48, y: 18, size: "text-2xl" },
];

export default function AdventureMap({
  realm,
  activeNodes,
  onNodeClick,
  audioGuide,
}: AdventureMapProps) {
  if (activeNodes.length === 0) return null;

  const grown = activeNodes.filter((n) => n.completed).length / activeNodes.length;
  const desktopTrail = trail(activeNodes.map((n) => ({ x: n.x, y: n.y })));
  const phoneTrail = trail(activeNodes.map((_, i) => phonePosition(i, activeNodes.length)));

  return (
    <section className="lg:col-span-3 bg-gradient-to-br from-[#faf6eb] to-[#f5ebd6] rounded-3xl border-6 border-[#8b5a2b] shadow-2xl relative min-h-[620px] md:min-h-[580px] flex flex-col overflow-hidden">
      {/* Map Top Header Parchment style */}
      <div className="bg-[#e9dcc3] border-b-2 border-dashed border-[#8b5a2b]/30 py-3 px-6 flex items-center justify-between font-bold text-[#5c3a21]">
        <span className="flex items-center gap-2 text-lg">
          🗺️ Adventure Map: {realm === "junior" ? "Junior Realm Meadows" : "Guardian Peaks"}
        </span>
        <span className="text-sm font-semibold opacity-75">Tap a place to play!</span>
      </div>

      {/* Canvas Viewport containing nodes */}
      <div className="flex-1 relative p-6 bg-[radial-gradient(#8b5a2b_1px,transparent_1px)] [background-size:24px_24px] opacity-95 flex items-center justify-center">
        {/* Numeria turns green as places are mastered */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-1000 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.55),rgba(132,204,22,0.25)_60%,transparent_85%)]"
          style={{ opacity: grown }}
        />

        {/* The trail connecting the places */}
        {[
          { d: desktopTrail, className: "hidden md:block" },
          { d: phoneTrail, className: "md:hidden" },
        ].map(({ d, className }) => (
          <svg
            key={className}
            className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d={d}
              fill="none"
              stroke="#d97706"
              strokeWidth="6"
              strokeDasharray="12 10"
              vectorEffect="non-scaling-stroke"
              className="opacity-60"
            />
          </svg>
        ))}

        {/* Render Nodes */}
        {activeNodes.map((node, index) => {
          const isCurrent = !node.completed && node.unlocked;
          const phone = phonePosition(index, activeNodes.length);
          const position = {
            "--x": `${node.x}%`,
            "--y": `${node.y}%`,
            "--px": `${phone.x}%`,
            "--py": `${phone.y}%`,
          } as React.CSSProperties;
          return (
            <button
              key={node.id}
              onClick={() => {
                if (node.unlocked) {
                  if (audioGuide) playToggleSound();
                  onNodeClick(node);
                } else if (audioGuide) {
                  playLockedSound();
                }
              }}
              style={position}
              className={`absolute left-[var(--px)] top-[var(--py)] md:left-[var(--x)] md:top-[var(--y)] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-all duration-300 ${
                node.unlocked
                  ? "cursor-pointer hover:scale-110 active:scale-95"
                  : "cursor-not-allowed opacity-40"
              }`}
            >
              {/* Node Orb with customized thematic styling */}
              <div className="relative">
                {/* A little garden grows around every mastered place */}
                {node.completed &&
                  GARDEN.map((g, i) => (
                    <motion.span
                      key={g.emoji}
                      aria-hidden
                      initial={{ scale: 0, x: g.x, y: g.y }}
                      animate={{ scale: 1, x: g.x, y: g.y }}
                      transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.15 * i }}
                      className={`absolute left-1/2 top-1/2 -ml-4 -mt-4 pointer-events-none select-none ${g.size}`}
                    >
                      {g.emoji}
                    </motion.span>
                  ))}

                {/* Glowing highlight for active next step node */}
                {isCurrent && (
                  <div className="absolute -inset-3 bg-amber-400 rounded-full animate-ping opacity-60"></div>
                )}

                {/* Node Core Shape */}
                <div
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 flex items-center justify-center text-2xl sm:text-3xl shadow-lg transition-colors ${
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
                    ? "Grown! 🌳"
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
