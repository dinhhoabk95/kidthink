/**
 * Kiểu dữ liệu & hằng số an toàn âm học cho `SFXEngine` ("Tuổi thơ Việt × Giấy Gỗ Mộc").
 *
 * Bất biến âm học mầm non (`BR-ENG-16`):
 * - Sườn lên (attack ramp) >= 20 ms (`RAMP_IN_SEC = 0.02`) — không giật mình trẻ.
 * - Sườn tắt (release ramp) >= 40 ms (`MIN_RAMP_OUT_SEC = 0.04`).
 * - Trần biên độ từng nốt <= 0.2 (`MAX_NOTE_VOLUME`) và trần đỉnh tổng <= -1 dBTP
 *   (`TRUE_PEAK_CEILING_LINEAR = 0.891`).
 * - Thang ngũ cung dân ca Việt Nam (`Hò - Xự - Xang - Xê - Cống`, điệu Nam/Xuân
 *   ấm áp trên quãng 5: C5 - D5 - F5 - G5 - A5).
 */

export type CoreAndEarlyTemplateSFXType =
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
  | "scale_creak"
  | "seat_pat"
  | "clock_tick"
  | "block_bump"
  | "torch_click"
  | "mirror_chime"
  | "piece_click"
  | "ant_step";

export type FolkAndLateTemplateSFXType =
  | "rule_whistle"
  | "clip_link"
  | "water_pour"
  | "yarn_pull"
  | "wood_beat"
  | "robot_beep"
  | "bead_click"
  | "wood_pickup"
  | "wood_clack_snap"
  | "marimba_1"
  | "marimba_2"
  | "marimba_3"
  | "marimba_4"
  | "marimba_5"
  | "trung_chime"
  | "dan_tranh_pluck"
  | "trong_boi_rattle"
  | "bamboo_clack"
  | "gift_rustle"
  | "gift_pop"
  | "mascot_giggle";

export type SFXType = CoreAndEarlyTemplateSFXType | FolkAndLateTemplateSFXType;

/** Soft attack — BR-ENG-16 requires >= 20ms so onsets never startle a child. */
export const RAMP_IN_SEC = 0.02;
/** Minimum release — BR-ENG-16 requires >= 40ms. */
export const MIN_RAMP_OUT_SEC = 0.04;
/** Per-voice safe ceiling (-16 LUFS target budget). */
export const MAX_NOTE_VOLUME = 0.2;
/** Master true-peak ceiling: -1 dBTP = 10^(-1/20) ≈ 0.89125, clamped conservatively at 0.85. */
export const TRUE_PEAK_CEILING_LINEAR = 0.85;
/** Hard -1 dBTP reference constant for verification gates. */
export const MINUS_ONE_DBTP_LINEAR = 0.891_25;
/** exponentialRampToValueAtTime cannot target 0. */
export const SILENCE = 0.0001;
/** Tail padding so the oscillator outlives its own release. */
export const STOP_PADDING_SEC = 0.01;

/**
 * Tần số thang ngũ cung Việt Nam `Hò - Xự - Xang - Xê - Cống` (điệu Xuân/Nam
 * trong sáng, ấm áp: C5 - D5 - F5 - G5 - A5) cho đàn T'rưng / Mộc cầm.
 */
export const VN_PENTATONIC_HZ = Object.freeze([
  523.25, // Hò (C5)
  587.33, // Xự (D5)
  698.46, // Xang (F5)
  783.99, // Xê (G5)
  880.0, // Cống (A5)
] as const);

export const VN_PENTATONIC_DEGREES = Object.freeze([
  "Hò",
  "Xự",
  "Xang",
  "Xê",
  "Cống",
] as const);

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
