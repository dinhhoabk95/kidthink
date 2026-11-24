/**
 * SFXEngine — Web Audio API synthesized sound effects ("Tuổi thơ Việt × Giấy Gỗ Mộc").
 * Zero network audio files required (BR-ENG-03).
 * Enforces BR-ENG-16: >=20ms ramp-in soft attack, >=40ms ramp-out release,
 * <= -1 dBTP master true-peak ceiling, and -16 LUFS target budget.
 * Pure Vanilla TS — ZERO Vue / Pinia / Reactivity dependencies (BR-ENG-01).
 */

import { CORE_SFX_RECIPES } from "./sfx-recipes-core.js";
import { FOLK_SFX_RECIPES } from "./sfx-recipes-folk.js";
import {
  MAX_NOTE_VOLUME,
  MIN_RAMP_OUT_SEC,
  type NoteRecipe,
  RAMP_IN_SEC,
  type SFXType,
  SILENCE,
  STOP_PADDING_SEC,
  TRUE_PEAK_CEILING_LINEAR,
} from "./sfx-types.js";

// biome-ignore lint/performance/noBarrelFile: re-export SFX constants & types from public module
export {
  MAX_NOTE_VOLUME,
  MIN_RAMP_OUT_SEC,
  MINUS_ONE_DBTP_LINEAR,
  type NoteRecipe,
  RAMP_IN_SEC,
  type SFXType,
  TRUE_PEAK_CEILING_LINEAR,
  VN_PENTATONIC_DEGREES,
  VN_PENTATONIC_HZ,
} from "./sfx-types.js";

export const SFX_RECIPES: Record<SFXType, NoteRecipe[]> = {
  ...CORE_SFX_RECIPES,
  ...FOLK_SFX_RECIPES,
};

export class SFXEngine {
  private ctx: AudioContext | null = null;
  private masterOutput: AudioNode | null = null;
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
        this.masterOutput = buildMasterCeilingBus(this.ctx);
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

  /**
   * Đóng `AudioContext`. iOS Safari giới hạn số context mở cùng lúc; mỗi
   * session tạo engine riêng mà không đóng thì tới vòng thứ vài chục mất tiếng.
   */
  dispose(): void {
    const ctx = this.ctx;
    this.ctx = null;
    this.masterOutput = null;
    ctx?.close().catch(() => undefined);
  }

  get muted(): boolean {
    return this.isMuted;
  }

  play(type: SFXType): void {
    const ctx = this.getCtx();
    if (!ctx) {
      return;
    }
    const destination = this.masterOutput ?? ctx.destination;
    for (const note of SFX_RECIPES[type]) {
      playNote(ctx, destination, note, ctx.currentTime + note.delaySec);
    }
  }

  /**
   * Play an arbitrary sequence of notes, enforcing BR-ENG-16 safety invariants:
   * ramp-in >= 20ms, ramp-out >= 40ms, safe volume ceiling <= 0.2.
   */
  playSequence(recipes: readonly NoteRecipe[]): void {
    const ctx = this.getCtx();
    if (!ctx) {
      return;
    }
    const destination = this.masterOutput ?? ctx.destination;
    for (const rawNote of recipes) {
      const safeNote: NoteRecipe = {
        ...rawNote,
        volume: Math.min(MAX_NOTE_VOLUME, Math.max(SILENCE, rawNote.volume)),
        rampOutSec: Math.max(MIN_RAMP_OUT_SEC, rawNote.rampOutSec),
      };
      playNote(
        ctx,
        destination,
        safeNote,
        ctx.currentTime + Math.max(0, safeNote.delaySec)
      );
    }
  }
}

/**
 * Dựng bus giới hạn đỉnh tổng <= -1 dBTP (`TRUE_PEAK_CEILING_LINEAR = 0.85 < 0.891`)
 * để khi nhiều nốt ngũ cung + bồi âm chồng nhau vẫn không bao giờ vượt trần.
 * Giữ tương thích với `FakeAudioContext` tối giản trong unit test.
 */
function buildMasterCeilingBus(ctx: AudioContext): AudioNode {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(TRUE_PEAK_CEILING_LINEAR, ctx.currentTime);

  if (typeof ctx.createDynamicsCompressor === "function") {
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-1.5, ctx.currentTime);
    limiter.knee.setValueAtTime(3, ctx.currentTime);
    limiter.ratio.setValueAtTime(20, ctx.currentTime);
    limiter.attack.setValueAtTime(0.003, ctx.currentTime);
    limiter.release.setValueAtTime(0.08, ctx.currentTime);
    masterGain.connect(limiter);
    limiter.connect(ctx.destination);
    return masterGain;
  }

  masterGain.connect(ctx.destination);
  return masterGain;
}

/** Schedule one oscillator with the BR-ENG-16 attack (>=20ms) / release (>=40ms) envelope. */
function playNote(
  ctx: AudioContext,
  destination: AudioNode,
  note: NoteRecipe,
  startTime: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = note.type;

  if (note.glideTo) {
    osc.frequency.setValueAtTime(note.freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(
      note.glideTo.freq,
      startTime + note.glideTo.overSec
    );
  } else {
    osc.frequency.value = note.freq;
  }

  const safeVolume = Math.min(MAX_NOTE_VOLUME, Math.max(SILENCE, note.volume));
  const safeRampOut = Math.max(MIN_RAMP_OUT_SEC, note.rampOutSec);

  // Hold the peak until the release begins, but never cut the >=20ms attack short.
  const sustainEnd = Math.max(
    startTime + RAMP_IN_SEC,
    startTime + note.durationSec - safeRampOut
  );
  const stopTime = sustainEnd + safeRampOut;

  gain.gain.setValueAtTime(SILENCE, startTime);
  gain.gain.linearRampToValueAtTime(safeVolume, startTime + RAMP_IN_SEC);
  gain.gain.setValueAtTime(safeVolume, sustainEnd);
  gain.gain.exponentialRampToValueAtTime(SILENCE, stopTime);

  osc.connect(gain);
  gain.connect(destination);
  osc.start(startTime);
  osc.stop(stopTime + STOP_PADDING_SEC);
}
