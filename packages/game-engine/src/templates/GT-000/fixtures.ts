import type { GT000Content, GT000Difficulty } from "./template.js";

export const GT000_FIXTURES: {
  content: GT000Content;
  difficulty: GT000Difficulty;
}[] = [
  // Fixture 1: Nhận biết số 1, 2, 3 (C1.NUM.01)
  {
    content: {
      concept: {
        skill_code: "C1.NREC.01",
        label: "Số 1, 2, 3",
        teaches: ["C1.NREC.01"],
        values: ["num_1", "num_2", "num_3"],
        sequence_no: 1,
      },
      assets: [
        {
          asset_id: "num_1",
          kind: "glyph",
          label: "Số một",
          glyph: "1",
          text: "1",
          contrast_group: "number_1_3",
        },
        {
          asset_id: "num_2",
          kind: "glyph",
          label: "Số hai",
          glyph: "2",
          text: "2",
          contrast_group: "number_1_3",
        },
        {
          asset_id: "num_3",
          kind: "glyph",
          label: "Số ba",
          glyph: "3",
          text: "3",
          contrast_group: "number_1_3",
        },
      ],
      steps: [
        {
          action: "present",
          target_asset_id: "num_1",
          narration_line: "Đây là số một.",
        },
        {
          action: "present",
          target_asset_id: "num_2",
          narration_line: "Đây là số hai.",
        },
        {
          action: "present",
          target_asset_id: "num_3",
          narration_line: "Đây là số ba.",
        },
        {
          action: "echo",
          target_asset_id: "num_1",
          repeat_count: 1,
          prompt_line: "Bé nói theo cô nhé: số một",
        },
        {
          action: "recognise",
          target_asset_id: "num_1",
          distractor_asset_ids: ["num_2", "num_3"],
          prompt_line: "Bé hãy chỉ cho cô số một nhé!",
        },
        {
          action: "recall",
          target_asset_id: "num_1",
          option_asset_ids: ["num_1", "num_2"],
          prompt_line: "Đây là số mấy nào?",
        },
      ],
      requires_reintro: false,
    },
    difficulty: {
      hint_after_ms: 12_000,
      allow_retry: true,
      auto_play_audio: true,
    },
  },

  // Fixture 2: Nhận biết chữ cái và từ vựng (C5.ALP.01)
  {
    content: {
      concept: {
        skill_code: "C5.ALP.01",
        label: "Chữ A - Con Cá",
        teaches: ["C5.ALP.01"],
        values: ["letter_a", "letter_o", "img_fish"],
        sequence_no: 1,
      },
      assets: [
        {
          asset_id: "letter_a",
          kind: "glyph",
          label: "Chữ A",
          glyph: "A",
          text: "A",
          contrast_group: "letters_vowel",
        },
        {
          asset_id: "letter_o",
          kind: "glyph",
          label: "Chữ O",
          glyph: "O",
          text: "O",
          contrast_group: "letters_vowel",
        },
        {
          asset_id: "img_fish",
          kind: "image",
          label: "Con cá",
          image_ref: { kind: "emoji", ref: "🐟" },
          contrast_group: "animals",
        },
      ],
      steps: [
        {
          action: "present",
          target_asset_id: "letter_a",
          narration_line: "Đây là chữ A.",
        },
        {
          action: "present",
          target_asset_id: "img_fish",
          narration_line: "Đây là con cá. Trong từ cá có chữ A.",
        },
        {
          action: "echo",
          target_asset_id: "letter_a",
          repeat_count: 1,
          prompt_line: "Bé nói theo cô nhé: chữ A",
        },
        {
          action: "recognise",
          target_asset_id: "letter_a",
          distractor_asset_ids: ["letter_o"],
          prompt_line: "Bé hãy chọn chữ A nhé!",
        },
        {
          action: "link",
          source_asset_id: "letter_a",
          target_asset_id: "img_fish",
          prompt_line: "Nối chữ A với hình con cá nào!",
        },
        {
          action: "recall",
          target_asset_id: "letter_a",
          option_asset_ids: ["letter_a", "letter_o"],
          prompt_line: "Đây là chữ gì?",
        },
      ],
      requires_reintro: false,
    },
    difficulty: {
      hint_after_ms: 12_000,
      allow_retry: true,
      auto_play_audio: true,
    },
  },

  // Fixture 3: Nhận biết hình tròn, hình vuông (C2.GEO.01)
  {
    content: {
      concept: {
        skill_code: "C2.GEO.01",
        label: "Hình tròn và hình vuông",
        teaches: ["C2.GEO.01"],
        values: ["shape_circle", "shape_square"],
        sequence_no: 1,
      },
      assets: [
        {
          asset_id: "shape_circle",
          kind: "image",
          label: "Hình tròn",
          image_ref: { kind: "emoji", ref: "🔴" },
          contrast_group: "basic_shapes",
        },
        {
          asset_id: "shape_square",
          kind: "image",
          label: "Hình vuông",
          image_ref: { kind: "emoji", ref: "🟥" },
          contrast_group: "basic_shapes",
        },
      ],
      steps: [
        {
          action: "present",
          target_asset_id: "shape_circle",
          narration_line: "Đây là hình tròn.",
        },
        {
          action: "present",
          target_asset_id: "shape_square",
          narration_line: "Đây là hình vuông.",
        },
        {
          action: "echo",
          target_asset_id: "shape_circle",
          repeat_count: 1,
          prompt_line: "Bé nói theo cô nhé: hình tròn",
        },
        {
          action: "recognise",
          target_asset_id: "shape_circle",
          distractor_asset_ids: ["shape_square"],
          prompt_line: "Bé hãy chạm vào hình tròn nhé!",
        },
        {
          action: "recall",
          target_asset_id: "shape_circle",
          option_asset_ids: ["shape_circle", "shape_square"],
          prompt_line: "Hình này tên là gì?",
        },
      ],
      requires_reintro: false,
    },
    difficulty: {
      hint_after_ms: 12_000,
      allow_retry: true,
      auto_play_audio: true,
    },
  },
];
