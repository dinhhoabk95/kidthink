import type { ContentSeed } from "../types.js";

/**
 * Batch: SEED-MONT-B02
 * Workbook 02: Thứ tự dãy số (Phần Lô B - GT-008 drag-to-slot)
 * 1 dạng bài (WB02-D2), 2 level, GT-008, band 3-4
 */
export const SEED_MONT_B02: ContentSeed<unknown, unknown>[] = [
  // WB02-D2 Level 1 (Diff 2 - Login)
  {
    header: {
      code: "GL-C1-SEQ-SLOT-0131",
      content_version: 1,
      template_code: "GT-008",
      title: "Kéo 3 toa tàu vào đường ray thứ tự 1-3",
      instruction: "Bé kéo các toa số 1, 2, 3 vào đúng ô nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.NREC.09"],
      learning_objective_codes: ["LO-C1.NREC.09-01"],
      what_tags: ["numbers", "wb02"],
      thinking_tags: ["sequence", "order"],
      theme_tag: "train",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Kéo các toa tàu theo thứ tự 1, 2, 3",
      slots: [
        { slot_id: "slot_1", label: "Toa 1", expected_item_id: "car_1" },
        { slot_id: "slot_2", label: "Toa 2", expected_item_id: "car_2" },
        { slot_id: "slot_3", label: "Toa 3", expected_item_id: "car_3" },
      ],
      items: [
        { item_id: "car_2", label: "Số 2", asset: { kind: "emoji", ref: "2️⃣" } },
        { item_id: "car_1", label: "Số 1", asset: { kind: "emoji", ref: "1️⃣" } },
        { item_id: "car_3", label: "Số 3", asset: { kind: "emoji", ref: "3️⃣" } },
      ],
      scaffolding: {
        l1_nudge: "Toa số 1 và ô đầu tiên phát sáng",
        l2_guidance: "Bàn tay ảo chỉ 'Toa số 1 đứng đầu tiên'",
        l3_demo: "Bàn tay ảo kéo toa 1 vào ô 1 làm mẫu",
      },
    },
    difficulty_params: { slot_count: 3, distractor_count: 0 },
  },
  // WB02-D2 Level 2 (Diff 3 - Standard)
  {
    header: {
      code: "GL-C1-SEQ-SLOT-0132",
      content_version: 1,
      template_code: "GT-008",
      title: "Xếp 4 số vào ô trống theo thứ tự 1-4",
      instruction: "Bé xếp 4 số vào đường ray theo thứ tự tăng dần!",
      age_min: 3,
      age_max: 4,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.NREC.09"],
      learning_objective_codes: ["LO-C1.NREC.09-01"],
      what_tags: ["numbers", "wb02"],
      thinking_tags: ["sequence", "order"],
      theme_tag: "train",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Xếp các số vào ô theo thứ tự 1 đến 4",
      slots: [
        { slot_id: "slot_1", label: "Ô 1", expected_item_id: "num_1" },
        { slot_id: "slot_2", label: "Ô 2", expected_item_id: "num_2" },
        { slot_id: "slot_3", label: "Ô 3", expected_item_id: "num_3" },
        { slot_id: "slot_4", label: "Ô 4", expected_item_id: "num_4" },
      ],
      items: [
        { item_id: "num_3", label: "Số 3", asset: { kind: "emoji", ref: "3️⃣" } },
        { item_id: "num_1", label: "Số 1", asset: { kind: "emoji", ref: "1️⃣" } },
        { item_id: "num_4", label: "Số 4", asset: { kind: "emoji", ref: "4️⃣" } },
        { item_id: "num_2", label: "Số 2", asset: { kind: "emoji", ref: "2️⃣" } },
      ],
      scaffolding: {
        l1_nudge: "Số 1 nhấp nháy phát sáng nhẹ",
        l2_guidance: "Bàn tay ảo đếm nhịp 'Một, hai, ba, bốn'",
        l3_demo: "Bàn tay ảo kéo số 1 vào ô 1",
      },
    },
    difficulty_params: { slot_count: 4, distractor_count: 0 },
  },
];
