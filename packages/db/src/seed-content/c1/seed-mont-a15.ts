import type { ContentSeed } from "../types.js";

/**
 * Batch: SEED-MONT-A15
 * Workbook 15: Cùng bé tìm quy luật (Phần Lô A)
 * 1 dạng bài (WB15-D1), 2 level, GT-006, band 5-6
 */
export const SEED_MONT_A15: ContentSeed<unknown, unknown>[] = [
  // WB15-D1 Level 1 (Diff 3 - Standard)
  {
    header: {
      code: "GL-C1-PAT-SEQ-0121",
      content_version: 1,
      template_code: "GT-006",
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
      theme_tag: "fruit",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      pattern_type: "AB",
      sequence: [
        { id: "s1", emoji: "🍎" },
        { id: "s2", emoji: "🍌" },
        { id: "s3", emoji: "🍎" },
        { id: "s4", emoji: "🍌" },
        { id: "s5", emoji: "🍎" },
      ],
      next_item: { id: "ans", emoji: "🍌" },
      scaffolding: {
        l1_nudge: "Cặp quả táo và chuối đầu tiên sáng cùng lúc",
        l2_guidance:
          "Bàn tay ảo đọc nhịp điệu 'Táo, chuối, táo, chuối... táo, rồi đến...'",
        l3_demo: "Bàn tay ảo chọn quả chuối làm mẫu",
      },
    },
    difficulty_params: { pattern_length: 5 },
  },
  // WB15-D1 Level 2 (Diff 4 - Premium)
  {
    header: {
      code: "GL-C1-PAT-SEQ-0122",
      content_version: 1,
      template_code: "GT-006",
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
      theme_tag: "shape",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      pattern_type: "ABC",
      sequence: [
        { id: "p1", emoji: "🔴" },
        { id: "p2", emoji: "🟢" },
        { id: "p3", emoji: "🔵" },
        { id: "p4", emoji: "🔴" },
        { id: "p5", emoji: "🟢" },
        { id: "p6", emoji: "🔵" },
      ],
      next_item: { id: "ans", emoji: "🔴" },
      scaffolding: {
        l1_nudge: "Nhóm 3 hình tròn đỏ - xanh lá - xanh dương phát sáng",
        l2_guidance:
          "Bàn tay ảo lặp lại chu kỳ 'Đỏ, xanh lá, xanh dương... lặp lại là Đỏ'",
        l3_demo: "Bàn tay ảo chọn hình tròn đỏ",
      },
    },
    difficulty_params: { pattern_length: 6 },
  },
];
