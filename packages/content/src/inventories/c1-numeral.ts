/**
 * Kho giá trị 21 chữ số từ 0 đến 20 (Task #265 / BR-SVI-06..08).
 *
 * Chuẩn 23 chỉ số 104 Thông tư 23/2010/TT-BGDĐT: bắt buộc 0–10 (required: true),
 * mở rộng 11–20 (required: false).
 * ID: n0..n20 để khớp chính xác corpus kỹ năng C1.NREC.
 */

export interface NumeralInventoryItem {
  readonly id: string;
  readonly glyph: string;
  readonly label: string;
  readonly value: number;
  readonly audio_path: string;
  readonly required: boolean;
  readonly group: "C1.NREC.01" | "C1.NREC.02" | "C1.NREC.03" | "C1.NREC.04";
}

export const C1_NUMERAL_INVENTORY: readonly NumeralInventoryItem[] = [
  // C1.NREC.01: Số 0–3 (required: true)
  {
    id: "n0",
    glyph: "0",
    label: "số không",
    value: 0,
    audio_path: "/audio/voice/common/numbers/0.mp3",
    required: true,
    group: "C1.NREC.01",
  },
  {
    id: "n1",
    glyph: "1",
    label: "số một",
    value: 1,
    audio_path: "/audio/voice/common/numbers/1.mp3",
    required: true,
    group: "C1.NREC.01",
  },
  {
    id: "n2",
    glyph: "2",
    label: "số hai",
    value: 2,
    audio_path: "/audio/voice/common/numbers/2.mp3",
    required: true,
    group: "C1.NREC.01",
  },
  {
    id: "n3",
    glyph: "3",
    label: "số ba",
    value: 3,
    audio_path: "/audio/voice/common/numbers/3.mp3",
    required: true,
    group: "C1.NREC.01",
  },

  // C1.NREC.02: Số 4–5 (required: true)
  {
    id: "n4",
    glyph: "4",
    label: "số bốn",
    value: 4,
    audio_path: "/audio/voice/common/numbers/4.mp3",
    required: true,
    group: "C1.NREC.02",
  },
  {
    id: "n5",
    glyph: "5",
    label: "số năm",
    value: 5,
    audio_path: "/audio/voice/common/numbers/5.mp3",
    required: true,
    group: "C1.NREC.02",
  },

  // C1.NREC.03: Số 6–10 (required: true)
  {
    id: "n6",
    glyph: "6",
    label: "số sáu",
    value: 6,
    audio_path: "/audio/voice/common/numbers/6.mp3",
    required: true,
    group: "C1.NREC.03",
  },
  {
    id: "n7",
    glyph: "7",
    label: "số bảy",
    value: 7,
    audio_path: "/audio/voice/common/numbers/7.mp3",
    required: true,
    group: "C1.NREC.03",
  },
  {
    id: "n8",
    glyph: "8",
    label: "số tám",
    value: 8,
    audio_path: "/audio/voice/common/numbers/8.mp3",
    required: true,
    group: "C1.NREC.03",
  },
  {
    id: "n9",
    glyph: "9",
    label: "số chín",
    value: 9,
    audio_path: "/audio/voice/common/numbers/9.mp3",
    required: true,
    group: "C1.NREC.03",
  },
  {
    id: "n10",
    glyph: "10",
    label: "số mười",
    value: 10,
    audio_path: "/audio/voice/common/numbers/10.mp3",
    required: true,
    group: "C1.NREC.03",
  },

  // C1.NREC.04: Số 11–20 (required: false)
  {
    id: "n11",
    glyph: "11",
    label: "số mười một",
    value: 11,
    audio_path: "/audio/voice/common/numbers/11.mp3",
    required: false,
    group: "C1.NREC.04",
  },
  {
    id: "n12",
    glyph: "12",
    label: "số mười hai",
    value: 12,
    audio_path: "/audio/voice/common/numbers/12.mp3",
    required: false,
    group: "C1.NREC.04",
  },
  {
    id: "n13",
    glyph: "13",
    label: "số mười ba",
    value: 13,
    audio_path: "/audio/voice/common/numbers/13.mp3",
    required: false,
    group: "C1.NREC.04",
  },
  {
    id: "n14",
    glyph: "14",
    label: "số mười bốn",
    value: 14,
    audio_path: "/audio/voice/common/numbers/14.mp3",
    required: false,
    group: "C1.NREC.04",
  },
  {
    id: "n15",
    glyph: "15",
    label: "số mười lăm",
    value: 15,
    audio_path: "/audio/voice/common/numbers/15.mp3",
    required: false,
    group: "C1.NREC.04",
  },
  {
    id: "n16",
    glyph: "16",
    label: "số mười sáu",
    value: 16,
    audio_path: "/audio/voice/common/numbers/16.mp3",
    required: false,
    group: "C1.NREC.04",
  },
  {
    id: "n17",
    glyph: "17",
    label: "số mười bảy",
    value: 17,
    audio_path: "/audio/voice/common/numbers/17.mp3",
    required: false,
    group: "C1.NREC.04",
  },
  {
    id: "n18",
    glyph: "18",
    label: "số mười tám",
    value: 18,
    audio_path: "/audio/voice/common/numbers/18.mp3",
    required: false,
    group: "C1.NREC.04",
  },
  {
    id: "n19",
    glyph: "19",
    label: "số mười chín",
    value: 19,
    audio_path: "/audio/voice/common/numbers/19.mp3",
    required: false,
    group: "C1.NREC.04",
  },
  {
    id: "n20",
    glyph: "20",
    label: "số hai mươi",
    value: 20,
    audio_path: "/audio/voice/common/numbers/20.mp3",
    required: false,
    group: "C1.NREC.04",
  },
] as const;
