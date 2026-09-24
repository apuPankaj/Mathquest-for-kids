"use client";

import React, { useState, useEffect, useRef } from "react";
import { Realm, MathNode, InventoryItem } from "@/types";
import { initialInventory, initialGuardianNodes } from "@/data/mockData";
import Header from "@/components/Header";
import AdventureMap from "@/components/AdventureMap";
import BattleArena from "@/components/BattleArena";
import Backpack from "@/components/Backpack";
import AdditionQuest from "@/components/addition/AdditionQuest";
import { ADDITION_PLACES, AdditionPlace } from "@/lib/addition/places";
import { LEVELS } from "@/lib/addition/questions";
import { PlaceProgress, freshProgress } from "@/lib/addition/mastery";
import { playToggleSound, playBackgroundMusic, stopBackgroundMusic, BackgroundMusicNodes } from "@/utils/audio";

export default function Dashboard() {
  // 1. Core State
  const [realm, setRealm] = useState<Realm>("junior");
  const [starShards, setStarShards] = useState<number>(120);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [successAnimation, setSuccessAnimation] = useState<boolean>(false);
  const [answerInput, setAnswerInput] = useState<string>("");
  const [questError, setQuestError] = useState<boolean>(false);
  const [questSuccess, setQuestSuccess] = useState<boolean>(false);
  const [musicPlaying, setMusicPlaying] = useState<boolean>(false);
  const [audioGuide, setAudioGuide] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<string>("map");
  const [activeQuest, setActiveQuest] = useState<MathNode | null>(null);

  // Background Music controller
  const musicNodesRef = useRef<BackgroundMusicNodes | null>(null);

  useEffect(() => {
    if (musicPlaying) {
      const nodes = playBackgroundMusic();
      musicNodesRef.current = nodes;
    } else {
      if (musicNodesRef.current) {
        stopBackgroundMusic(musicNodesRef.current);
        musicNodesRef.current = null;
      }
    }

    return () => {
      if (musicNodesRef.current) {
        stopBackgroundMusic(musicNodesRef.current);
        musicNodesRef.current = null;
      }
    };
  }, [musicPlaying]);

  // 2. Mock Inventory Data
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);

  // 4. The Junior realm is the addition path: four places, each opening when
  // the one before it is mastered.
  const [additionProgress, setAdditionProgress] = useState<Record<string, PlaceProgress>>({});
  const [activePlace, setActivePlace] = useState<AdditionPlace | null>(null);
  const progressOf = (placeId: string) => additionProgress[placeId] ?? freshProgress();
  const juniorNodes: MathNode[] = ADDITION_PLACES.map((place, i) => ({
    id: place.id,
    title: place.title,
    mathType: "addition",
    questions: [],
    reward: 0,
    unlocked: i === 0 || progressOf(ADDITION_PLACES[i - 1].id).mastered,
    completed: progressOf(place.id).mastered,
    caption: LEVELS[place.level].skill,
    x: place.x,
    y: place.y,
  }));

  // The Guardian realm (multiplication and division) is unchanged for now.
  const [guardianNodes, setGuardianNodes] = useState<MathNode[]>(initialGuardianNodes);

  // Current active nodes list based on selected realm
  const activeNodes = realm === "junior" ? juniorNodes : guardianNodes;

  // 5. Equip Item Logic
  const handleEquipItem = (item: InventoryItem) => {
    if (audioGuide) playToggleSound();
    const isEquipped = item.equipped;
    
    // Toggle equip state
    const updatedInventory = inventory.map((inv) => {
      if (inv.id === item.id) {
        return { ...inv, equipped: !isEquipped };
      }
      return inv;
    });
    setInventory(updatedInventory);
    setSelectedItem({ ...item, equipped: !isEquipped });
  };

  // 6. Handle Solve Quest
  const handleAnswerSelect = (option: string, currentQuestionIndex: number, advanceQuestion: () => void) => {
    if (!activeQuest) return;
    setAnswerInput(option);
    
    const currentQuestion = activeQuest.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    if (option === currentQuestion.answer) {
      setQuestSuccess(true);
      setQuestError(false);
      
      const isLastQuestion = currentQuestionIndex === activeQuest.questions.length - 1;

      if (isLastQuestion) {
        setSuccessAnimation(true);
        
        // Award star shards (only if not completed before, or half if completed again)
        const earnedShards = activeQuest.completed ? Math.floor(activeQuest.reward / 5) : activeQuest.reward;
        setStarShards(prev => prev + earnedShards);

        // Update Node lists to mark completed and unlock next node
        const nodeUpdater = (nodes: MathNode[]) => {
          const index = nodes.findIndex(n => n.id === activeQuest.id);
          if (index === -1) return nodes;
          
          const updated = [...nodes];
          updated[index] = { ...updated[index], completed: true };
          
          // Unlock next node in line
          if (index + 1 < updated.length) {
            updated[index + 1] = { ...updated[index + 1], unlocked: true };
          }
          return updated;
        };

        setGuardianNodes(nodeUpdater);
        
        // Play simulated reward ping
        setTimeout(() => {
          setSuccessAnimation(false);
          setQuestSuccess(false);
          setActiveQuest(null);
          setCurrentView("map");
          setAnswerInput("");
        }, 2500);
      } else {
        // If there are more questions, advance currentQuestionIndex by 1 after a short delay
        setTimeout(() => {
          advanceQuestion();
          setQuestSuccess(false);
          setAnswerInput("");
        }, 1500);
      }

    } else {
      setQuestError(true);
      setQuestSuccess(false);
      // Let kid try again (no points deducted - Zero Punishment!)
      setTimeout(() => {
        setQuestError(false);
      }, 1500);
    }
  };

  // 7. Node and Quest handlers
  const handleNodeClick = (node: MathNode) => {
    if (realm === "junior") {
      const place = ADDITION_PLACES.find((p) => p.id === node.id);
      if (place && node.unlocked) {
        setActivePlace(place);
        setCurrentView("addition");
      }
      return;
    }
    if (node.unlocked) {
      setActiveQuest(node);
      setCurrentView("arena");
    }
  };

  const handleFlee = () => {
    if (audioGuide) playToggleSound();
    setActiveQuest(null);
    setActivePlace(null);
    setCurrentView("map");
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-b from-[#e0f2fe] via-[#f0fdf4] to-[#ecfccb] text-slate-800 p-4 sm:p-6 overflow-hidden">
      
      {/* Decorative Sky Elements (Solarpunk Windmills and Soft Sun Glow) */}
      <div className="absolute top-10 left-10 opacity-15 pointer-events-none animate-pulse">
        <svg width="120" height="120" viewBox="0 0 100 100" fill="currentColor" className="text-emerald-700">
          <circle cx="50" cy="50" r="8" />
          <path d="M50 10 L50 90 M10 50 L90 50" stroke="currentColor" strokeWidth="4" />
          <path d="M50 50 L20 20 M50 50 L80 80 M50 50 L80 20 M50 50 L20 80" stroke="currentColor" strokeWidth="3" />
        </svg>
      </div>
      
      <div className="absolute right-12 top-24 opacity-10 pointer-events-none animate-spin" style={{ animationDuration: '60s' }}>
        <svg width="180" height="180" viewBox="0 0 100 100" fill="currentColor" className="text-emerald-600">
          <circle cx="50" cy="50" r="10" />
          <path d="M50 10 C55 30, 45 30, 50 50 C55 50, 65 40, 90 50 C70 55, 70 45, 50 50 C50 55, 40 65, 50 90 C45 70, 55 70, 50 50 C45 50, 35 60, 10 50 C30 45, 30 55, 50 50 Z" />
        </svg>
      </div>

      {/* Floating Sparkles for Star Shards */}
      {successAnimation && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-emerald-950/20 backdrop-blur-xs">
          <div className="text-center p-8 bg-white/95 rounded-3xl shadow-2xl border-4 border-amber-400 max-w-sm animate-bounce">
            <span className="text-6xl block mb-2">🎉 ✦ 🌟</span>
            <h3 className="text-3xl font-bold text-emerald-800">Spectacular!</h3>
            <p className="text-lg text-slate-600 mt-2 font-medium">Correct Equation Answered!</p>
            <div className="text-2xl font-bold text-amber-500 mt-4 flex items-center justify-center gap-1">
              +{activeQuest?.reward} Star Shards ✦
            </div>
            <p className="text-xs text-emerald-600 mt-1">Lush Numeria grows greener!</p>
          </div>
        </div>
      )}

      {/* Playful wooden signpost navbar */}
      <Header
        realm={realm}
        setRealm={setRealm}
        starShards={starShards}
        musicPlaying={musicPlaying}
        setMusicPlaying={setMusicPlaying}
        audioGuide={audioGuide}
        setAudioGuide={setAudioGuide}
        setSelectedNode={handleFlee}
      />

      {/* Main Layout Grid */}
      <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 z-10 items-stretch">
        {currentView === 'map' ? (
          <>
            {/* Left Side Viewport: Adventure Map (75% on desktop / Col span 3) */}
            <AdventureMap
              realm={realm}
              activeNodes={activeNodes}
              onNodeClick={handleNodeClick}
              audioGuide={audioGuide}
            />

            {/* Right Side Panel: Backpack / Inventory Panel (25% on desktop) */}
            <Backpack
              realm={realm}
              inventory={inventory}
              handleEquipItem={handleEquipItem}
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
              audioGuide={audioGuide}
            />
          </>
        ) : currentView === "addition" && activePlace ? (
          <AdditionQuest
            key={activePlace.id}
            place={activePlace}
            progress={progressOf(activePlace.id)}
            onProgress={(next) => setAdditionProgress((all) => ({ ...all, [activePlace.id]: next }))}
            onStars={(n) => setStarShards((s) => s + n)}
            onExit={handleFlee}
            soundOn={audioGuide}
          />
        ) : (
          <BattleArena
            quest={activeQuest}
            onFlee={handleFlee}
            realm={realm}
            answerInput={answerInput}
            setAnswerInput={setAnswerInput}
            handleAnswerSelect={handleAnswerSelect}
            questSuccess={questSuccess}
            questError={questError}
            audioGuide={audioGuide}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-7xl mx-auto mt-6 text-center text-xs text-slate-500 font-semibold py-2">
        <p>© 2026 MathQuest: Legends of Numeria. Crafted for learning & privacy (COPPA compliant). No real money required.</p>
      </footer>
    </div>
  );
}
