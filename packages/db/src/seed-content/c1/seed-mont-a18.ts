import type { ContentSeed } from "#src/seed-content/types";

/**
 * Batch: SEED-MONT-A18
 * Workbook 18: Làm quen với đồng hồ (Phần Lô A - Đọc giờ đúng)
 * 1 dạng bài (WB18-D1), 2 level, GT-001, band 5-6
 */
export const SEED_MONT_A18: ContentSeed<unknown, unknown>[] = [
  // WB18-D1 Level 1 (Diff 3 - Standard)
  {
    header: {
      code: "GL-C1-MEAS-CARD-0123",
      content_version: 1,
      template_code: "GT-001",
      title: "Đọc đồng hồ 3 giờ đúng",
      instruction: "Đồng hồ đang chỉ mấy giờ, bé hãy chọn số đúng nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.MEAS.13"],
      learning_objective_codes: ["LO-C1.MEAS.13-01"],
      what_tags: ["time"],
      thinking_tags: ["observe", "match"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      clock_display: { hour: 3, minute: 0, emoji: "🕒" },
      target: "3:00",
      options: [
        { id: "opt-1", text: "3:00", is_correct: true },
        { id: "opt-2", text: "12:00", is_correct: false },
        { id: "opt-3", text: "4:00", is_correct: false },
      ],
      scaffolding: {
        l1_nudge: "Kim ngắn màu đỏ chỉ vào số 3 phát sáng",
        l2_guidance:
          "Bàn tay ảo chỉ 'Kim ngắn chỉ số 3, kim dài chỉ số 12 là 3 giờ đúng'",
        l3_demo: "Bàn tay ảo chọn thẻ 3:00 làm mẫu",
      },
    },
    difficulty_params: { count: 3, distractor_count: 2 },
  },
  // WB18-D1 Level 2 (Diff 4 - Premium)
  {
    header: {
      code: "GL-C1-MEAS-CARD-0124",
      content_version: 1,
      template_code: "GT-001",
      title: "Đọc đồng hồ 9 giờ đúng",
      instruction: "Bé nhìn kim ngắn và kim dài xem là mấy giờ nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C1.MEAS.13"],
      learning_objective_codes: ["LO-C1.MEAS.13-01"],
      what_tags: ["time"],
      thinking_tags: ["observe", "match"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      clock_display: { hour: 9, minute: 0, emoji: "🕘" },
      target: "9:00",
      options: [
        { id: "opt-1", text: "6:00", is_correct: false },
        { id: "opt-2", text: "9:00", is_correct: true },
        { id: "opt-3", text: "10:00", is_correct: false },
      ],
      scaffolding: {
        l1_nudge: "Kim ngắn chỉ số 9 nhấp nháy nhẹ",
        l2_guidance: "Bàn tay ảo chỉ vào số 9 và đọc 'Chín giờ đúng'",
        l3_demo: "Bàn tay ảo chọn 9:00",
      },
    },
    difficulty_params: { count: 3, distractor_count: 2 },
  },
];
