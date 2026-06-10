import React, { useState, useEffect } from "react";
import { Realm, MathNode } from "@/types";
import { playSuccessSound, playToggleSound } from "@/utils/audio";

interface BattleArenaProps {
  quest: MathNode | null;
  onFlee: () => void;
  realm: Realm;
  answerInput: string;
  setAnswerInput: (input: string) => void;
  handleAnswerSelect: (option: string, currentQuestionIndex: number, advanceQuestion: () => void) => void;
  questSuccess: boolean;
  questError: boolean;
  audioGuide: boolean;
}

export default function BattleArena({
  quest,
  onFlee,
  realm,
  answerInput,
  setAnswerInput,
  handleAnswerSelect,
  questSuccess,
  questError,
  audioGuide,
}: BattleArenaProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // When quest changes (e.g. entering a new node), reset question index
  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [quest]);

  // Fire playSuccessSound() when questSuccess triggers
  useEffect(() => {
    if (questSuccess && audioGuide) {
      playSuccessSound();
    }
  }, [questSuccess, audioGuide]);

  if (!quest) return null;

  const currentQuestion = quest.questions[currentQuestionIndex];
  if (!currentQuestion) return null;

  return (
    <div className="w-full h-full lg:col-span-4 rounded-3xl overflow-hidden border-4 border-amber-500/30 bg-[#064e3b] shadow-2xl p-6 relative min-h-[550px] animate-fade-in-up text-amber-50">
      {/* Decorative Arena Sparkle elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,rgba(245,158,11,0.15)_0%,transparent_70%)] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[radial-gradient(circle,rgba(16,185,129,0.15)_0%,transparent_70%)] pointer-events-none"></div>

      {/* Escape Hatch Flee Button */}
      <button
        onClick={onFlee}
        className="absolute top-4 left-4 z-30 px-3.5 py-2 bg-[#059669] hover:bg-[#10b981] text-white font-extrabold text-xs rounded-xl border-b-4 border-[#047857] hover:border-b-4 hover:border-[#059669] active:border-b-0 active:translate-y-1 transition-all shadow-md flex items-center gap-1.5"
      >
        🏳️ Flee
      </button>

      {/* Grid container spanning the full dimensions split vertically 30/40/30 */}
      <div className="w-full h-full grid grid-rows-[3fr_4fr_3fr] gap-4">
        
        {/* Zone 1: The Narrative Stage (Top 30%) */}
        <div className="relative w-full h-full bg-gradient-to-b from-[#0f4d3a] to-[#064e3b] rounded-2xl flex flex-col justify-between p-4 border border-emerald-800/40">
          {/* Header Progress & Title inside Zone 1 */}
          <div className="flex items-center justify-between w-full pl-20">
            <div>
              <h2 className="text-base md:text-lg font-black text-amber-200">
                Numeria Arena: {quest.title}
              </h2>
              <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                Quest Challenge • {quest.mathType}
              </p>
            </div>
            <span className="bg-[#022c22] px-3 py-1 rounded-full text-xs font-extrabold text-emerald-200 border border-emerald-800/50">
              Eq {currentQuestionIndex + 1} of {quest.questions.length}
            </span>
          </div>

          {/* Character Animation stage (align contents to bottom center) */}
          <div className="flex items-end justify-center flex-1 pb-1">
            <span className="text-[10px] font-bold tracking-[0.25em] text-amber-100/30 uppercase select-none">
              NARRATIVE STAGE
            </span>
          </div>
        </div>

        {/* Zone 2: The Visual Aid Workstation (Middle 40%) */}
        <div className="relative w-full h-full bg-[#022c22]/70 backdrop-blur-xs rounded-2xl p-5 border border-emerald-800/50 flex flex-col justify-center items-center shadow-inner">
          <span className="absolute top-2 text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider">
            {realm === "junior" ? "Concrete Helpers" : "Representational Model View"}
          </span>

          <div className="flex flex-col items-center gap-4">
            {/* Visual aid visual representations */}
            <div className="flex items-center gap-4 bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-800/40">
              <div className="flex gap-1.5">
                {currentQuestion.visuals.items1.map((item, i) => (
                  <span key={i} className="text-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                    {item}
                  </span>
                ))}
              </div>
              <span className="text-2xl font-black text-amber-400 font-fredoka">
                {currentQuestion.visuals.operator === "+" && "+"}
                {currentQuestion.visuals.operator === "-" && "-"}
                {currentQuestion.visuals.operator === "x" && "×"}
                {currentQuestion.visuals.operator === "÷" && "÷"}
              </span>
              <div className="flex gap-1.5">
                {currentQuestion.visuals.items2.map((item, i) => (
                  <span key={i} className="text-2xl animate-pulse" style={{ animationDelay: `${(i + 3) * 100}ms` }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Massive Bold Math Problem with Heavy Drop Shadow */}
            <div className="text-5xl md:text-7xl font-black font-fredoka text-amber-300 drop-shadow-[0_4px_6px_rgba(0,0,0,0.65)] select-none">
              {currentQuestion.problem} = ?
            </div>
          </div>
        </div>

        {/* Zone 3: The Input Zone (Bottom 30%) */}
        <div className="w-full h-full bg-[#021f18] rounded-2xl shadow-[inset_0_4px_6px_rgba(0,0,0,0.6)] border border-emerald-900/60 p-4 flex flex-col justify-between items-center relative">
          
          {/* Scaffold the Input Buttons: wide flex gap, tactile square buttons */}
          <div className="flex items-center justify-center gap-6 my-auto">
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                onClick={() =>
                  handleAnswerSelect(option, currentQuestionIndex, () =>
                    setCurrentQuestionIndex((prev) => prev + 1)
                  )
                }
                className={`w-16 h-16 md:w-20 md:h-20 aspect-square rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-3xl flex items-center justify-center shadow-[0_6px_0_#b45309] active:shadow-none active:translate-y-[6px] hover:scale-105 transition-all duration-150 transform`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Dynamic feedback messages & Audio instructions */}
          <div className="w-full text-center">
            <div className="h-5">
              {questError && (
                <span className="text-rose-400 font-black text-xs animate-pulse">
                  ❌ Keep going! Zero penalty - try another number!
                </span>
              )}
              {questSuccess && (
                <span className="text-emerald-400 font-black text-xs">
                  ✨ Incredible! Correct logic calculated!
                </span>
              )}
              {!questError && !questSuccess && audioGuide && (
                <span className="text-sky-200/80 font-bold text-[9px] uppercase tracking-wider">
                  🧚 Hint: count the visual objects!
                </span>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
