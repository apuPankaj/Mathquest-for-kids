import React from "react";
import { Realm } from "@/types";
import { playToggleSound } from "@/utils/audio";

interface HeaderProps {
  realm: Realm;
  setRealm: (realm: Realm) => void;
  starShards: number;
  musicPlaying: boolean;
  setMusicPlaying: (playing: boolean) => void;
  audioGuide: boolean;
  setAudioGuide: (guide: boolean) => void;
  setSelectedNode: (node: null) => void;
  // While playing, the header shrinks to one slim row so the game is at the
  // top of a phone screen, and the realm switch is hidden (you are inside a
  // place, so switching realm makes no sense there).
  compact?: boolean;
}

export default function Header({
  realm,
  setRealm,
  starShards,
  musicPlaying,
  setMusicPlaying,
  audioGuide,
  setAudioGuide,
  setSelectedNode,
  compact = false,
}: HeaderProps) {
  const handleMusicClick = () => {
    if (audioGuide) {
      playToggleSound();
    }
    setMusicPlaying(!musicPlaying);
  };

  const handleAudioGuideClick = () => {
    if (audioGuide) {
      playToggleSound();
    }
    setAudioGuide(!audioGuide);
  };

  const handleRealmChange = (r: Realm) => {
    if (audioGuide) {
      playToggleSound();
    }
    setRealm(r);
    setSelectedNode(null);
  };

  return (
    <header
      className={`relative flex items-center justify-between w-full max-w-7xl mx-auto z-10 ${
        compact ? "flex-row gap-2 mb-3" : "flex-col md:flex-row mb-6"
      }`}
    >
      {/* Signpost board */}
      <div
        className={`relative bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 border-b-6 border-amber-950 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-4 ${
          compact ? "px-3 py-2 w-auto" : "px-6 py-4 w-full md:w-auto"
        }`}
      >
        <div className="hidden md:block absolute -top-5 left-12 w-2 h-6 bg-slate-600/50 rounded-full"></div>
        <div className="hidden md:block absolute -top-5 right-12 w-2 h-6 bg-slate-600/50 rounded-full"></div>
        
        <div className="flex items-center gap-3">
          <span className={compact ? "text-xl" : "text-3xl"}>🌱</span>
          <div>
            <h1
              className={`font-extrabold text-amber-50 tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] ${
                compact ? "text-lg sm:text-2xl" : "text-2xl sm:text-3xl"
              }`}
            >
              MathQuest
            </h1>
            <p className={`text-xs text-amber-200 tracking-wider font-semibold uppercase ${compact ? "hidden sm:block" : ""}`}>
              Legends of Numeria
            </p>
          </div>
        </div>
      </div>

      {/* Action Controls & Shards Box */}
      <div
        className={`flex items-center gap-2 sm:gap-3 ${
          compact ? "justify-end" : "flex-wrap justify-center mt-4 md:mt-0 w-full md:w-auto"
        }`}
      >
        {/* Audio Controls */}
        <div className={`flex gap-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-emerald-100 ${compact ? "px-2 py-1" : "px-3 py-2"}`}>
          <button 
            onClick={handleMusicClick} 
            title="Music on or off"
            aria-label="Music on or off"
            className={`p-2 rounded-xl transition-all duration-200 text-lg ${musicPlaying ? 'bg-emerald-500 text-white animate-pulse' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
          >
            🎵
          </button>
          <button 
            onClick={handleAudioGuideClick} 
            title="Voice and sounds on or off"
            aria-label="Voice and sounds on or off"
            className={`p-2 rounded-xl transition-all duration-200 text-lg ${audioGuide ? 'bg-emerald-500 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
          >
            🔊
          </button>
        </div>

        {/* Realm Selector Switch */}
        <div className={`${compact ? "hidden" : "flex"} bg-amber-100/90 backdrop-blur-md p-1.5 rounded-2xl shadow-sm items-center border border-amber-200`}>
          <button
            onClick={() => handleRealmChange("junior")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              realm === "junior"
                ? "bg-emerald-500 text-white shadow-md transform scale-105"
                : "text-slate-600 hover:text-emerald-800"
            }`}
          >
            Junior Realm <span className="block text-[10px] font-normal opacity-90">Ages 5-7</span>
          </button>
          <button
            onClick={() => handleRealmChange("guardian")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              realm === "guardian"
                ? "bg-sky-500 text-white shadow-md transform scale-105"
                : "text-slate-600 hover:text-sky-800"
            }`}
          >
            Guardian Realm <span className="block text-[10px] font-normal opacity-90">Ages 8-10</span>
          </button>
        </div>

        {/* Star Shard currency plaque */}
        <div
          className={`relative bg-gradient-to-r from-amber-400 to-amber-500 border-b-4 border-amber-600 rounded-2xl shadow-md flex items-center gap-2 transform hover:scale-105 transition-transform ${
            compact ? "px-3 py-2" : "px-5 py-3"
          }`}
        >
          <span className="text-xl animate-spin" style={{ animationDuration: '4s' }}>✦</span>
          <span className="font-extrabold text-amber-950 text-lg tracking-wide">
            {starShards} <span className={`text-amber-900 font-bold text-sm ${compact ? "hidden sm:inline" : ""}`}>Star Shards</span>
          </span>
        </div>
      </div>
    </header>
  );
}
