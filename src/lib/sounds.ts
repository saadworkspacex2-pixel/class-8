"use client";

// Web Audio API based sound effects — no external files needed
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", vol: number = 0.08) {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail if audio not supported
  }
}

export function playClick() {
  playTone(800, 0.06, "sine", 0.06);
}

export function playNav() {
  playTone(600, 0.08, "sine", 0.05);
  setTimeout(() => playTone(900, 0.06, "sine", 0.04), 50);
}

export function playSuccess() {
  playTone(523, 0.12, "sine", 0.07);
  setTimeout(() => playTone(659, 0.12, "sine", 0.07), 100);
  setTimeout(() => playTone(784, 0.15, "sine", 0.07), 200);
}

export function playError() {
  playTone(300, 0.15, "square", 0.05);
  setTimeout(() => playTone(250, 0.2, "square", 0.05), 120);
}

export function playNotification() {
  playTone(880, 0.1, "sine", 0.06);
  setTimeout(() => playTone(1100, 0.1, "sine", 0.06), 80);
  setTimeout(() => playTone(880, 0.08, "sine", 0.04), 160);
}

export function playLogin() {
  playTone(440, 0.1, "sine", 0.06);
  setTimeout(() => playTone(554, 0.1, "sine", 0.06), 100);
  setTimeout(() => playTone(659, 0.1, "sine", 0.06), 200);
  setTimeout(() => playTone(880, 0.15, "sine", 0.07), 300);
}

export function playLogout() {
  playTone(880, 0.1, "sine", 0.06);
  setTimeout(() => playTone(659, 0.1, "sine", 0.05), 100);
  setTimeout(() => playTone(440, 0.15, "sine", 0.04), 200);
}

export function playToggle() {
  playTone(700, 0.05, "sine", 0.05);
}

export function playOpen() {
  playTone(500, 0.06, "sine", 0.05);
  setTimeout(() => playTone(700, 0.06, "sine", 0.05), 60);
}

export function playClose() {
  playTone(700, 0.06, "sine", 0.04);
  setTimeout(() => playTone(500, 0.06, "sine", 0.04), 60);
}
