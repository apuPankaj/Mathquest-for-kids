// Reading aloud, using the voice already built into the phone or computer
// (the browser's "speech synthesis"). It is free, works offline, and sends
// nothing anywhere. An Indian English voice is used when the device has one.
//
// Every function here quietly does nothing where speech isn't available, so
// the game still works — just silently.

function synth(): SpeechSynthesis | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  return window.speechSynthesis;
}

// Voices load a moment after the page does, so this is asked each time
// rather than once at start-up.
function bestVoice(s: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = s.getVoices();
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  return (
    english.find((v) => v.lang.toLowerCase().replace("_", "-") === "en-in") ??
    english.find((v) => v.lang.toLowerCase().replace("_", "-") === "en-gb") ??
    english[0] ??
    null
  );
}

// Say something, cutting off whatever was being said before — when a child
// taps fast while counting, the voice should keep up with the newest number.
export function speak(text: string): void {
  const s = synth();
  if (!s) return;
  try {
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = bestVoice(s);
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? "en-IN";
    u.rate = 0.9; // a little slower than normal, for young listeners
    u.pitch = 1.1;
    s.speak(u);
  } catch {
    // Some browsers throw if speech is blocked; the game carries on silently.
  }
}

export function stopSpeaking(): void {
  try {
    synth()?.cancel();
  } catch {
    // nothing to stop
  }
}
