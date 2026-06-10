import React, { useEffect, useState } from "react";
import { Realm, MathNode } from "@/types";
import { playSuccessSound, playToggleSound } from "@/utils/audio";

interface QuestModalProps {
  selectedNode: MathNode;
  setSelectedNode: (node: MathNode | null) => void;
  realm: Realm;
  answerInput: string;
  setAnswerInput: (input: string) => void;
  handleAnswerSelect: (option: string, currentQuestionIndex: number, advanceQuestion: () => void) => void;
  questSuccess: boolean;
  questError: boolean;
  audioGuide: boolean;
}

export default function QuestModal({
  selectedNode,
  setSelectedNode,
  realm,
  answerInput,
  setAnswerInput,
  handleAnswerSelect,
  questSuccess,
  questError,
  audioGuide,
}: QuestModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const currentQuestion = selectedNode.questions[currentQuestionIndex];

  // Fire playSuccessSound() when questSuccess triggers
  useEffect(() => {
    if (questSuccess && audioGuide) {
      playSuccessSound();
    }
  }, [questSuccess, audioGuide]);

  const handleClose = () => {
    if (audioGuide) {
      playToggleSound();
    }
    setSelectedNode(null);
    setAnswerInput("");
  };

  if (!currentQuestion) return null;

  return (
    <div className="absolute inset-0 bg-[#3f2a1b]/60 backdrop-blur-xs flex items-center justify-center p-4 z-20">
      <div className="w-full max-w-lg bg-gradient-to-br from-[#faf6eb] to-[#f4e2c6] border-6 border-[#8b5a2b] rounded-3xl shadow-2xl p-5 md:p-7 relative animate-fade-in-up max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-50 w-10 h-10 rounded-full bg-amber-500 border-4 border-amber-700 text-amber-950 font-black text-lg flex items-center justify-center shadow-md hover:bg-amber-400 transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-4 border-b-2 border-dashed border-[#8b5a2b]/30 pb-3">
          <span className="text-amber-700 text-xs font-bold uppercase tracking-widest block">
            Level Quest: {selectedNode.mathType}
          </span>
          <span className="text-amber-600 text-xs font-semibold">
            Question {currentQuestionIndex + 1} of {selectedNode.questions.length}
          </span>
          <h3 className="text-2xl md:text-3xl font-extrabold text-[#5c3a21] mt-1">
            {selectedNode.title}
          </h3>
        </div>

        {/* Pedagogical Visual Panel (CRA Model Integration) */}
        <div className="bg-white/70 rounded-2xl p-4 border border-[#8b5a2b]/20 mb-5 text-center">
          <p className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wider">
            {realm === "junior" ? "Concrete Objects Helper" : "Representational Model View"}
          </p>
          
          {/* Concrete representation mapping */}
          <div className="flex flex-wrap items-center justify-center gap-6 min-h-[60px]">
            {/* Item Box 1 */}
            <div className="flex flex-wrap gap-1.5 max-w-[150px] justify-center bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 shadow-inner">
              {currentQuestion.visuals.items1.map((emoji, i) => (
                <span key={i} className="text-2xl animate-bounce" style={{ animationDelay: `${i*100}ms` }}>
                  {emoji}
                </span>
              ))}
            </div>

            {/* Operator */}
            <span className="text-3xl font-bold text-amber-600 font-fredoka">
              {currentQuestion.visuals.operator === "+" && "+"}
              {currentQuestion.visuals.operator === "-" && "-"}
              {currentQuestion.visuals.operator === "x" && "×"}
              {currentQuestion.visuals.operator === "÷" && "÷"}
            </span>

            {/* Item Box 2 */}
            <div className="flex flex-wrap gap-1.5 max-w-[150px] justify-center bg-sky-50 p-2.5 rounded-xl border border-sky-100 shadow-inner">
              {currentQuestion.visuals.items2.map((item, i) => (
                <span key={i} className="text-2xl animate-bounce" style={{ animationDelay: `${(i+3)*100}ms` }}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs text-amber-800 font-semibold mt-3">
            {realm === "junior" 
              ? `Count the items! How many total objects when you calculate?` 
              : `Arrange into rows or groups to solve the equation.`}
          </p>
        </div>

        {/* Question Display */}
        <div className="text-center mb-6">
          <div className="text-base text-slate-600 font-bold mb-1">What is the solution for:</div>
          <div className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight font-fredoka bg-white/40 py-2.5 rounded-xl border border-dashed border-[#8b5a2b]/20">
            {currentQuestion.problem} = ?
          </div>
        </div>

        {/* Multiple Choice Answers */}
        <div className="grid grid-cols-2 gap-3.5">
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              onClick={() => handleAnswerSelect(option, currentQuestionIndex, () => setCurrentQuestionIndex(prev => prev + 1))}
              className={`w-full py-4 px-6 rounded-2xl border-4 text-xl font-black transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                questSuccess && option === currentQuestion.answer
                  ? "bg-emerald-500 border-emerald-700 text-white shadow-lg"
                  : questError && option === answerInput
                    ? "bg-rose-500 border-rose-700 text-white animate-wiggle"
                    : "bg-[#fdfaf3] hover:bg-amber-100 border-amber-200 text-[#5c3a21] hover:border-amber-400 shadow-md"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Dynamic Feedback Text */}
        <div className="h-6 mt-4 text-center">
          {questError && (
            <span className="text-rose-600 font-bold text-sm animate-pulse">
              ❌ Keep trying! Zero penalties, you can do this!
            </span>
          )}
          {questSuccess && (
            <span className="text-emerald-600 font-bold text-sm">
              ✨ Magnificent! Math power unlocked!
            </span>
          )}
        </div>

        {/* Audio voice assistance cue */}
        {audioGuide && (
          <div className="mt-4 bg-[#f0f9ff] px-4 py-2.5 rounded-xl border border-sky-100 flex items-center gap-2">
            <span className="text-xl animate-bounce">🧚</span>
            <span className="text-xs text-sky-800 font-medium">
              {realm === "junior" 
                ? `"Solve the equation by counting the objects. Pick the numbers below!"`
                : `"Divide the crystals or multiply the gear components to restore the Solarpunk light!"`}
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
