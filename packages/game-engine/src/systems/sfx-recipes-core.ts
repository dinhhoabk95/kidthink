import {
  type CoreAndEarlyTemplateSFXType,
  type NoteRecipe,
  VN_PENTATONIC_HZ,
} from "./sfx-types.js";

// Hò - Xang - Cống (C5 - F5 - A5): ba bậc ngũ cung ấm mở sáng như tiếng T'rưng.
const POP_PENTATONIC_NOTES: readonly number[] = [
  VN_PENTATONIC_HZ[0],
  VN_PENTATONIC_HZ[2],
  VN_PENTATONIC_HZ[4],
];

// Hò - Xự - Xang - Cống (C5 - D5 - F5 - A5): tiếng chào đầu ván dịu trong.
const START_PENTATONIC_NOTES: readonly number[] = [
  VN_PENTATONIC_HZ[0],
  VN_PENTATONIC_HZ[1],
  VN_PENTATONIC_HZ[2],
  VN_PENTATONIC_HZ[4],
];

// Hò - Xự - Xang - Xê - Cống - Hò' (C5 - D5 - F5 - G5 - A5 - C6): khúc khải hoàn
// ngũ cung mộc cầm kèm bồi âm đàn tranh khi hoàn thành trọn màn chơi.
const FANFARE_PENTATONIC_NOTES: readonly number[] = [
  VN_PENTATONIC_HZ[0],
  VN_PENTATONIC_HZ[1],
  VN_PENTATONIC_HZ[2],
  VN_PENTATONIC_HZ[3],
  VN_PENTATONIC_HZ[4],
  1046.5,
];
const FANFARE_FINAL_INDEX = FANFARE_PENTATONIC_NOTES.length - 1;

export const CORE_SFX_RECIPES: Record<
  CoreAndEarlyTemplateSFXType,
  NoteRecipe[]
> = {
  /** Chạm nhẹ lên mặt gỗ tre ấm (Hò C5 mộc). */
  tap: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 523.25,
      volume: 0.1,
      durationSec: 0.08,
      rampOutSec: 0.045,
    },
  ],

  snap_item: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 587.33,
      volume: 0.12,
      durationSec: 0.09,
      rampOutSec: 0.045,
    },
  ],

  whoosh_return: [
    {
      delaySec: 0,
      type: "sine",
      freq: 392,
      glideTo: { freq: 261.63, overSec: 0.18 },
      volume: 0.09,
      durationSec: 0.19,
      rampOutSec: 0.06,
    },
  ],

  /** Tiếng chào mở ván bằng thang ngũ cung Hò-Xự-Xang-Cống. */
  start_chime: START_PENTATONIC_NOTES.flatMap((freq, i) => [
    {
      delaySec: i * 0.08,
      type: "triangle" as OscillatorType,
      freq,
      volume: 0.13,
      durationSec: 0.22,
      rampOutSec: 0.08,
    },
    {
      delaySec: i * 0.08,
      type: "sine" as OscillatorType,
      freq: freq * 2,
      volume: 0.04,
      durationSec: 0.16,
      rampOutSec: 0.07,
    },
  ]),

  longpress_exit: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 349.23,
      volume: 0.14,
      durationSec: 0.25,
      rampOutSec: 0.1,
    },
  ],

  /** Điểm chạm trả lời đúng: hợp âm rải ngũ cung Hò-Xang-Cống kèm bồi âm tơ ấm (BR-ENG-08). */
  pop_celebrate: POP_PENTATONIC_NOTES.flatMap((freq, i) => [
    {
      delaySec: i * 0.07,
      type: "triangle" as OscillatorType,
      freq,
      volume: 0.15,
      durationSec: 0.24,
      rampOutSec: 0.08,
    },
    {
      delaySec: i * 0.07,
      type: "sine" as OscillatorType,
      freq: freq * 2,
      volume: 0.045,
      durationSec: 0.18,
      rampOutSec: 0.07,
    },
  ]),

  /** Nhịp thở tre trầm dịu khi chưa đúng — tuyệt đối không chói, không trừng phạt (BR-ENG-07). */
  amber_soft: [
    {
      delaySec: 0,
      type: "sine",
      freq: 329.63,
      glideTo: { freq: 261.63, overSec: 0.2 },
      volume: 0.11,
      durationSec: 0.24,
      rampOutSec: 0.08,
    },
    {
      delaySec: 0.02,
      type: "triangle",
      freq: 523.25,
      glideTo: { freq: 392, overSec: 0.18 },
      volume: 0.045,
      durationSec: 0.2,
      rampOutSec: 0.07,
    },
  ],

  /** Khúc mừng hoàn thành màn chơi: thang ngũ cung Hò-Xự-Xang-Xê-Cống-Hò' ngân bồi âm đàn tranh (BR-ENG-08). */
  level_celebrate: FANFARE_PENTATONIC_NOTES.flatMap((freq, i) => {
    const isFinal = i === FANFARE_FINAL_INDEX;
    const durationSec = isFinal ? 0.52 : 0.18;
    const baseNote: NoteRecipe = {
      delaySec: i * 0.085,
      type: "triangle",
      freq,
      volume: isFinal ? 0.16 : 0.14,
      durationSec,
      rampOutSec: Math.max(0.06, durationSec * 0.42),
    };
    const harmonicNote: NoteRecipe = {
      delaySec: i * 0.085 + 0.01,
      type: "sine",
      freq: freq * 2,
      volume: isFinal ? 0.06 : 0.04,
      durationSec: durationSec * 0.85,
      rampOutSec: Math.max(0.05, durationSec * 0.4),
    };
    return [baseNote, harmonicNote];
  }),

  /** GT-001: chạm một token gỗ — "cộc" tre mộc ấm (`BR-E001-05`). */
  wood_tap: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 349.23,
      glideTo: { freq: 261.63, overSec: 0.07 },
      volume: 0.12,
      durationSec: 0.09,
      rampOutSec: 0.045,
    },
  ],

  /** GT-003: vật rơi êm vào rổ tre — "bịch" trầm, không dội (`BR-E003-08`). */
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

  /** GT-020: lật thẻ giấy dó — vút lên ngũ cung Hò -> Xê (`BR-E020-07`). */
  card_flip: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 523.25,
      glideTo: { freq: 783.99, overSec: 0.07 },
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

  /** GT-025: tìm ra điểm khác — ba nốt ngũ cung cao lấp lánh đi lên (`BR-E025-05`). */
  sparkle_find: [1046.5, 1396.91, 1760].map((freq, i) => ({
    delaySec: i * 0.06,
    type: "sine" as OscillatorType,
    freq,
    volume: 0.1,
    durationSec: 0.18,
    rampOutSec: 0.06,
  })),

  /** GT-026: chạm đúng lượt đèn xanh — nốt rủ rê đi lên Hò -> Xê (`BR-E026-11`). */
  go_chime: [
    {
      delaySec: 0,
      type: "sine",
      freq: 523.25,
      glideTo: { freq: 783.99, overSec: 0.16 },
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

  /** GT-037: nhặt được một ngôi sao vào lọ — leng keng ngũ cung đi lên (`BR-E037-10`). */
  star_collect: [
    { delaySec: 0, freq: 1046.5, durationSec: 0.2 },
    { delaySec: 0.07, freq: 1396.91, durationSec: 0.2 },
    { delaySec: 0.14, freq: 1760, durationSec: 0.26 },
  ].map(({ delaySec, freq, durationSec }) => ({
    delaySec,
    type: "sine" as OscillatorType,
    freq,
    volume: 0.11,
    durationSec,
    rampOutSec: 0.07,
  })),

  /** GT-004: nắp hộp đóng — "cạch" tre khô hai nhịp (`BR-E004-04`). */
  lid_click: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 698.46,
      volume: 0.1,
      durationSec: 0.07,
      rampOutSec: 0.04,
    },
    {
      delaySec: 0.07,
      type: "triangle",
      freq: 880,
      volume: 0.09,
      durationSec: 0.08,
      rampOutSec: 0.04,
    },
  ],

  /** GT-012: mở nắp chuông — nốt chuông êm ngân dài (`BR-E012-06`). */
  bell_open: [
    {
      delaySec: 0,
      type: "sine",
      freq: 1174.66,
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

  /** GT-018: làm đúng lời Thỏ bảo — hai bước nhảy ngũ cung đi lên (`BR-E018-04`). */
  rabbit_hop: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 392,
      glideTo: { freq: 523.25, overSec: 0.08 },
      volume: 0.11,
      durationSec: 0.1,
      rampOutSec: 0.05,
    },
    {
      delaySec: 0.12,
      type: "triangle",
      freq: 523.25,
      glideTo: { freq: 698.46, overSec: 0.08 },
      volume: 0.11,
      durationSec: 0.12,
      rampOutSec: 0.06,
    },
  ],

  /** GT-022: soi thấy vật qua kính lúp (`BR-E022-07`). */
  lens_pop: [
    {
      delaySec: 0,
      type: "sine",
      freq: 440,
      glideTo: { freq: 880, overSec: 0.1 },
      volume: 0.12,
      durationSec: 0.14,
      rampOutSec: 0.06,
    },
  ],

  /** GT-028: ếch nhảy một bước trên tia số (`BR-E028-06`). */
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

  /** GT-029: mèo cắn miếng ăn (`BR-E029-06`). */
  cat_munch: [0, 0.11].map((delaySec) => ({
    delaySec,
    type: "triangle" as OscillatorType,
    freq: 260,
    glideTo: { freq: 170, overSec: 0.08 },
    volume: 0.12,
    durationSec: 0.09,
    rampOutSec: 0.05,
  })),

  /** GT-031: xu rơi vào bụng heo đất (`BR-E031-08`). */
  coin_clink: [
    {
      delaySec: 0,
      type: "sine",
      freq: 1567.98,
      volume: 0.09,
      durationSec: 0.12,
      rampOutSec: 0.06,
    },
    {
      delaySec: 0.08,
      type: "sine",
      freq: 1046.5,
      volume: 0.08,
      durationSec: 0.16,
      rampOutSec: 0.08,
    },
  ],

  /** GT-002: lưới chạm mặt nước (`BR-E002-05`). */
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

  /** GT-000: cô giáo khen khi bé trả lời đúng — hai nốt ngũ cung Xang -> Cống dịu (`BR-E000-15`). */
  teacher_chime: [
    {
      delaySec: 0,
      type: "sine",
      freq: 698.46,
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

  /** GT-005: kẹp tất lên dây phơi (`BR-E005-04`). */
  peg_clip: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 880,
      glideTo: { freq: 587.33, overSec: 0.04 },
      volume: 0.1,
      durationSec: 0.06,
      rampOutSec: 0.04,
    },
    {
      delaySec: 0.07,
      type: "sine",
      freq: 392,
      volume: 0.08,
      durationSec: 0.08,
      rampOutSec: 0.05,
    },
  ],

  /** GT-006: máy chiếu phim nhích một khung (`BR-E006-05`). */
  film_tick: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 220,
      volume: 0.07,
      durationSec: 0.05,
      rampOutSec: 0.04,
    },
    {
      delaySec: 0.07,
      type: "triangle",
      freq: 349.23,
      volume: 0.08,
      durationSec: 0.06,
      rampOutSec: 0.04,
    },
  ],

  /** GT-007: kẹo rơi vào khay (`BR-E007-05`). */
  candy_drop: [0, 0.07, 0.13].map((delaySec, i) => ({
    delaySec,
    type: "triangle" as OscillatorType,
    freq: 783.99 - i * 95,
    volume: 0.09,
    durationSec: 0.05,
    rampOutSec: 0.04,
  })),

  /** GT-008: xe vào đúng chỗ đỗ (`BR-E008-06`). */
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
      freq: 523.25,
      volume: 0.07,
      durationSec: 0.1,
      rampOutSec: 0.06,
    },
  ],

  /** GT-009: gõ nhẹ vào kính khi nghe manh mối (`BR-E009-07`). */
  clue_ping: [
    {
      delaySec: 0,
      type: "sine",
      freq: 1174.66,
      volume: 0.08,
      durationSec: 0.12,
      rampOutSec: 0.08,
    },
    {
      delaySec: 0.04,
      type: "sine",
      freq: 1760,
      volume: 0.04,
      durationSec: 0.1,
      rampOutSec: 0.07,
    },
  ],

  /** GT-010: chuông quầy hàng khi tìm đúng giá (`BR-E010-06`). */
  price_bell: [
    {
      delaySec: 0,
      type: "sine",
      freq: 1046.5,
      volume: 0.1,
      durationSec: 0.12,
      rampOutSec: 0.07,
    },
    {
      delaySec: 0.1,
      type: "sine",
      freq: 1396.91,
      volume: 0.08,
      durationSec: 0.2,
      rampOutSec: 0.1,
    },
  ],

  /** GT-011: hạt hoa rơi xuống đất ẩm (`BR-E011-05`). */
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
      freq: 698.46,
      volume: 0.05,
      durationSec: 0.08,
      rampOutSec: 0.05,
    },
  ],

  /** GT-013: chân chuột bước một ô (`BR-E013-07`). */
  mouse_step: [
    {
      delaySec: 0,
      type: "sine",
      freq: 783.99,
      volume: 0.07,
      durationSec: 0.05,
      rampOutSec: 0.04,
    },
  ],

  /** GT-013: chuột đụng tường (`BR-E013-07`). */
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

  /** GT-014: bập bênh gỗ tre nghiêng (`BR-E014-05`). */
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

  /** GT-015: bạn thú ngồi vào ghế gỗ (`BR-E015-07`). */
  seat_pat: [
    {
      delaySec: 0,
      type: "sine",
      freq: 190,
      glideTo: { freq: 130, overSec: 0.09 },
      volume: 0.12,
      durationSec: 0.11,
      rampOutSec: 0.06,
    },
    {
      delaySec: 0.1,
      type: "triangle",
      freq: 523.25,
      volume: 0.05,
      durationSec: 0.07,
      rampOutSec: 0.05,
    },
  ],

  /** GT-016: kim đồng hồ gõ nhịp gỗ nhẹ (`BR-E016-05`). */
  clock_tick: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 880,
      volume: 0.06,
      durationSec: 0.06,
      rampOutSec: 0.04,
    },
    {
      delaySec: 0.16,
      type: "triangle",
      freq: 698.46,
      volume: 0.06,
      durationSec: 0.06,
      rampOutSec: 0.04,
    },
  ],

  /** GT-017: khối gỗ "bụp" trầm, tròn (`BR-E017-05`). */
  block_bump: [
    {
      delaySec: 0,
      type: "sine",
      freq: 220,
      glideTo: { freq: 140, overSec: 0.1 },
      volume: 0.14,
      durationSec: 0.12,
      rampOutSec: 0.06,
    },
  ],

  /** GT-019: công tắc đèn pin (`BR-E019-07`). */
  torch_click: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 1046.5,
      glideTo: { freq: 783.99, overSec: 0.04 },
      volume: 0.06,
      durationSec: 0.06,
      rampOutSec: 0.04,
    },
  ],

  /** GT-021: gương thần lấp lánh (`BR-E021-06`). */
  mirror_chime: [
    {
      delaySec: 0,
      type: "sine",
      freq: 1174.66,
      volume: 0.08,
      durationSec: 0.14,
      rampOutSec: 0.08,
    },
    {
      delaySec: 0.09,
      type: "sine",
      freq: 1567.98,
      volume: 0.07,
      durationSec: 0.2,
      rampOutSec: 0.1,
    },
  ],

  /** GT-023: mảnh gỗ khớp vào khay (`BR-E023-07`). */
  piece_click: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 783.99,
      volume: 0.08,
      durationSec: 0.05,
      rampOutSec: 0.04,
    },
    {
      delaySec: 0.07,
      type: "triangle",
      freq: 523.25,
      volume: 0.09,
      durationSec: 0.1,
      rampOutSec: 0.05,
    },
  ],

  /** GT-024: bước chân kiến (`BR-E024-04`). */
  ant_step: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 698.46,
      volume: 0.06,
      durationSec: 0.05,
      rampOutSec: 0.04,
    },
    {
      delaySec: 0.08,
      type: "triangle",
      freq: 783.99,
      volume: 0.06,
      durationSec: 0.05,
      rampOutSec: 0.04,
    },
  ],
};
