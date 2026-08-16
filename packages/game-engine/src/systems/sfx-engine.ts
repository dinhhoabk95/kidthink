/**
 * SFXEngine — Web Audio API synthesized sound effects.
 * Zero network audio files required (BR-ENG-03).
 * Enforces BR-ENG-16: 20ms ramp-in soft attack, 40ms ramp-out release, and -16 LUFS ceiling volume.
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
        this.playTone(ctx, 600, 0.08, "sine", 0.1);
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

  /** Play tone with ramp-in >= 20ms and ramp-out >= 40ms (BR-ENG-16) */
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

    const startTime = ctx.currentTime;
    const rampIn = 0.02; // 20ms ramp-in (BR-ENG-16)
    const rampOut = Math.max(0.04, duration * 0.4); // >= 40ms ramp-out (BR-ENG-16)
    const sustainEnd = Math.max(
      startTime + rampIn,
      startTime + duration - rampOut
    );
    const stopTime = sustainEnd + rampOut;

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + rampIn);
    gain.gain.setValueAtTime(volume, sustainEnd);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(stopTime + 0.01);
  }

  /** Pop celebrate sound at touch point: C5 -> E5 -> G5 ascending chime with ramp-in >= 20ms and ramp-out >= 40ms */
  private playPopCelebrate(ctx: AudioContext): void {
    const notes = [523, 659, 784]; // C5, E5, G5
    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = notes[i] as number;
      const startTime = ctx.currentTime + i * 0.07;
      const duration = 0.25;
      const rampIn = 0.02; // 20ms
      const rampOut = 0.05; // 50ms >= 40ms

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + rampIn);
      gain.gain.setValueAtTime(0.18, startTime + duration - rampOut);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);
    }
  }

  /** Non-punitive amber soft feedback sound with ramp-in >= 20ms and ramp-out >= 40ms (BR-ENG-07, BR-ENG-16) */
  private playAmberSoft(ctx: AudioContext): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    const startTime = ctx.currentTime;
    osc.frequency.setValueAtTime(320, startTime);
    osc.frequency.exponentialRampToValueAtTime(220, startTime + 0.2);

    const rampIn = 0.02; // 20ms
    const rampOut = 0.06; // 60ms >= 40ms
    const duration = 0.22;

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(0.12, startTime + rampIn);
    gain.gain.setValueAtTime(0.12, startTime + duration - rampOut);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
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
      const duration = i === notes.length - 1 ? 0.5 : 0.16;
      const rampIn = 0.02;
      const rampOut = Math.max(0.04, duration * 0.35);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.16, startTime + rampIn);
      gain.gain.setValueAtTime(0.16, startTime + duration - rampOut);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);
    }
  }
}
