import type { ContentSeed } from "../types.js";

/**
 * Batch: SEED-MONT-A03
 * Workbook 03: Thử tài tìm bóng đúng
 * 2 dạng bài, 5 level, GT-001 và GT-005, band 3-4
 * WB03-D2 giữ 2 level (sàn tối thiểu); level thứ ba gỡ ở T99 WP99.0 để C4 về trần 9.
 */
export const SEED_MONT_A03: ContentSeed<unknown, unknown>[] = [
  // WB03-D1 Level 1 (Diff 1 - Free)
  {
    header: {
      code: "GL-C4-VIS-CARD-0101",
      content_version: 1,
      template_code: "GT-001",
      title: "Tìm bóng của chú hươu cao cổ",
      instruction: "Bé hãy chọn bóng đúng của chú hươu cao cổ nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C4.VIS.02"],
      learning_objective_codes: ["LO-C4.VIS.02-01"],
      what_tags: ["animals", "wb03"],
      thinking_tags: ["visual", "match"],
      theme_tag: "safari",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      target_item: { id: "g1", emoji: "🦒", name: "Hươu cao cổ" },
      options: [
        {
          id: "opt-1",
          label: "Bóng hươu cao cổ",
          is_correct: true,
          emoji: "🦒",
        },
        { id: "opt-2", label: "Bóng chú voi", is_correct: false, emoji: "🐘" },
        { id: "opt-3", label: "Bóng chú ngựa", is_correct: false, emoji: "🐎" },
      ],
      scaffolding: {
        l1_nudge: "Viền chiếc cổ dài của bóng đúng phát sáng nhẹ",
        l2_guidance:
          "Bàn tay ảo so sánh chiếc cổ dài của hình mẫu và bóng đúng",
        l3_demo: "Bàn tay ảo chạm vào bóng hươu cao cổ làm mẫu",
      },
    },
    difficulty_params: { count: 3, distractor_count: 2 },
  },
  // WB03-D1 Level 2 (Diff 2 - Login)
  {
    header: {
      code: "GL-C4-VIS-CARD-0102",
      content_version: 1,
      template_code: "GT-001",
      title: "Tìm bóng của chiếc ô tô",
      instruction: "Bé hãy chọn chiếc bóng vừa vặn với ô tô nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C4.VIS.02"],
      learning_objective_codes: ["LO-C4.VIS.02-01"],
      what_tags: ["vehicles", "wb03"],
      thinking_tags: ["visual", "match"],
      theme_tag: "transport",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      target_item: { id: "car1", emoji: "🚗", name: "Ô tô con" },
      options: [
        { id: "opt-1", label: "Bóng máy bay", is_correct: false, emoji: "✈️" },
        { id: "opt-2", label: "Bóng ô tô con", is_correct: true, emoji: "🚗" },
        { id: "opt-3", label: "Bóng xe buýt", is_correct: false, emoji: "🚌" },
      ],
      scaffolding: {
        l1_nudge: "Hai bánh xe tròn của bóng ô tô nhấp nháy",
        l2_guidance: "Bàn tay ảo chỉ vào đường viền mui xe và bánh xe",
        l3_demo: "Bàn tay ảo chọn bóng ô tô",
      },
    },
    difficulty_params: { count: 3, distractor_count: 2 },
  },
  // WB03-D1 Level 3 (Diff 3 - Standard)
  {
    header: {
      code: "GL-C4-VIS-CARD-0103",
      content_version: 1,
      template_code: "GT-001",
      title: "Tìm bóng của chú bướm xinh",
      instruction: "Bé tìm bóng của chú bướm đang xòe cánh nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C4.VIS.01"],
      learning_objective_codes: ["LO-C4.VIS.01-01"],
      what_tags: ["insects", "wb03"],
      thinking_tags: ["visual", "compare"],
      theme_tag: "garden",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      target_item: { id: "bf1", emoji: "🦋", name: "Bướm hoa" },
      options: [
        { id: "opt-1", label: "Bóng chú ong", is_correct: false, emoji: "🐝" },
        { id: "opt-2", label: "Bóng bướm hoa", is_correct: true, emoji: "🦋" },
        {
          id: "opt-3",
          label: "Bóng chuồn chuồn",
          is_correct: false,
          emoji: "🦗",
        },
      ],
      scaffolding: {
        l1_nudge: "Viền đôi cánh bướm đối xứng phát sáng",
        l2_guidance: "Bàn tay ảo chỉ vào hai cánh bướm xoè rộng",
        l3_demo: "Bàn tay ảo chạm bóng bướm hoa",
      },
    },
    difficulty_params: { count: 3, distractor_count: 2 },
  },
  // WB03-D2 Level 1 (Diff 1 - Free)
  {
    header: {
      code: "GL-C4-VIS-MATCH-0104",
      content_version: 1,
      template_code: "GT-005",
      title: "Ghép đôi 2 con vật với bóng",
      instruction: "Bé nối từng con vật với chiếc bóng tương ứng nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C4.VIS.02"],
      learning_objective_codes: ["LO-C4.VIS.02-01"],
      what_tags: ["animals", "wb03"],
      thinking_tags: ["visual", "match"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      pairs: [
        {
          left: { id: "cat", emoji: "🐱" },
          right: { id: "cat-shadow", emoji: "🐱" },
        },
        {
          left: { id: "rabbit", emoji: "🐰" },
          right: { id: "rabbit-shadow", emoji: "🐰" },
        },
      ],
      scaffolding: {
        l1_nudge: "Chú mèo và bóng mèo cùng sáng nhẹ",
        l2_guidance: "Bàn tay ảo chỉ từ chú mèo sang bóng mèo",
        l3_demo: "Bàn tay ảo nối mẫu cặp chú mèo",
      },
    },
    difficulty_params: { pair_count: 2 },
  },
  // WB03-D2 Level 2 (Diff 2 - Login)
  {
    header: {
      code: "GL-C4-VIS-MATCH-0105",
      content_version: 1,
      template_code: "GT-005",
      title: "Ghép đôi 3 con vật với bóng",
      instruction: "Bé tìm bóng cho mèo, thỏ và rùa nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C4.VIS.02"],
      learning_objective_codes: ["LO-C4.VIS.02-01"],
      what_tags: ["animals", "wb03"],
      thinking_tags: ["visual", "match"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      pairs: [
        {
          left: { id: "cat", emoji: "🐱" },
          right: { id: "cat-shadow", emoji: "🐱" },
        },
        {
          left: { id: "rabbit", emoji: "🐰" },
          right: { id: "rabbit-shadow", emoji: "🐰" },
        },
        {
          left: { id: "turtle", emoji: "🐢" },
          right: { id: "turtle-shadow", emoji: "🐢" },
        },
      ],
      scaffolding: {
        l1_nudge: "Tai thỏ dài và bóng tai thỏ nhấp nháy",
        l2_guidance: "Bàn tay ảo chỉ vào đôi tai dài của chú thỏ",
        l3_demo: "Bàn tay ảo nối mẫu cặp thỏ",
      },
    },
    difficulty_params: { pair_count: 3 },
  },
];
