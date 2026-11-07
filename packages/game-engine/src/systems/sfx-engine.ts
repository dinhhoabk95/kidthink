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
  | "longpress_exit"
  | "start_chime"
  | "whoosh_return"
  | "snap_item"
  | "wood_tap"
  | "drop_thud"
  | "card_flip"
  | "sparkle_find"
  | "go_chime"
  | "stop_hum"
  | "star_collect";

/** Soft attack — BR-ENG-16 requires >= 20ms so onsets never startle a child. */
const RAMP_IN_SEC = 0.02;
/** exponentialRampToValueAtTime cannot target 0. */
const SILENCE = 0.0001;
/** Tail padding so the oscillator outlives its own release. */
const STOP_PADDING_SEC = 0.01;

export interface NoteRecipe {
  /** Offset from the moment `play()` is called. */
  delaySec: number;
  type: OscillatorType;
  freq: number;
  /** Optional pitch glide, e.g. the downward sigh of `amber_soft`. */
  glideTo?: { freq: number; overSec: number };
  volume: number;
  durationSec: number;
  /** Release length — BR-ENG-16 requires >= 40ms. */
  rampOutSec: number;
}

const POP_NOTES = [523, 659, 784]; // C5, E5, G5
const FANFARE_NOTES = [523, 659, 784, 1047, 784, 1047]; // C5 E5 G5 C6 G5 C6
const FANFARE_FINAL_INDEX = FANFARE_NOTES.length - 1;
const START_CHIME_NOTES = [523, 659, 784, 1047]; // C5 E5 G5 C6 - cheerful rising chime

export const SFX_RECIPES: Record<SFXType, NoteRecipe[]> = {
  tap: [
    {
      delaySec: 0,
      type: "sine",
      freq: 600,
      volume: 0.1,
      durationSec: 0.08,
      rampOutSec: 0.04,
    },
  ],

  snap_item: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 480,
      volume: 0.12,
      durationSec: 0.08,
      rampOutSec: 0.04,
    },
  ],

  whoosh_return: [
    {
      delaySec: 0,
      type: "sine",
      freq: 420,
      glideTo: { freq: 240, overSec: 0.18 },
      volume: 0.09,
      durationSec: 0.18,
      rampOutSec: 0.06,
    },
  ],

  start_chime: START_CHIME_NOTES.map((freq, i) => ({
    delaySec: i * 0.08,
    type: "sine" as OscillatorType,
    freq,
    volume: 0.14,
    durationSec: 0.22,
    rampOutSec: 0.06,
  })),

  longpress_exit: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 350,
      volume: 0.15,
      durationSec: 0.25,
      rampOutSec: 0.1,
    },
  ],

  /** Ascending chime at the touch point on a correct answer (BR-ENG-08). */
  pop_celebrate: POP_NOTES.map((freq, i) => ({
    delaySec: i * 0.07,
    type: "triangle" as OscillatorType,
    freq,
    volume: 0.18,
    durationSec: 0.25,
    rampOutSec: 0.05,
  })),

  /** Non-punitive downward sigh on a wrong answer (BR-ENG-07). */
  amber_soft: [
    {
      delaySec: 0,
      type: "sine",
      freq: 320,
      glideTo: { freq: 220, overSec: 0.2 },
      volume: 0.12,
      durationSec: 0.22,
      rampOutSec: 0.06,
    },
  ],

  /** GT-001: chạm một token gỗ — "cộc" ấm, trầm dần (`BR-E001-05`). */
  wood_tap: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 330,
      glideTo: { freq: 260, overSec: 0.07 },
      volume: 0.12,
      durationSec: 0.09,
      rampOutSec: 0.04,
    },
  ],

  /** GT-003: vật rơi êm vào hộp — "bịch" trầm, không dội (`BR-E003-08`). */
  drop_thud: [
    {
      delaySec: 0,
      type: "sine",
      freq: 180,
      glideTo: { freq: 110, overSec: 0.14 },
      volume: 0.14,
      durationSec: 0.16,
      rampOutSec: 0.06,
    },
  ],

  /** GT-020: lật thẻ — vút lên rồi "tích" nhỏ (`BR-E020-07`). */
  card_flip: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 520,
      glideTo: { freq: 780, overSec: 0.07 },
      volume: 0.09,
      durationSec: 0.08,
      rampOutSec: 0.04,
    },
    {
      delaySec: 0.06,
      type: "sine",
      freq: 880,
      volume: 0.07,
      durationSec: 0.07,
      rampOutSec: 0.04,
    },
  ],

  /** GT-025: tìm ra điểm khác — ba nốt lấp lánh đi lên (`BR-E025-05`). */
  sparkle_find: [988, 1319, 1760].map((freq, i) => ({
    delaySec: i * 0.06,
    type: "sine" as OscillatorType,
    freq,
    volume: 0.1,
    durationSec: 0.18,
    rampOutSec: 0.06,
  })),

  /** GT-026: đèn xanh — nốt rủ rê lên, mời "đi" (`BR-E026-11`). */
  go_chime: [
    {
      delaySec: 0,
      type: "sine",
      freq: 523,
      glideTo: { freq: 784, overSec: 0.16 },
      volume: 0.12,
      durationSec: 0.2,
      rampOutSec: 0.06,
    },
  ],

  /** GT-026: đèn đỏ — nốt trầm dài, êm, báo "đứng lại" (`BR-E026-11`). */
  stop_hum: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 196,
      volume: 0.1,
      durationSec: 0.35,
      rampOutSec: 0.12,
    },
  ],

  /** GT-037: nhặt được một ngôi sao vào lọ — leng keng đi lên (`BR-E037-10`). */
  star_collect: [
    { delaySec: 0, freq: 1047, durationSec: 0.2 },
    { delaySec: 0.07, freq: 1319, durationSec: 0.2 },
    { delaySec: 0.14, freq: 1568, durationSec: 0.26 },
  ].map(({ delaySec, freq, durationSec }) => ({
    delaySec,
    type: "sine" as OscillatorType,
    freq,
    volume: 0.11,
    durationSec,
    rampOutSec: 0.07,
  })),

  /** Grand fanfare, level completion only (BR-ENG-08). */
  level_celebrate: FANFARE_NOTES.map((freq, i) => {
    const durationSec = i === FANFARE_FINAL_INDEX ? 0.5 : 0.16;
    return {
      delaySec: i * 0.09,
      type: (i < 4 ? "triangle" : "sine") as OscillatorType,
      freq,
      volume: 0.16,
      durationSec,
      rampOutSec: Math.max(0.04, durationSec * 0.35),
    };
  }),
};

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

  /**
   * Đóng `AudioContext`. iOS Safari giới hạn số context mở cùng lúc; mỗi
   * session tạo engine riêng mà không đóng thì tới vòng thứ vài chục mất tiếng.
   */
  dispose(): void {
    const ctx = this.ctx;
    this.ctx = null;
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
    for (const note of SFX_RECIPES[type]) {
      playNote(ctx, note, ctx.currentTime + note.delaySec);
    }
  }

  /**
   * Play an arbitrary sequence of notes, enforcing BR-ENG-16 safety invariants:
   * ramp-in >= 20ms, ramp-out >= 40ms, safe volume ceiling.
   */
  playSequence(recipes: readonly NoteRecipe[]): void {
    const ctx = this.getCtx();
    if (!ctx) {
      return;
    }
    for (const rawNote of recipes) {
      const safeNote: NoteRecipe = {
        ...rawNote,
        volume: Math.min(0.2, Math.max(SILENCE, rawNote.volume)),
        rampOutSec: Math.max(0.04, rawNote.rampOutSec),
      };
      playNote(ctx, safeNote, ctx.currentTime + Math.max(0, safeNote.delaySec));
    }
  }
}

/** Schedule one oscillator with the BR-ENG-16 attack/release envelope. */
function playNote(
  ctx: AudioContext,
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

  // Hold the peak until the release begins, but never cut the attack short.
  const sustainEnd = Math.max(
    startTime + RAMP_IN_SEC,
    startTime + note.durationSec - note.rampOutSec
  );
  const stopTime = sustainEnd + note.rampOutSec;

  gain.gain.setValueAtTime(SILENCE, startTime);
  gain.gain.linearRampToValueAtTime(note.volume, startTime + RAMP_IN_SEC);
  gain.gain.setValueAtTime(note.volume, sustainEnd);
  gain.gain.exponentialRampToValueAtTime(SILENCE, stopTime);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(stopTime + STOP_PADDING_SEC);
}
