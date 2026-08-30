import type { ContentSeed } from "#src/seed-content/types";

/**
 * Batch: SEED-MONT-A15
 * Workbook 15: Cùng bé tìm quy luật (Phần Lô A)
 * 1 dạng bài (WB15-D1), 2 level, GT-006, band 5-6
 */
export const SEED_MONT_A15: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C1-PAT-SEQ-0121",
      montessori_ref: "WB15-D1",
      content_version: 2,
      template_code: "GT-011",
      title: "Quy luật lặp quả Táo - Chuối (AB)",
      instruction: "Bé chọn loại quả tiếp theo theo đúng quy luật nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.PAT.01"],
      learning_objective_codes: ["LO-C1.PAT.01-01"],
      what_tags: ["category"],
      thinking_tags: ["infer", "predict"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé chọn quả điền vào ô trống cho đúng quy luật!",
      matrix: {
        rows: 2,
        cols: 2,
        cells: [
          {
            row: 0,
            col: 0,
            asset: {
              kind: "emoji",
              ref: "EMJ-red-apple",
            },
          },
          {
            row: 0,
            col: 1,
            asset: {
              kind: "emoji",
              ref: "EMJ-banana",
            },
          },
          {
            row: 1,
            col: 0,
            asset: {
              kind: "emoji",
              ref: "EMJ-banana",
            },
          },
          {
            row: 1,
            col: 1,
            asset: null,
          },
        ],
      },
      options: [
        {
          option_id: "op-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
          is_correct: true,
        },
        {
          option_id: "op-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-banana",
          },
          is_correct: false,
        },
        {
          option_id: "op-3",
          asset: {
            kind: "emoji",
            ref: "EMJ-orange",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      grid_size: 2,
      distractor_count: 2,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-PAT-SEQ-0122",
      montessori_ref: "WB15-D1",
      content_version: 2,
      template_code: "GT-011",
      title: "Quy luật chuỗi 3 phần tử (ABC)",
      instruction: "Bé hãy tìm hình tiếp theo của chuỗi quy luật ABC!",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C1.PAT.04"],
      learning_objective_codes: ["LO-C1.PAT.04-01"],
      what_tags: ["geometry"],
      thinking_tags: ["infer", "predict"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé chọn hình điền vào ô trống cho đủ ba màu!",
      matrix: {
        rows: 3,
        cols: 3,
        cells: [
          {
            row: 0,
            col: 0,
            asset: {
              kind: "emoji",
              ref: "EMJ-red-circle",
            },
          },
          {
            row: 0,
            col: 1,
            asset: {
              kind: "emoji",
              ref: "EMJ-green-circle",
            },
          },
          {
            row: 0,
            col: 2,
            asset: {
              kind: "emoji",
              ref: "EMJ-blue-circle",
            },
          },
          {
            row: 1,
            col: 0,
            asset: {
              kind: "emoji",
              ref: "EMJ-green-circle",
            },
          },
          {
            row: 1,
            col: 1,
            asset: {
              kind: "emoji",
              ref: "EMJ-blue-circle",
            },
          },
          {
            row: 1,
            col: 2,
            asset: {
              kind: "emoji",
              ref: "EMJ-red-circle",
            },
          },
          {
            row: 2,
            col: 0,
            asset: {
              kind: "emoji",
              ref: "EMJ-blue-circle",
            },
          },
          {
            row: 2,
            col: 1,
            asset: {
              kind: "emoji",
              ref: "EMJ-red-circle",
            },
          },
          {
            row: 2,
            col: 2,
            asset: null,
          },
        ],
      },
      options: [
        {
          option_id: "op-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-green-circle",
          },
          is_correct: true,
        },
        {
          option_id: "op-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-circle",
          },
          is_correct: false,
        },
        {
          option_id: "op-3",
          asset: {
            kind: "emoji",
            ref: "EMJ-blue-circle",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      grid_size: 3,
      distractor_count: 2,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
];
