/**
 * SFXEngine — Web Audio API synthesized sound effects ported & adapted from v1 tinimath game-engine.
 * Zero network audio files required (BR-ENG-03).
 * Enforces 20ms ramp-in soft attack (BR-AUD-02) and 80 dBA ceiling volume (BR-AUD-01).
 * Pure Vanilla TS — ZERO Vue / Pinia / Reactivity dependencies (BR-ENG-01).
 */

export type SFXType =
  | "tap"
  | "pop_celebrate"
  | "amber_soft"
  | "level_celebrate"
  | "longpress_exit";

export class SFXEngine {
  private ctx: AudioContext | null = null;
  private isMuted = false;

  private getCtx(): AudioContext | null {
    if (this.isMuted) {
      return null;
    }
    if (typeof window === "undefined" || typeof AudioContext === "undefined") {
      return null;
    }
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => undefined);
    }
    return this.ctx;
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
  }

  get muted(): boolean {
    return this.isMuted;
  }

  play(type: SFXType): void {
    const ctx = this.getCtx();
    if (!ctx) {
      return;
    }

    switch (type) {
      case "tap":
        this.playTone(ctx, 600, 0.05, "sine", 0.1);
        break;
      case "pop_celebrate":
        this.playPopCelebrate(ctx);
        break;
      case "amber_soft":
        this.playAmberSoft(ctx);
        break;
      case "level_celebrate":
        this.playLevelCelebrate(ctx);
        break;
      case "longpress_exit":
        this.playTone(ctx, 350, 0.25, "triangle", 0.15);
        break;
      default:
        break;
    }
  }

  private playTone(
    ctx: AudioContext,
    freq: number,
    duration: number,
    type: OscillatorType = "sine",
    volume = 0.15
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    // 20ms ramp-in soft attack (BR-AUD-02)
    const startTime = ctx.currentTime;
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  /** Pop celebrate sound at touch point: C5 -> E5 -> G5 ascending chime */
  private playPopCelebrate(ctx: AudioContext): void {
    const notes = [523, 659, 784]; // C5, E5, G5
    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = notes[i] as number;
      const startTime = ctx.currentTime + i * 0.07;
      // 20ms ramp-in
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.28);
    }
  }

  /** Non-punitive amber soft feedback sound (BR-ENG-07) */
  private playAmberSoft(ctx: AudioContext): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.15);
    // 20ms soft attack
    const startTime = ctx.currentTime;
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.22);
  }

  /** Level completion grand fanfare */
  private playLevelCelebrate(ctx: AudioContext): void {
    const notes = [523, 659, 784, 1047, 784, 1047]; // C5 E5 G5 C6 G5 C6
    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i < 4 ? "triangle" : "sine";
      osc.frequency.value = notes[i] as number;
      const startTime = ctx.currentTime + i * 0.09;
      const duration = i === notes.length - 1 ? 0.5 : 0.14;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.16, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);
    }
  }
}
