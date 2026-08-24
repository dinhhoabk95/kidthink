import type { ContentSeed } from "#src/seed-content/types";

/**
 * Batch: SEED-MONT-A10
 * Workbook 10: Tư duy màu sắc (Sắc độ & Phân loại màu)
 * 2 dạng bài, 4 level, GT-004 và GT-006, band 4-5
 */
export const SEED_MONT_A10: ContentSeed<unknown, unknown>[] = [
  // WB10-D1 Level 1 (Diff 2 - Login)
  {
    header: {
      code: "GL-C4-SEN-SORT-0107",
      content_version: 1,
      template_code: "GT-004",
      title: "Phân loại đồ vật theo màu Đỏ và Vàng",
      instruction: "Bé hãy xếp đồ màu đỏ và vàng vào đúng rổ nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C4.SEN.01"],
      learning_objective_codes: ["LO-C4.SEN.01-01"],
      what_tags: ["colour"],
      thinking_tags: ["sort", "compare"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      bins: [
        { id: "bin-red", label: "Rổ Đỏ", color: "red" },
        { id: "bin-yellow", label: "Rổ Vàng", color: "yellow" },
      ],
      items: [
        { id: "item-1", emoji: "🍎", target_bin: "bin-red" },
        { id: "item-2", emoji: "🍓", target_bin: "bin-red" },
        { id: "item-3", emoji: "🍌", target_bin: "bin-yellow" },
        { id: "item-4", emoji: "🍋", target_bin: "bin-yellow" },
      ],
      scaffolding: {
        l1_nudge: "Rổ Đỏ phát sáng nhẹ khi quả táo rung rinh",
        l2_guidance: "Bàn tay ảo di chuyển quả táo đỏ về phía rổ Đỏ",
        l3_demo: "Bàn tay ảo xếp quả táo đỏ vào rổ Đỏ làm mẫu",
      },
    },
    difficulty_params: { bin_count: 2, item_count: 4 },
  },
  // WB10-D1 Level 2 (Diff 3 - Standard)
  {
    header: {
      code: "GL-C4-SEN-SORT-0108",
      content_version: 1,
      template_code: "GT-004",
      title: "Phân loại 3 nhóm màu Xanh, Đỏ, Vàng",
      instruction: "Bé phân loại các đồ vật vào 3 hộp màu nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C4.SEN.01"],
      learning_objective_codes: ["LO-C4.SEN.01-01"],
      what_tags: ["colour"],
      thinking_tags: ["sort", "compare"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      bins: [
        { id: "bin-red", label: "Hộp Đỏ", color: "red" },
        { id: "bin-yellow", label: "Hộp Vàng", color: "yellow" },
        { id: "bin-blue", label: "Hộp Xanh", color: "blue" },
      ],
      items: [
        { id: "item-1", emoji: "🍎", target_bin: "bin-red" },
        { id: "item-2", emoji: "🍌", target_bin: "bin-yellow" },
        { id: "item-3", emoji: "🫐", target_bin: "bin-blue" },
        { id: "item-4", emoji: "🚗", target_bin: "bin-red" },
        { id: "item-5", emoji: "🐥", target_bin: "bin-yellow" },
        { id: "item-6", emoji: "🐳", target_bin: "bin-blue" },
      ],
      scaffolding: {
        l1_nudge: "Quả việt quất và hộp Xanh cùng nhấp nháy",
        l2_guidance: "Bàn tay ảo chỉ từ quả việt quất vào hộp Xanh",
        l3_demo: "Bàn tay ảo kéo quả việt quất vào hộp Xanh",
      },
    },
    difficulty_params: { bin_count: 3, item_count: 6 },
  },
  // WB10-D2 Level 1 (Diff 2 - Login)
  {
    header: {
      code: "GL-C4-SEN-SEQ-0109",
      content_version: 1,
      template_code: "GT-006",
      title: "Xếp 3 sắc độ màu từ nhạt đến đậm",
      instruction: "Bé xếp các thẻ màu từ nhạt nhất đến đậm nhất nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C4.SEN.01"],
      learning_objective_codes: ["LO-C4.SEN.01-01"],
      what_tags: ["colour"],
      thinking_tags: ["compare", "sequence"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      items: [
        {
          id: "c-dark",
          label: "Xanh đậm",
          color_hex: "#1E3A8A",
          shade_level: 3,
        },
        {
          id: "c-light",
          label: "Xanh nhạt",
          color_hex: "#93C5FD",
          shade_level: 1,
        },
        {
          id: "c-mid",
          label: "Xanh vừa",
          color_hex: "#3B82F6",
          shade_level: 2,
        },
      ],
      correct_order: ["Xanh nhạt", "Xanh vừa", "Xanh đậm"],
      scaffolding: {
        l1_nudge: "Thẻ màu xanh nhạt nhất sáng viền",
        l2_guidance: "Bàn tay ảo chỉ từ thẻ nhạt nhất đến vị trí đầu tiên",
        l3_demo: "Bàn tay ảo kéo thẻ xanh nhạt vào ô đầu",
      },
    },
    difficulty_params: { item_count: 3 },
  },
  // WB10-D2 Level 2 (Diff 3 - Standard)
  {
    header: {
      code: "GL-C4-SEN-SEQ-0110",
      content_version: 1,
      template_code: "GT-006",
      title: "Xếp 4 sắc độ màu hồng nhạt đến đậm",
      instruction: "Bé xếp dải màu hồng theo thứ tự từ nhạt đến đậm!",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C4.SEN.01"],
      learning_objective_codes: ["LO-C4.SEN.01-01"],
      what_tags: ["colour"],
      thinking_tags: ["compare", "sequence"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      items: [
        { id: "p-4", label: "Hồng đậm nhất", shade_level: 4 },
        { id: "p-2", label: "Hồng vừa", shade_level: 2 },
        { id: "p-1", label: "Hồng phấn nhạt", shade_level: 1 },
        { id: "p-3", label: "Hồng sen", shade_level: 3 },
      ],
      correct_order: [
        "Hồng phấn nhạt",
        "Hồng vừa",
        "Hồng sen",
        "Hồng đậm nhất",
      ],
      scaffolding: {
        l1_nudge: "Thẻ hồng phấn nhạt phát sáng nhẹ",
        l2_guidance: "Bàn tay ảo di chuyển chỉ từng bậc màu tăng dần độ đậm",
        l3_demo: "Bàn tay ảo xếp thẻ hồng nhạt nhất mẫu",
      },
    },
    difficulty_params: { item_count: 4 },
  },
];
