import { assetPath } from "./assetPath";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export function playBeep(frequency: number, type: OscillatorType, duration: number, volume: number = 0.1) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Web Audio API not supported or blocked by user gesture:", e);
  }
}

export function playSuccessSound() {
  // High-pitched double ping
  playBeep(880, "sine", 0.12, 0.15);
  setTimeout(() => {
    playBeep(1320, "sine", 0.25, 0.15);
  }, 80);
}

export function playToggleSound() {
  // Soft low pop
  playBeep(180, "triangle", 0.08, 0.12);
}

export interface BackgroundMusicNodes {
  audio: HTMLAudioElement;
}

export function playBackgroundMusic(): BackgroundMusicNodes | null {
  if (typeof window === "undefined") return null;
  try {
    const audio = new Audio(assetPath("/audio/bg_music.mp3"));
    audio.loop = true;
    audio.volume = 0.25;

    audio.play().catch((err) => {
      console.warn("Background music playback failed or blocked by user gesture:", err);
    });

    return { audio };
  } catch (e) {
    console.warn("Background music setup failed:", e);
    return null;
  }
}

export function stopBackgroundMusic(nodes: BackgroundMusicNodes | null) {
  if (!nodes || !nodes.audio) return;
  try {
    nodes.audio.pause();
    nodes.audio.currentTime = 0;
  } catch (e) {
    console.warn("Error stopping background music:", e);
  }
}
