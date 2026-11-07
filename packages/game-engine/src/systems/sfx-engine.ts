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
  | "star_collect"
  | "lid_click"
  | "bell_open"
  | "rabbit_hop"
  | "lens_pop"
  | "frog_hop"
  | "cat_munch"
  | "coin_clink"
  | "net_splash"
  | "teacher_chime"
  | "peg_clip"
  | "film_tick"
  | "candy_drop"
  | "park_thunk"
  | "clue_ping"
  | "price_bell"
  | "seed_plop"
  | "wall_boing"
  | "mouse_step"
  | "scale_creak";

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

  /** GT-026: chạm đúng lượt đèn xanh — nốt rủ rê đi lên (`BR-E026-11`). */
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

  /** GT-026: kìm được ở lượt đèn đỏ — nốt trầm dài, êm (`BR-E026-11`). */
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

  /** GT-004: nắp hộp đóng — "cạch" khô hai nhịp, cao hơn tiếng bịch của GT-003 (`BR-E004-04`). */
  lid_click: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 700,
      volume: 0.1,
      durationSec: 0.07,
      rampOutSec: 0.04,
    },
    {
      delaySec: 0.07,
      type: "triangle",
      freq: 940,
      volume: 0.09,
      durationSec: 0.08,
      rampOutSec: 0.04,
    },
  ],

  /** GT-012: mở nắp chuông — nốt chuông êm ngân dài, không báo đáp án (`BR-E012-06`). */
  bell_open: [
    {
      delaySec: 0,
      type: "sine",
      freq: 1175,
      volume: 0.09,
      durationSec: 0.5,
      rampOutSec: 0.3,
    },
    {
      delaySec: 0,
      type: "sine",
      freq: 1760,
      volume: 0.04,
      durationSec: 0.35,
      rampOutSec: 0.2,
    },
  ],

  /** GT-018: làm đúng lời Thỏ bảo — hai bước nhảy tưng tưng đi lên (`BR-E018-04`). */
  rabbit_hop: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 392,
      glideTo: { freq: 523, overSec: 0.08 },
      volume: 0.11,
      durationSec: 0.1,
      rampOutSec: 0.05,
    },
    {
      delaySec: 0.12,
      type: "triangle",
      freq: 523,
      glideTo: { freq: 659, overSec: 0.08 },
      volume: 0.11,
      durationSec: 0.12,
      rampOutSec: 0.06,
    },
  ],

  /** GT-022: soi thấy vật qua kính lúp — "bong" tròn vút lên, một nốt (`BR-E022-07`). */
  lens_pop: [
    {
      delaySec: 0,
      type: "sine",
      freq: 420,
      glideTo: { freq: 940, overSec: 0.1 },
      volume: 0.12,
      durationSec: 0.14,
      rampOutSec: 0.06,
    },
  ],

  /** GT-028: ếch nhảy một bước trên tia số — "ọp" thấp rồi bật lên (`BR-E028-06`). */
  frog_hop: [
    {
      delaySec: 0,
      type: "sine",
      freq: 220,
      glideTo: { freq: 330, overSec: 0.07 },
      volume: 0.12,
      durationSec: 0.09,
      rampOutSec: 0.04,
    },
    {
      delaySec: 0.08,
      type: "triangle",
      freq: 440,
      glideTo: { freq: 330, overSec: 0.09 },
      volume: 0.08,
      durationSec: 0.1,
      rampOutSec: 0.05,
    },
  ],

  /** GT-029: mèo cắn miếng ăn — hai tiếng "ngoạm" trầm, êm (`BR-E029-06`). */
  cat_munch: [0, 0.11].map((delaySec) => ({
    delaySec,
    type: "triangle" as OscillatorType,
    freq: 260,
    glideTo: { freq: 170, overSec: 0.08 },
    volume: 0.12,
    durationSec: 0.09,
    rampOutSec: 0.05,
  })),

  /** GT-031: xu rơi vào bụng heo đất — "keng" cao rồi "coong" thấp (`BR-E031-08`). */
  coin_clink: [
    {
      delaySec: 0,
      type: "sine",
      freq: 1568,
      volume: 0.09,
      durationSec: 0.12,
      rampOutSec: 0.06,
    },
    {
      delaySec: 0.08,
      type: "sine",
      freq: 988,
      volume: 0.08,
      durationSec: 0.16,
      rampOutSec: 0.08,
    },
  ],

  /** GT-002: lưới chạm mặt nước — "tõm" êm đi xuống (`BR-E002-05`). */
  net_splash: [
    {
      delaySec: 0,
      type: "sine",
      freq: 420,
      glideTo: { freq: 240, overSec: 0.1 },
      volume: 0.1,
      durationSec: 0.12,
      rampOutSec: 0.06,
    },
    {
      delaySec: 0.09,
      type: "triangle",
      freq: 640,
      glideTo: { freq: 520, overSec: 0.06 },
      volume: 0.05,
      durationSec: 0.07,
      rampOutSec: 0.05,
    },
  ],

  /** GT-000: cô giáo khen khi bé trả lời đúng — hai nốt "ting" dịu (`BR-E000-15`). */
  teacher_chime: [
    {
      delaySec: 0,
      type: "sine",
      freq: 660,
      volume: 0.1,
      durationSec: 0.12,
      rampOutSec: 0.06,
    },
    {
      delaySec: 0.12,
      type: "sine",
      freq: 880,
      volume: 0.08,
      durationSec: 0.18,
      rampOutSec: 0.08,
    },
  ],

  /** GT-005: kẹp tất lên dây phơi — "tách" ngắn, êm (`BR-E005-04`). */
  peg_clip: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 880,
      glideTo: { freq: 560, overSec: 0.04 },
      volume: 0.1,
      durationSec: 0.06,
      rampOutSec: 0.04,
    },
    {
      delaySec: 0.07,
      type: "sine",
      freq: 400,
      volume: 0.08,
      durationSec: 0.08,
      rampOutSec: 0.05,
    },
  ],

  /** GT-006: máy chiếu phim nhích một khung — "tạch" êm (`BR-E006-05`). */
  film_tick: [
    {
      delaySec: 0,
      type: "square",
      freq: 180,
      volume: 0.06,
      durationSec: 0.05,
      rampOutSec: 0.04,
    },
    {
      delaySec: 0.07,
      type: "triangle",
      freq: 320,
      volume: 0.08,
      durationSec: 0.06,
      rampOutSec: 0.04,
    },
  ],

  /** GT-007: kẹo rơi vào khay — "lạch cạch" hai tiếng nhỏ (`BR-E007-05`). */
  candy_drop: [0, 0.07, 0.13].map((delaySec, i) => ({
    delaySec,
    type: "triangle" as OscillatorType,
    freq: 760 - i * 90,
    volume: 0.09,
    durationSec: 0.05,
    rampOutSec: 0.04,
  })),

  /** GT-008: xe vào đúng chỗ đỗ — "cạch" trầm êm (`BR-E008-06`). */
  park_thunk: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 240,
      glideTo: { freq: 160, overSec: 0.06 },
      volume: 0.12,
      durationSec: 0.08,
      rampOutSec: 0.05,
    },
    {
      delaySec: 0.09,
      type: "sine",
      freq: 520,
      volume: 0.07,
      durationSec: 0.1,
      rampOutSec: 0.06,
    },
  ],

  /** GT-009: gõ nhẹ vào kính khi nghe manh mối — "tinh" nhỏ (`BR-E009-07`). */
  clue_ping: [
    {
      delaySec: 0,
      type: "sine",
      freq: 1180,
      volume: 0.08,
      durationSec: 0.12,
      rampOutSec: 0.08,
    },
    {
      delaySec: 0.04,
      type: "sine",
      freq: 1770,
      volume: 0.04,
      durationSec: 0.1,
      rampOutSec: 0.07,
    },
  ],

  /** GT-010: chuông quầy hàng khi tìm đúng giá — "leng keng" êm (`BR-E010-06`). */
  price_bell: [
    {
      delaySec: 0,
      type: "sine",
      freq: 988,
      volume: 0.1,
      durationSec: 0.12,
      rampOutSec: 0.07,
    },
    {
      delaySec: 0.1,
      type: "sine",
      freq: 1319,
      volume: 0.08,
      durationSec: 0.2,
      rampOutSec: 0.1,
    },
  ],

  /** GT-011: hạt hoa rơi xuống đất ẩm — "bụp" trầm êm (`BR-E011-05`). */
  seed_plop: [
    {
      delaySec: 0,
      type: "sine",
      freq: 300,
      glideTo: { freq: 150, overSec: 0.09 },
      volume: 0.12,
      durationSec: 0.11,
      rampOutSec: 0.06,
    },
    {
      delaySec: 0.12,
      type: "triangle",
      freq: 700,
      volume: 0.05,
      durationSec: 0.08,
      rampOutSec: 0.05,
    },
  ],

  /** GT-013: chân chuột bước một ô — "tíc" nhẹ (`BR-E013-07`). */
  mouse_step: [
    {
      delaySec: 0,
      type: "sine",
      freq: 820,
      volume: 0.07,
      durationSec: 0.05,
      rampOutSec: 0.04,
    },
  ],

  /** GT-013: chuột đụng tường — "boing" mềm bật lên rồi xuống (`BR-E013-07`). */
  wall_boing: [
    {
      delaySec: 0,
      type: "sine",
      freq: 200,
      glideTo: { freq: 420, overSec: 0.08 },
      volume: 0.12,
      durationSec: 0.1,
      rampOutSec: 0.05,
    },
    {
      delaySec: 0.1,
      type: "sine",
      freq: 420,
      glideTo: { freq: 240, overSec: 0.1 },
      volume: 0.09,
      durationSec: 0.12,
      rampOutSec: 0.06,
    },
  ],

  /** GT-014: bập bênh nghiêng — "kẽo kẹt" êm hai nhịp (`BR-E014-05`). */
  scale_creak: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 330,
      glideTo: { freq: 270, overSec: 0.12 },
      volume: 0.08,
      durationSec: 0.14,
      rampOutSec: 0.06,
    },
    {
      delaySec: 0.17,
      type: "triangle",
      freq: 250,
      glideTo: { freq: 310, overSec: 0.1 },
      volume: 0.07,
      durationSec: 0.12,
      rampOutSec: 0.06,
    },
  ],

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
