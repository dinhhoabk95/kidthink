import type { GT034Content, GT034Difficulty } from "./template";

export interface GT034Fixture {
  readonly id: string;
  readonly name_vi: string;
  readonly content: GT034Content;
  readonly difficulty: GT034Difficulty;
}

export const GT034_FIXTURES: GT034Fixture[] = [
  {
    id: "gt034-f01-motif-2step",
    name_vi: "Gõ nhịp trống 2 bước (A-B-A-B)",
    content: {
      prompt: "Bé nghe mẫu nhịp rồi gõ lại theo đúng nhạc cụ nhé!",
      instruments: [
        {
          instrument_id: "drum",
          asset: { kind: "emoji", ref: "EMJ-drum" },
          freq: 220,
          type: "sine",
          name_vi: "Trống cái",
        },
        {
          instrument_id: "cymbal",
          asset: { kind: "emoji", ref: "EMJ-bell" },
          freq: 880,
          type: "triangle",
          name_vi: "Xèng",
        },
      ],
      target_pattern: ["drum", "cymbal", "drum", "cymbal"],
      tempo_bpm: 80,
    },
    difficulty: {
      pattern_length: 4,
      instrument_count: 2,
      tempo_bpm: 80,
      allow_replay: true,
      replay_limit: 3,
      hint_after_ms: 10_000,
    },
  },
  {
    id: "gt034-f02-motif-3step",
    name_vi: "Gõ nhịp 3 nhạc cụ (A-B-C-A-B-C)",
    content: {
      prompt: "Bé lắng nghe bản nhạc 3 âm thanh rồi gõ lại nhé!",
      instruments: [
        {
          instrument_id: "bell",
          asset: { kind: "emoji", ref: "EMJ-bell" },
          freq: 523,
          type: "sine",
          name_vi: "Chuông nhỏ",
        },
        {
          instrument_id: "drum",
          asset: { kind: "emoji", ref: "EMJ-drum" },
          freq: 261,
          type: "sine",
          name_vi: "Trống cái",
        },
        {
          instrument_id: "cymbal",
          asset: { kind: "emoji", ref: "EMJ-musical-score" },
          freq: 784,
          type: "triangle",
          name_vi: "Keng keng",
        },
      ],
      target_pattern: ["bell", "drum", "cymbal", "bell", "drum", "cymbal"],
      tempo_bpm: 75,
    },
    difficulty: {
      pattern_length: 6,
      instrument_count: 3,
      tempo_bpm: 75,
      allow_replay: true,
      replay_limit: 3,
      hint_after_ms: 10_000,
    },
  },
  {
    id: "gt034-f03-motif-with-rest",
    name_vi: "Gõ nhịp có nhịp nghỉ (A-nghỉ-A-nghỉ)",
    content: {
      prompt: "Bé chú ý những chỗ nghỉ trong nhịp điệu nhé!",
      instruments: [
        {
          instrument_id: "clap",
          asset: { kind: "emoji", ref: "EMJ-clapping-hands" },
          freq: 330,
          type: "triangle",
          name_vi: "Tiếng vỗ tay",
        },
        {
          instrument_id: "snap",
          asset: { kind: "emoji", ref: "EMJ-sparkles" },
          freq: 660,
          type: "sine",
          name_vi: "Tiếng búng tay",
        },
      ],
      target_pattern: ["clap", null, "clap", null],
      tempo_bpm: 70,
    },
    difficulty: {
      pattern_length: 4,
      instrument_count: 2,
      tempo_bpm: 70,
      allow_replay: true,
      replay_limit: 3,
      hint_after_ms: 10_000,
    },
  },
];
