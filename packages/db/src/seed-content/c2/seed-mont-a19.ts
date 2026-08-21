import type { ContentSeed } from "../types.js";

/**
 * Batch: SEED-MONT-A19
 * Workbook 19: Tư duy hình khối (Khối 3D & Phối cảnh)
 * 2 dạng bài (WB19-D1, WB19-D2), 4 level, GT-005, band 5-6
 */
export const SEED_MONT_A19: ContentSeed<unknown, unknown>[] = [
  // WB19-D1 Level 1 (Diff 3 - Standard)
  {
    header: {
      code: "GL-C2-GEO-MATCH-0101",
      content_version: 1,
      template_code: "GT-005",
      title: "Ghép đồ vật với khối hình tương ứng",
      instruction: "Bé nối quả bóng và hộp quà với khối hình dạng đúng!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C2.GEO.01"],
      learning_objective_codes: ["LO-C2.GEO.01-01"],
      what_tags: ["geometry"],
      thinking_tags: ["observe", "match"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      pairs: [
        {
          left: { id: "ball", label: "Quả bóng tròn", emoji: "⚽" },
          right: { id: "sphere", label: "Khối cầu", emoji: "⚪" },
        },
        {
          left: { id: "box", label: "Hộp quà vuông", emoji: "🎁" },
          right: { id: "cube", label: "Khối lập phương", emoji: "🧊" },
        },
        {
          left: { id: "can", label: "Lon nước ngọt", emoji: "🥫" },
          right: { id: "cylinder", label: "Khối trụ", emoji: "🛢️" },
        },
      ],
      scaffolding: {
        l1_nudge: "Quả bóng tròn và khối cầu cùng phát sáng",
        l2_guidance: "Bàn tay ảo chỉ 'Quả bóng tròn có hình dạng khối cầu'",
        l3_demo: "Bàn tay ảo nối quả bóng sang khối cầu làm mẫu",
      },
    },
    difficulty_params: { pair_count: 3 },
  },
  // WB19-D1 Level 2 (Diff 4 - Premium)
  {
    header: {
      code: "GL-C2-GEO-MATCH-0102",
      content_version: 1,
      template_code: "GT-005",
      title: "Phân loại 4 đồ vật theo khối hình học",
      instruction: "Bé hãy ghép 4 đồ vật với dạng khối 3D tương ứng!",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C2.GEO.02"],
      learning_objective_codes: ["LO-C2.GEO.02-01"],
      what_tags: ["geometry"],
      thinking_tags: ["observe", "match"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      pairs: [
        {
          left: { id: "hat", label: "Mũ sinh nhật", emoji: "🎉" },
          right: { id: "cone", label: "Khối nón", emoji: "🍦" },
        },
        {
          left: { id: "dice", label: "Hạt xúc xắc", emoji: "🎲" },
          right: { id: "cube", label: "Khối lập phương", emoji: "🧊" },
        },
        {
          left: { id: "globe", label: "Quả địa cầu", emoji: "🌍" },
          right: { id: "sphere", label: "Khối cầu", emoji: "⚪" },
        },
        {
          left: { id: "drum", label: "Chiếc trống nhỏ", emoji: "🥁" },
          right: { id: "cylinder", label: "Khối trụ", emoji: "🛢️" },
        },
      ],
      scaffolding: {
        l1_nudge: "Mũ sinh nhật và cây kem ốc quế nhấp nháy",
        l2_guidance:
          "Bàn tay ảo chỉ vào đỉnh nhọn của mũ sinh nhật và khối nón",
        l3_demo: "Bàn tay ảo nối mẫu mũ sinh nhật",
      },
    },
    difficulty_params: { pair_count: 4 },
  },
  // WB19-D2 Level 1 (Diff 3 - Standard)
  {
    header: {
      code: "GL-C2-PER-MATCH-0103",
      content_version: 1,
      template_code: "GT-005",
      title: "Nhìn ngôi nhà từ phía trước và từ trên cao",
      instruction: "Bé nối đồ vật với hình nhìn từ trên cao nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C2.PER.01"],
      learning_objective_codes: ["LO-C2.PER.01-01"],
      what_tags: ["space"],
      thinking_tags: ["observe", "infer"],
      theme_tag: "park",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      pairs: [
        {
          left: { id: "house", label: "Ngôi nhà nhìn thẳng", emoji: "🏠" },
          right: { id: "roof-top", label: "Mái nhà nhìn từ trên", emoji: "🔺" },
        },
        {
          left: { id: "car", label: "Ô tô nhìn ngang", emoji: "🚗" },
          right: { id: "car-top", label: "Nóc ô tô nhìn từ trên", emoji: "🚘" },
        },
      ],
      scaffolding: {
        l1_nudge: "Mái nhà tam giác phát sáng",
        l2_guidance:
          "Bàn tay ảo di chuyển từ ngôi nhà lên góc nhìn từ trên cao",
        l3_demo: "Bàn tay ảo nối mẫu ngôi nhà",
      },
    },
    difficulty_params: { pair_count: 2 },
  },
  // WB19-D2 Level 2 (Diff 4 - Premium)
  {
    header: {
      code: "GL-C2-PER-MATCH-0104",
      content_version: 1,
      template_code: "GT-005",
      title: "Góc nhìn từ trên cao của 3 đồ vật",
      instruction: "Bé tìm hình chiếu từ trên xuống của từng đồ vật!",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C2.PER.03"],
      learning_objective_codes: ["LO-C2.PER.03-01"],
      what_tags: ["space"],
      thinking_tags: ["observe", "infer"],
      theme_tag: "park",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      pairs: [
        {
          left: { id: "cup", label: "Cốc nước", emoji: "🥛" },
          right: { id: "cup-top", label: "Miệng cốc tròn", emoji: "⭕" },
        },
        {
          left: { id: "table", label: "Chiếc bàn chữ nhật", emoji: "🪑" },
          right: { id: "table-top", label: "Mặt bàn phẳng", emoji: "🟫" },
        },
        {
          left: { id: "tent", label: "Lều trại chóp", emoji: "⛺" },
          right: { id: "tent-top", label: "Chóp lều", emoji: "🔺" },
        },
      ],
      scaffolding: {
        l1_nudge: "Miệng cốc tròn phát sáng",
        l2_guidance:
          "Bàn tay ảo chỉ 'Cốc nước nhìn từ trên xuống là một hình tròn'",
        l3_demo: "Bàn tay ảo nối cốc nước với hình tròn",
      },
    },
    difficulty_params: { pair_count: 3 },
  },
];
