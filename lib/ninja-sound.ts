"use client";

let context: AudioContext | undefined;
let buffer: Promise<AudioBuffer> | undefined;
let source: AudioBufferSourceNode | undefined;
let generation = 0;

// Called from a user gesture so mobile browsers can authorize playback.
export function prepareNinjaSound() {
  try {
    context ??= new AudioContext();
    void context.resume().catch(() => {});
    buffer ??= fetch("/audio/11-reflexao.mp3")
      .then(response => {
        if (!response.ok) throw new Error("Audio unavailable");
        return response.arrayBuffer();
      })
      .then(bytes => context!.decodeAudioData(bytes));
    void buffer.catch(() => { buffer = undefined; });
  } catch {
    // Audio support/permission must never block onboarding.
  }
}

export function stopNinjaSound() {
  generation++;
  source?.stop();
  source?.disconnect();
  source = undefined;
}

export function playNinjaSound() {
  stopNinjaSound();
  const ticket = generation;
  const activeContext = context;
  if (!activeContext || !buffer) return;
  void Promise.all([buffer, activeContext.resume()]).then(([decoded]) => {
    if (ticket !== generation || activeContext.state !== "running") return;
    source = activeContext.createBufferSource();
    source.buffer = decoded;
    const gain = activeContext.createGain();
    gain.gain.value = .45;
    source.connect(gain).connect(activeContext.destination);
    source.onended = () => gain.disconnect();
    source.start();
  }).catch(() => {});
}
