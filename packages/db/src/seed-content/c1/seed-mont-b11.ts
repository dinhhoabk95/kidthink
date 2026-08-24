import type { ContentSeed } from "#src/seed-content/types";

/**
 * Batch: SEED-MONT-B11
 * Workbook 11: Điền số thông minh (Phần Lô B - GT-008 drag-to-slot)
 * 1 dạng bài (WB11-D2), 2 level, GT-008, band 4-5
 */
export const SEED_MONT_B11: ContentSeed<unknown, unknown>[] = [
  // WB11-D2 Level 1 (Diff 2 - Login)
  {
    header: {
      code: "GL-C1-CNT-SLOT-0133",
      content_version: 1,
      template_code: "GT-008",
      title: "Kéo số chẵn vào trục đếm cách 2",
      instruction: "Bé kéo các số chẵn vào đúng ô trên trục nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.CNT.05"],
      learning_objective_codes: ["LO-C1.CNT.05-01"],
      what_tags: ["number"],
      thinking_tags: ["count", "sequence"],
      theme_tag: "park",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Điền các số 2, 4, 6 vào trục số",
      slots: [
        { slot_id: "s_2", label: "2", expected_item_id: "num_2" },
        { slot_id: "s_4", label: "4", expected_item_id: "num_4" },
        { slot_id: "s_6", label: "6", expected_item_id: "num_6" },
      ],
      items: [
        { item_id: "num_4", label: "4", asset: { kind: "emoji", ref: "4️⃣" } },
        { item_id: "num_2", label: "2", asset: { kind: "emoji", ref: "2️⃣" } },
        { item_id: "num_6", label: "6", asset: { kind: "emoji", ref: "6️⃣" } },
      ],
      scaffolding: {
        l1_nudge: "Ô số 2 đầu tiên phát sáng",
        l2_guidance: "Bàn tay ảo đếm 'Hai... Bốn... Sáu'",
        l3_demo: "Bàn tay ảo kéo số 2 vào ô đầu",
      },
    },
    difficulty_params: { slot_count: 3, distractor_count: 0 },
  },
  // WB11-D2 Level 2 (Diff 3 - Standard)
  {
    header: {
      code: "GL-C1-CNT-SLOT-0134",
      content_version: 1,
      template_code: "GT-008",
      title: "Kéo số lẻ vào chuỗi đếm nhảy cóc 1-7",
      instruction: "Bé hoàn thành chuỗi số lẻ cách 2 đơn vị!",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.CNT.05"],
      learning_objective_codes: ["LO-C1.CNT.05-01"],
      what_tags: ["number"],
      thinking_tags: ["count", "sequence"],
      theme_tag: "park",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Điền các số 1, 3, 5, 7 vào ô trống",
      slots: [
        { slot_id: "s_1", label: "1", expected_item_id: "num_1" },
        { slot_id: "s_3", label: "3", expected_item_id: "num_3" },
        { slot_id: "s_5", label: "5", expected_item_id: "num_5" },
        { slot_id: "s_7", label: "7", expected_item_id: "num_7" },
      ],
      items: [
        { item_id: "num_5", label: "5", asset: { kind: "emoji", ref: "5️⃣" } },
        { item_id: "num_1", label: "1", asset: { kind: "emoji", ref: "1️⃣" } },
        { item_id: "num_7", label: "7", asset: { kind: "emoji", ref: "7️⃣" } },
        { item_id: "num_3", label: "3", asset: { kind: "emoji", ref: "3️⃣" } },
      ],
      scaffolding: {
        l1_nudge: "Số 1 nhấp nháy phát sáng",
        l2_guidance: "Bàn tay ảo đếm 'Một, ba, năm, bảy'",
        l3_demo: "Bàn tay ảo kéo số 1 vào ô 1 làm mẫu",
      },
    },
    difficulty_params: { slot_count: 4, distractor_count: 0 },
  },
];
