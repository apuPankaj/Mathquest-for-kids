"use client";

import React, { useState, useEffect, useRef } from "react";
import { Realm, MathNode } from "@/types";
import Header from "@/components/Header";
import AdventureMap from "@/components/AdventureMap";
import GardenPanel from "@/components/GardenPanel";
import PlaceQuest from "@/components/game/PlaceQuest";
import { PLACES, Place, TRAILS, Trail, isOpen, lockedReason, placesOn, trailsIn } from "@/lib/game/places";
import type { Operation } from "@/lib/game/operation";
import { ADDITION } from "@/lib/addition";
import { SUBTRACTION } from "@/lib/subtraction";
import { MULTIPLICATION } from "@/lib/multiplication";
import { DIVISION } from "@/lib/division";
import { progressOf, updateGame, useSavedGame } from "@/lib/savedGame";
import { playToggleSound, playBackgroundMusic, stopBackgroundMusic, BackgroundMusicNodes } from "@/utils/audio";

// Which operation runs each trail's places.
const OPERATIONS: Record<Trail, Operation> = {
  adding: ADDITION,
  subtracting: SUBTRACTION,
  multiplying: MULTIPLICATION,
  dividing: DIVISION,
};

export default function Dashboard() {
  // 1. Core State
  const [realm, setRealm] = useState<Realm>("junior");
  // Progress and star shards are saved on this device (see lib/savedGame.ts).
  const game = useSavedGame();
  const starShards = game.starShards;
  const addShards = (n: number) => updateGame((g) => ({ ...g, starShards: g.starShards + n }));
  const [musicPlaying, setMusicPlaying] = useState<boolean>(false);
  const [audioGuide, setAudioGuide] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<"map" | "place">("map");

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

  // Each realm has two trails, with a switch between them on the map: adding
  // and taking away in the Junior realm, multiplying and dividing in the
  // Guardian realm. Each realm remembers which trail was showing. Which places
  // are open is decided in lib/game/places.ts.
  const [trailOf, setTrailOf] = useState<Record<Realm, Trail>>({ junior: "adding", guardian: "multiplying" });
  const trail = trailOf[realm];
  const [activePlace, setActivePlace] = useState<Place | null>(null);
  const isMastered = (id: string) => progressOf(game, id).mastered;
  const placeNodes: MathNode[] = placesOn(trail).map((place) => ({
    id: place.id,
    title: place.title,
    mathType: OPERATIONS[place.trail].id,
    unlocked: isOpen(place, isMastered),
    completed: isMastered(place.id),
    caption: OPERATIONS[place.trail].skill(place.level),
    lockedCaption: lockedReason(place, isMastered),
    x: place.x,
    y: place.y,
  }));
  const mapTabs = trailsIn(realm).map((t) => ({ id: t, label: `${TRAILS[t].sign} ${TRAILS[t].name}` }));

  const handleNodeClick = (node: MathNode) => {
    const place = PLACES.find((p) => p.id === node.id);
    if (place && node.unlocked) {
      setActivePlace(place);
      setCurrentView("place");
    }
  };

  const handleFlee = () => {
    if (audioGuide) playToggleSound();
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
        compact={currentView !== "map"}
      />

      {/* Main Layout Grid */}
      <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 z-10 items-stretch">
        {currentView === 'map' ? (
          <>
            {/* Left Side Viewport: Adventure Map (75% on desktop / Col span 3) */}
            <AdventureMap
              title={`${realm === "junior" ? "Junior Realm" : "Guardian Peaks"}: ${TRAILS[trail].name}`}
              tabs={mapTabs.map((tab) => ({
                ...tab,
                active: tab.id === trail,
                onSelect: () => setTrailOf((all) => ({ ...all, [realm]: tab.id })),
              }))}
              activeNodes={placeNodes}
              onNodeClick={handleNodeClick}
              audioGuide={audioGuide}
            />

            {/* Right Side Panel: the garden the child has grown (25% on desktop).
                The backpack (components/Backpack.tsx) is put away for now — its
                items didn't do anything yet. */}
            <GardenPanel game={game} realm={realm} />
          </>
        ) : activePlace ? (
          <PlaceQuest
            key={activePlace.id}
            place={activePlace}
            operation={OPERATIONS[activePlace.trail]}
            progress={progressOf(game, activePlace.id)}
            onProgress={(next) => updateGame((g) => ({ ...g, places: { ...g.places, [activePlace.id]: next } }))}
            onStars={addShards}
            onExit={handleFlee}
            soundOn={audioGuide}
          />
        ) : null}
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-7xl mx-auto mt-6 text-center text-xs text-slate-500 font-semibold py-2">
        <p>© 2026 MathQuest: Legends of Numeria. Crafted for learning & privacy (COPPA compliant). No real money required.</p>
      </footer>
    </div>
  );
}
