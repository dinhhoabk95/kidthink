import type { ContentSeed } from "#src/seed-content/types";

/**
 * Batch: SEED-MONT-A01
 * Workbook 01: Nhận biết số (Phạm vi 0–10)
 * 3 dạng bài, 6 level, GT-001 và GT-003, band 3-4
 */
export const SEED_MONT_A01: ContentSeed<unknown, unknown>[] = [
  // WB01-D1 Level 1 (Diff 1 - Free)
  {
    header: {
      code: "GL-C1-NREC-CARD-0101",
      content_version: 1,
      template_code: "GT-001",
      title: "Chạm vào số 3",
      instruction: "Bé hãy chạm vào số 3 nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.NREC.01"],
      learning_objective_codes: ["LO-C1.NREC.01-01"],
      what_tags: ["number"],
      thinking_tags: ["observe"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      target: 3,
      options: [
        { id: "opt-1", text: "3", is_correct: true },
        { id: "opt-2", text: "8", is_correct: false },
        { id: "opt-3", text: "5", is_correct: false },
      ],
      scaffolding: {
        l1_nudge: "Nhấp nháy viền thẻ số 3",
        l2_guidance: "Bàn tay ảo chỉ vào số 3 và đọc 'Ba'",
        l3_demo: "Bàn tay ảo tự động chạm vào số 3 làm mẫu",
      },
    },
    difficulty_params: { count: 3, distractor_count: 2 },
  },
  // WB01-D1 Level 2 (Diff 2 - Login)
  {
    header: {
      code: "GL-C1-NREC-CARD-0102",
      content_version: 1,
      template_code: "GT-001",
      title: "Tìm thẻ số 5",
      instruction: "Bé chọn thẻ số 5 giúp bạn gấu nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.NREC.02"],
      learning_objective_codes: ["LO-C1.NREC.02-01"],
      what_tags: ["number"],
      thinking_tags: ["observe"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      target: 5,
      options: [
        { id: "opt-1", text: "2", is_correct: false },
        { id: "opt-2", text: "5", is_correct: true },
        { id: "opt-3", text: "6", is_correct: false },
      ],
      scaffolding: {
        l1_nudge: "Viền thẻ số 5 phát sáng nhẹ",
        l2_guidance: "Bàn tay ảo chỉ vào số 5 và phát âm 'Năm'",
        l3_demo: "Bàn tay ảo chạm vào số 5",
      },
    },
    difficulty_params: { count: 3, distractor_count: 2 },
  },
  // WB01-D2 Level 1 (Diff 1 - Free)
  {
    header: {
      code: "GL-C1-OTO-CARD-0103",
      content_version: 1,
      template_code: "GT-001",
      title: "Đếm số chú vịt vàng",
      instruction: "Có mấy chú vịt đang bơi, bé chọn số đúng nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.OTO.01"],
      learning_objective_codes: ["LO-C1.OTO.01-01"],
      what_tags: ["category", "number"],
      thinking_tags: ["count", "match"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      items: [
        { id: "d1", emoji: "🦆" },
        { id: "d2", emoji: "🦆" },
        { id: "d3", emoji: "🦆" },
      ],
      target_count: 3,
      options: [
        { id: "opt-1", text: "2", is_correct: false },
        { id: "opt-2", text: "3", is_correct: true },
        { id: "opt-3", text: "4", is_correct: false },
      ],
      scaffolding: {
        l1_nudge: "Viền từng chú vịt sáng lần lượt",
        l2_guidance: "Bàn tay ảo chỉ vào từng chú vịt đếm 'Một, hai, ba'",
        l3_demo: "Bàn tay ảo đếm xong và chọn số 3",
      },
    },
    difficulty_params: { count: 3, distractor_count: 2 },
  },
  // WB01-D2 Level 2 (Diff 2 - Login)
  {
    header: {
      code: "GL-C1-OTO-CARD-0104",
      content_version: 1,
      template_code: "GT-001",
      title: "Đếm chú thỏ trắng",
      instruction: "Bé hãy đếm xem có bao nhiêu chú thỏ nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.OTO.04"],
      learning_objective_codes: ["LO-C1.OTO.04-01"],
      what_tags: ["category", "number"],
      thinking_tags: ["count", "match"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      items: [
        { id: "r1", emoji: "🐰" },
        { id: "r2", emoji: "🐰" },
        { id: "r3", emoji: "🐰" },
        { id: "r4", emoji: "🐰" },
      ],
      target_count: 4,
      options: [
        { id: "opt-1", text: "3", is_correct: false },
        { id: "opt-2", text: "4", is_correct: true },
        { id: "opt-3", text: "5", is_correct: false },
      ],
      scaffolding: {
        l1_nudge: "Nhấp nháy viền từng chú thỏ",
        l2_guidance: "Bàn tay ảo đếm nhịp '1, 2, 3, 4' chú thỏ",
        l3_demo: "Bàn tay ảo chọn số 4",
      },
    },
    difficulty_params: { count: 4, distractor_count: 2 },
  },
  // WB01-D3 Level 1 (Diff 1 - Free)
  {
    header: {
      code: "GL-C1-CNT-CONT-0105",
      content_version: 2,
      template_code: "GT-003",
      title: "Hái 2 quả táo vào giỏ",
      instruction: "Bé hãy kéo đúng 2 quả táo vào giỏ nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["category"],
      thinking_tags: ["count", "sort"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      source_items: [
        { id: "a1", emoji: "🍎" },
        { id: "a2", emoji: "🍎" },
        { id: "a3", emoji: "🍎" },
      ],
      target_container: { id: "basket", label: "Giỏ số 2", target_count: 2 },
      scaffolding: {
        l1_nudge: "Quả táo đầu tiên phát sáng nhẹ",
        l2_guidance: "Bàn tay ảo chỉ từ quả táo đến miệng giỏ",
        l3_demo: "Bàn tay ảo kéo 1 quả táo mẫu vào giỏ",
      },
    },
    difficulty_params: { target_count: 2, source_count: 3 },
  },
  // WB01-D3 Level 2 (Diff 2 - Login)
  {
    header: {
      code: "GL-C1-CNT-CONT-0106",
      content_version: 1,
      template_code: "GT-003",
      title: "Thu hoạch 3 củ cà rốt",
      instruction: "Bé hãy thu hoạch 3 củ cà rốt vào sọt nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.CNT.03"],
      learning_objective_codes: ["LO-C1.CNT.03-01"],
      what_tags: ["category"],
      thinking_tags: ["count", "sort"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      source_items: [
        { id: "c1", emoji: "🥕" },
        { id: "c2", emoji: "🥕" },
        { id: "c3", emoji: "🥕" },
        { id: "c4", emoji: "🥕" },
      ],
      target_container: { id: "box", label: "Sọt số 3", target_count: 3 },
      scaffolding: {
        l1_nudge: "Củ cà rốt đầu tiên nhấp nháy viền",
        l2_guidance: "Bàn tay ảo di chuyển từ củ cà rốt vào sọt",
        l3_demo: "Bàn tay ảo kéo 1 củ cà rốt vào sọt làm mẫu",
      },
    },
    difficulty_params: { target_count: 3, source_count: 4 },
  },
];
