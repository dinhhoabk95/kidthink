import type { ContentSeed } from "../types.js";

/**
 * Batch: SEED-MONT-A02
 * Workbook 02: Thứ tự dãy số (Phần Lô A)
 * 2 dạng bài (WB02-D1, WB02-D3), 4 level, GT-001 và GT-006, band 3-4
 */
export const SEED_MONT_A02: ContentSeed<unknown, unknown>[] = [
  // WB02-D1 Level 1 (Diff 1 - Free)
  {
    header: {
      code: "GL-C1-NREC-CARD-0107",
      content_version: 1,
      template_code: "GT-001",
      title: "Điền số còn thiếu vào đoàn tàu 1-5",
      instruction: "Bé chọn số còn thiếu để hoàn thành đoàn tàu nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.NREC.09"],
      learning_objective_codes: ["LO-C1.NREC.09-01"],
      what_tags: ["numbers", "wb02"],
      thinking_tags: ["sequence", "identify"],
      theme_tag: "transport",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      sequence: ["1", "2", "?", "4", "5"],
      missing_index: 2,
      target: "3",
      options: [
        { id: "opt-1", text: "2", is_correct: false },
        { id: "opt-2", text: "3", is_correct: true },
        { id: "opt-3", text: "6", is_correct: false },
      ],
      scaffolding: {
        l1_nudge: "Ô dấu hỏi chấm nhấp nháy phát sáng",
        l2_guidance: "Bàn tay ảo đếm thành tiếng 'Một, hai... ba!'",
        l3_demo: "Bàn tay ảo chọn thẻ số 3",
      },
    },
    difficulty_params: { count: 3, distractor_count: 2 },
  },
  // WB02-D1 Level 2 (Diff 2 - Login)
  {
    header: {
      code: "GL-C1-NREC-CARD-0108",
      content_version: 1,
      template_code: "GT-001",
      title: "Điền số còn thiếu vào đoàn tàu 6-10",
      instruction: "Số nào còn thiếu ở ô trống, bé hãy chọn nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.NREC.09"],
      learning_objective_codes: ["LO-C1.NREC.09-01"],
      what_tags: ["numbers", "wb02"],
      thinking_tags: ["sequence", "identify"],
      theme_tag: "transport",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      sequence: ["6", "?", "8", "9", "10"],
      missing_index: 1,
      target: "7",
      options: [
        { id: "opt-1", text: "5", is_correct: false },
        { id: "opt-2", text: "7", is_correct: true },
        { id: "opt-3", text: "8", is_correct: false },
      ],
      scaffolding: {
        l1_nudge: "Viền ô trống phát sáng nhẹ",
        l2_guidance: "Bàn tay ảo chỉ vào ô trống và đọc 'Sáu, bảy, tám'",
        l3_demo: "Bàn tay ảo chọn số 7 làm mẫu",
      },
    },
    difficulty_params: { count: 3, distractor_count: 2 },
  },
  // WB02-D3 Level 1 (Diff 1 - Free)
  {
    header: {
      code: "GL-C1-SEQ-PAT-0109",
      content_version: 1,
      template_code: "GT-006",
      title: "Xếp thứ tự 3 toa tàu",
      instruction: "Bé kéo các toa tàu theo thứ tự 1 đến 3 nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.NREC.09"],
      learning_objective_codes: ["LO-C1.NREC.09-01"],
      what_tags: ["numbers", "wb02"],
      thinking_tags: ["sequence", "order"],
      theme_tag: "train",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      items: [
        { id: "c2", label: "2", position: 0 },
        { id: "c1", label: "1", position: 1 },
        { id: "c3", label: "3", position: 2 },
      ],
      correct_order: ["1", "2", "3"],
      scaffolding: {
        l1_nudge: "Toa số 1 nhấp nháy viền",
        l2_guidance: "Bàn tay ảo chỉ vào toa 1 rồi trỏ vào vị trí đầu tiên",
        l3_demo: "Bàn tay ảo kéo toa 1 vào vị trí đầu tiên",
      },
    },
    difficulty_params: { item_count: 3 },
  },
  // WB02-D3 Level 2 (Diff 2 - Login)
  {
    header: {
      code: "GL-C1-SEQ-PAT-0110",
      content_version: 1,
      template_code: "GT-006",
      title: "Xếp thứ tự 4 toa tàu",
      instruction: "Bé xếp các toa theo thứ tự 1 đến 4 nhé!",
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
      items: [
        { id: "c4", label: "4", position: 0 },
        { id: "c2", label: "2", position: 1 },
        { id: "c1", label: "1", position: 2 },
        { id: "c3", label: "3", position: 3 },
      ],
      correct_order: ["1", "2", "3", "4"],
      scaffolding: {
        l1_nudge: "Toa mang số 1 phát sáng",
        l2_guidance: "Bàn tay ảo chỉ vào toa 1 rồi di chuyển về vị trí 1",
        l3_demo: "Bàn tay ảo kéo toa 1 mẫu",
      },
    },
    difficulty_params: { item_count: 4 },
  },
];
