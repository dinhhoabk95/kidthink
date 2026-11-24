import {
  type FolkAndLateTemplateSFXType,
  type NoteRecipe,
  VN_PENTATONIC_HZ,
} from "./sfx-types.js";

/**
 * Dựng âm sắc ống tre T'rưng / Mộc cầm Việt Nam:
 * - Tầng cơ bản (`triangle`) dày mộc như gõ dùi vào thân tre già.
 * - Bồi âm quãng tám (`sine`, 2× freq) cộng hưởng lòng ống tre rỗng trong trẻo.
 */
function buildBambooXylophoneNote(
  freq: number,
  durationSec = 0.22
): NoteRecipe[] {
  return [
    {
      delaySec: 0,
      type: "triangle",
      freq,
      volume: 0.14,
      durationSec,
      rampOutSec: 0.12,
    },
    {
      delaySec: 0,
      type: "sine",
      freq: freq * 2,
      volume: 0.048,
      durationSec: Math.max(0.14, durationSec - 0.06),
      rampOutSec: 0.08,
    },
  ];
}

export const FOLK_SFX_RECIPES: Record<
  FolkAndLateTemplateSFXType,
  NoteRecipe[]
> = {
  /** GT-027: sáo trúc báo đổi luật — hai nốt ngũ cung lướt êm (`BR-E027-05`). */
  rule_whistle: [
    {
      delaySec: 0,
      type: "sine",
      freq: 1396.91,
      glideTo: { freq: 1760, overSec: 0.1 },
      volume: 0.07,
      durationSec: 0.14,
      rampOutSec: 0.06,
    },
    {
      delaySec: 0.18,
      type: "sine",
      freq: 1760,
      volume: 0.07,
      durationSec: 0.2,
      rampOutSec: 0.1,
    },
  ],

  /** GT-030: kẹp tre/giấy móc vào nhau (`BR-E030-07`). */
  clip_link: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 1174.66,
      volume: 0.06,
      durationSec: 0.07,
      rampOutSec: 0.05,
    },
    {
      delaySec: 0.06,
      type: "sine",
      freq: 1567.98,
      volume: 0.05,
      durationSec: 0.12,
      rampOutSec: 0.07,
    },
  ],

  /** GT-032: nước rót bầu gốm "ục ục" (`BR-E032-09`). */
  water_pour: [
    {
      delaySec: 0,
      type: "sine",
      freq: 523.25,
      glideTo: { freq: 392, overSec: 0.12 },
      volume: 0.08,
      durationSec: 0.14,
      rampOutSec: 0.06,
    },
    {
      delaySec: 0.15,
      type: "sine",
      freq: 392,
      glideTo: { freq: 523.25, overSec: 0.1 },
      volume: 0.07,
      durationSec: 0.13,
      rampOutSec: 0.06,
    },
  ],

  /** GT-033: sợi cói / sợi len kéo qua khung dệt (`BR-E033-05`). */
  yarn_pull: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 293.66,
      glideTo: { freq: 440, overSec: 0.14 },
      volume: 0.06,
      durationSec: 0.16,
      rampOutSec: 0.08,
    },
  ],

  /** GT-034: mõ gỗ mộc "cộc" tròn, ấm ở nhịp nghỉ (`BR-E034-09`). */
  wood_beat: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 392,
      glideTo: { freq: 329.63, overSec: 0.05 },
      volume: 0.09,
      durationSec: 0.09,
      rampOutSec: 0.05,
    },
  ],

  /** GT-035: tín hiệu bước đi êm dịu (`BR-E035-11`). */
  robot_beep: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 880,
      volume: 0.06,
      durationSec: 0.08,
      rampOutSec: 0.05,
    },
  ],

  /** GT-036: hạt gỗ xâu vào dây cói (`BR-E036-10`). */
  bead_click: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 880,
      glideTo: { freq: 698.46, overSec: 0.05 },
      volume: 0.07,
      durationSec: 0.07,
      rampOutSec: 0.04,
    },
  ],

  /** Nhấc quân cờ gỗ mộc khỏi khay tre (Hò trầm -> Xang ấm). */
  wood_pickup: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 349.23,
      glideTo: { freq: 523.25, overSec: 0.06 },
      volume: 0.11,
      durationSec: 0.08,
      rampOutSec: 0.04,
    },
  ],

  /** Quân gỗ khớp vào hốc khay tre (Hò -> Xê sáng gọn). */
  wood_clack_snap: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 523.25,
      volume: 0.12,
      durationSec: 0.07,
      rampOutSec: 0.04,
    },
    {
      delaySec: 0.04,
      type: "sine",
      freq: 783.99,
      volume: 0.1,
      durationSec: 0.09,
      rampOutSec: 0.05,
    },
  ],

  /** T'rưng / Mộc cầm ngũ cung bậc 1 — Hò (C5 = 523.25 Hz). */
  marimba_1: buildBambooXylophoneNote(VN_PENTATONIC_HZ[0], 0.22),

  /** T'rưng / Mộc cầm ngũ cung bậc 2 — Xự (D5 = 587.33 Hz). */
  marimba_2: buildBambooXylophoneNote(VN_PENTATONIC_HZ[1], 0.22),

  /** T'rưng / Mộc cầm ngũ cung bậc 3 — Xang (F5 = 698.46 Hz). */
  marimba_3: buildBambooXylophoneNote(VN_PENTATONIC_HZ[2], 0.22),

  /** T'rưng / Mộc cầm ngũ cung bậc 4 — Xê (G5 = 783.99 Hz). */
  marimba_4: buildBambooXylophoneNote(VN_PENTATONIC_HZ[3], 0.22),

  /** T'rưng / Mộc cầm ngũ cung bậc 5 — Cống (A5 = 880.00 Hz). */
  marimba_5: buildBambooXylophoneNote(VN_PENTATONIC_HZ[4], 0.24),

  /** Lướt dàn ống nứa T'rưng ngũ cung Hò-Xang-Xê-Cống trong trẻo (tổng <= 0.56s). */
  trung_chime: [
    VN_PENTATONIC_HZ[0],
    VN_PENTATONIC_HZ[2],
    VN_PENTATONIC_HZ[3],
    VN_PENTATONIC_HZ[4],
  ].map((freq, i) => ({
    delaySec: i * 0.09,
    type: "triangle" as OscillatorType,
    freq,
    volume: 0.13,
    durationSec: 0.22,
    rampOutSec: 0.1,
  })),

  /** Tiếng gảy đàn tranh bồi âm tơ ngũ cung dịu ngọt (tổng <= 0.55s). */
  dan_tranh_pluck: [
    {
      delaySec: 0,
      type: "sine",
      freq: VN_PENTATONIC_HZ[0],
      volume: 0.11,
      durationSec: 0.3,
      rampOutSec: 0.18,
    },
    {
      delaySec: 0.08,
      type: "sine",
      freq: VN_PENTATONIC_HZ[2],
      volume: 0.1,
      durationSec: 0.32,
      rampOutSec: 0.2,
    },
    {
      delaySec: 0.16,
      type: "sine",
      freq: VN_PENTATONIC_HZ[4] * 2,
      volume: 0.06,
      durationSec: 0.36,
      rampOutSec: 0.22,
    },
  ],

  /** Tiếng lắc trống bỏi dân gian hai hạt gỗ chạm mặt giấy dó (tổng <= 0.31s). */
  trong_boi_rattle: [0, 0.08, 0.16].map((delaySec, i) => ({
    delaySec,
    type: "triangle" as OscillatorType,
    freq: 440 + i * 74,
    glideTo: { freq: 310 + i * 40, overSec: 0.05 },
    volume: 0.1,
    durationSec: 0.08,
    rampOutSec: 0.045,
  })),

  /** Tiếng phách tre mộc mạc gõ nhịp đồng dao (tổng <= 0.2s). */
  bamboo_clack: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 698.46,
      glideTo: { freq: 523.25, overSec: 0.04 },
      volume: 0.11,
      durationSec: 0.07,
      rampOutSec: 0.04,
    },
    {
      delaySec: 0.08,
      type: "sine",
      freq: 1046.5,
      volume: 0.06,
      durationSec: 0.08,
      rampOutSec: 0.045,
    },
  ],

  /** Hộp quà mây tre rung nhẹ khi bé chạm vào nắp (`BR-FBK-18`). */
  gift_rustle: [
    {
      delaySec: 0,
      type: "triangle",
      freq: 440,
      volume: 0.09,
      durationSec: 0.08,
      rampOutSec: 0.04,
    },
    {
      delaySec: 0.07,
      type: "triangle",
      freq: 523.25,
      volume: 0.09,
      durationSec: 0.08,
      rampOutSec: 0.04,
    },
    {
      delaySec: 0.14,
      type: "triangle",
      freq: 587.33,
      volume: 0.1,
      durationSec: 0.09,
      rampOutSec: 0.04,
    },
  ],

  /** Hộp quà bật mở bằng hợp âm ngũ cung Hò-Xự-Xang-Cống (`BR-FBK-18`). */
  gift_pop: [523.25, 587.33, 698.46, 880].map((freq, i) => ({
    delaySec: i * 0.07,
    type: "sine" as OscillatorType,
    freq,
    volume: 0.14,
    durationSec: 0.24,
    rampOutSec: 0.08,
  })),

  /** Gấu Con khích lệ bé bằng nét luyến ngũ cung tươi vui (`BR-MPR-04`). */
  mascot_giggle: [
    {
      delaySec: 0,
      type: "sine",
      freq: 587.33,
      glideTo: { freq: 698.46, overSec: 0.08 },
      volume: 0.11,
      durationSec: 0.12,
      rampOutSec: 0.05,
    },
    {
      delaySec: 0.09,
      type: "sine",
      freq: 698.46,
      glideTo: { freq: 783.99, overSec: 0.08 },
      volume: 0.12,
      durationSec: 0.12,
      rampOutSec: 0.05,
    },
    {
      delaySec: 0.18,
      type: "triangle",
      freq: 880,
      volume: 0.11,
      durationSec: 0.14,
      rampOutSec: 0.06,
    },
  ],
};
