import type { ContentSeed } from "#src/seed-content/types";

/**
 * Batch: SEED-MONT-B15
 * Workbook 15: Cùng bé tìm quy luật (Phần Lô B - GT-008 drag-to-slot)
 * 1 dạng bài (WB15-D2), 2 level, GT-008, band 5-6
 */
export const SEED_MONT_B15: ContentSeed<unknown, unknown>[] = [
  // WB15-D2 Level 1 (Diff 3 - Standard)
  {
    header: {
      code: "GL-C1-PAT-SLOT-0135",
      content_version: 1,
      template_code: "GT-008",
      title: "Kéo hình hoàn thành quy luật hoa quả AB",
      instruction: "Bé kéo đúng quả vào các ô theo quy luật nhé!",
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
      prompt: "Hoàn thành quy luật: Táo - Chuối - Táo - Chuối",
      slots: [
        { slot_id: "s1", label: "Ô 1", expected_item_id: "apple_1" },
        { slot_id: "s2", label: "Ô 2", expected_item_id: "banana_1" },
        { slot_id: "s3", label: "Ô 3", expected_item_id: "apple_2" },
        { slot_id: "s4", label: "Ô 4", expected_item_id: "banana_2" },
      ],
      items: [
        {
          item_id: "banana_1",
          label: "Chuối",
          asset: { kind: "emoji", ref: "🍌" },
        },
        {
          item_id: "apple_1",
          label: "Táo",
          asset: { kind: "emoji", ref: "🍎" },
        },
        {
          item_id: "banana_2",
          label: "Chuối",
          asset: { kind: "emoji", ref: "🍌" },
        },
        {
          item_id: "apple_2",
          label: "Táo",
          asset: { kind: "emoji", ref: "🍎" },
        },
      ],
      scaffolding: {
        l1_nudge: "Cặp quả táo và ô đầu phát sáng",
        l2_guidance:
          "Bàn tay ảo đọc nhịp 'Táo rồi đến chuối, lặp lại là táo rồi chuối'",
        l3_demo: "Bàn tay ảo kéo quả táo vào ô 1 làm mẫu",
      },
    },
    difficulty_params: { slot_count: 4, distractor_count: 0 },
  },
  // WB15-D2 Level 2 (Diff 4 - Premium)
  {
    header: {
      code: "GL-C1-PAT-SLOT-0136",
      content_version: 1,
      template_code: "GT-008",
      title: "Kéo hình vào ma trận 2x2 quy luật màu sắc",
      instruction: "Bé điền hình vào lưới ma trận 2x2 đúng quy luật!",
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
      prompt: "Điền các hình vào ma trận 2x2",
      slots: [
        { slot_id: "s_tl", label: "Trên Trái", expected_item_id: "red_sq" },
        { slot_id: "s_tr", label: "Trên Phải", expected_item_id: "blue_sq" },
        { slot_id: "s_bl", label: "Dưới Trái", expected_item_id: "red_cir" },
        { slot_id: "s_br", label: "Dưới Phải", expected_item_id: "blue_cir" },
      ],
      items: [
        {
          item_id: "blue_sq",
          label: "Vuông xanh",
          asset: { kind: "emoji", ref: "🟦" },
        },
        {
          item_id: "red_sq",
          label: "Vuông đỏ",
          asset: { kind: "emoji", ref: "🟥" },
        },
        {
          item_id: "blue_cir",
          label: "Tròn xanh",
          asset: { kind: "emoji", ref: "🔵" },
        },
        {
          item_id: "red_cir",
          label: "Tròn đỏ",
          asset: { kind: "emoji", ref: "🔴" },
        },
      ],
      scaffolding: {
        l1_nudge: "Hình vuông đỏ ở ô trên trái phát sáng",
        l2_guidance:
          "Bàn tay ảo gợi ý 'Cột bên trái là màu đỏ, cột bên phải là màu xanh'",
        l3_demo: "Bàn tay ảo kéo hình vuông đỏ vào ô trên trái",
      },
    },
    difficulty_params: { slot_count: 4, distractor_count: 0 },
  },
];
